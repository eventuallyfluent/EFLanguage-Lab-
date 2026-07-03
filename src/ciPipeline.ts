import {
  AcquisitionVocabPath,
  AuthoredCiValidationReport,
  CiCoverageReport,
  CiCurationBatch,
  CiCurationQueueItem,
  CiPipelineContract,
  CiSentenceTarget,
  CompactCiAuthoringPacket,
  SentenceStreamBuildReport,
  SentenceStreamItem,
  SourceListImportAudit,
  SrsSupportItem
} from "./models";

export function buildCiPipelineContract(input: {
  sourceListImportAudit: SourceListImportAudit;
  acquisitionVocabPath: AcquisitionVocabPath;
  ciSentenceTargets: CiSentenceTarget[];
  ciCurationQueue: CiCurationQueueItem[];
  authorableCiCurationQueue?: CiCurationQueueItem[];
  ciCurationBatches: CiCurationBatch[];
  compactCiAuthoringPackets: CompactCiAuthoringPacket[];
  authoredCiValidationReport?: AuthoredCiValidationReport;
  sentenceStream: SentenceStreamItem[];
  sentenceStreamBuildReport: SentenceStreamBuildReport;
  ciCoverageReport: CiCoverageReport;
  srsSupport: SrsSupportItem[];
}): CiPipelineContract {
  return {
    productGoal: "10k-source-backed-ci-plus-one-path",
    primaryEngine: "ci-plus-one-sentence-stream",
    srsRole: "support-retention-only",
    steps: [
      {
        id: "source-ingest",
        order: 1,
        name: "Source List Ingest",
        purpose: "Load approved vocabulary provenance: HSK backbone plus movie/book/BLCU ranking signals.",
        inputs: ["source-lists/hsk30.csv", "source-lists/movie-frequency.*", "source-lists/book-frequency.*", "src/data/blcuFrequency.ts"],
        outputs: ["output/source-registry.json", "output/source-list-import-audit.json"],
        gate: "HSK must be file-backed; movie/book must be marked file, fixture, or missing honestly.",
        currentCount: input.sourceListImportAudit.sourceLists.reduce((sum, source) => sum + source.importedEntryCount, 0),
        status: input.sourceListImportAudit.warnings.length > 0 ? "partial" : "implemented"
      },
      {
        id: "acquisition-path",
        order: 2,
        name: "10k Acquisition Vocabulary Path",
        purpose: "Create the deduplicated ordered vocabulary path used by every CI sentence target.",
        inputs: ["source-list-import-audit", "lexicon"],
        outputs: ["output/acquisition-vocab-path.json"],
        gate: "Path must contain 10,000 unique vocabulary IDs and simplified forms.",
        currentCount: input.acquisitionVocabPath.currentCandidateCount,
        status: input.acquisitionVocabPath.currentCandidateCount === 10000 ? "implemented" : "partial"
      },
      {
        id: "ci-targets",
        order: 3,
        name: "CI Sentence Targets",
        purpose: "Turn each path word into repeated exposure requirements with known-word thresholds.",
        inputs: ["output/acquisition-vocab-path.json", "output/sentence-stream.json"],
        outputs: ["output/ci-sentence-targets.json", "output/ci-coverage-report.json"],
        gate: "Every path word receives target exposure counts, CI coverage requirements, and authorability-aware deficit reporting.",
        currentCount: input.ciSentenceTargets.length,
        status: input.ciSentenceTargets.length === input.acquisitionVocabPath.currentCandidateCount ? "implemented" : "partial"
      },
      {
        id: "curation-queue",
        order: 4,
        name: "Curation Queue",
        purpose: "Prioritize exposure deficits, then separate mathematically needed targets from authorable natural-sentence targets.",
        inputs: ["output/ci-sentence-targets.json"],
        outputs: ["output/ci-curation-queue.json", "output/ci-authorable-curation-queue.json", "output/ci-curation-batches.json"],
        gate: "Raw queue items must point to target words with exposure deficits; authorable queue keeps only ready items for normal CI authoring packets.",
        currentCount: input.authorableCiCurationQueue?.length ?? input.ciCurationQueue.length,
        status: input.ciCurationQueue.length > 0 && (input.authorableCiCurationQueue?.length ?? input.ciCurationBatches.length) > 0 ? "implemented" : "partial"
      },
      {
        id: "authoring-packets",
        order: 5,
        name: "Authoring Packets",
        purpose: "Expose sentence slots from authorability-ready targets with allowed known vocabulary and acceptance criteria.",
        inputs: ["output/ci-authorable-curation-queue.json", "output/ci-curation-batches.json", "output/acquisition-vocab-path.json"],
        outputs: ["output/ci-authoring-packets.json", "output/ci-authoring-packets.compact.json"],
        gate: "Each packet item must originate from a ready authorable queue item and identify exactly one required new word plus the known vocabulary allowance.",
        currentCount: input.compactCiAuthoringPackets.reduce((sum, packet) => sum + packet.items.reduce((itemSum, item) => itemSum + item.sentenceSlots.length, 0), 0),
        status: input.compactCiAuthoringPackets.length > 0 ? "implemented" : "partial"
      },
      {
        id: "authored-intake",
        order: 6,
        name: "Authored Sentence Intake",
        purpose: "Validate authored Mandarin before it can enter learner-facing stream output.",
        inputs: ["src/data/authoredCiSentences.ts", "output/ci-authoring-packets.compact.json"],
        outputs: ["output/authored-ci-sentences.json", "output/authored-ci-validation-report.json", "output/promoted-authored-ci-stream.json"],
        gate: "Reject wrong slot, wrong target word, missing required new word, extra vocabulary, or missing text fields.",
        currentCount: input.authoredCiValidationReport?.acceptedCount ?? 0,
        status: "implemented"
      },
      {
        id: "sentence-stream",
        order: 7,
        name: "CI Sentence Stream",
        purpose: "Publish only valid acquisition CI lines; known-only lines go to review/shadowing and bad lines go to blocked backlog.",
        inputs: ["curated packs", "promoted authored CI sentences", "output/acquisition-vocab-path.json"],
        outputs: ["output/sentence-stream.json", "output/sentence-stream-build-report.json", "output/review-only-sentences.json", "output/blocked-ci-sentences.json"],
        gate: "Every acquisition line has exactly one new word and all known words precede its threshold.",
        currentCount: input.sentenceStream.length,
        status: input.sentenceStreamBuildReport.blockedCount > 0 ? "partial" : "implemented"
      },
      {
        id: "support-surfaces",
        order: 8,
        name: "Support Surfaces",
        purpose: "Derive SRS and unlock metadata after CI exposure; these surfaces do not define progression.",
        inputs: ["output/sentence-stream.json", "output/ci-coverage-report.json"],
        outputs: ["output/srs-support.json", "output/island-unlocks.json", "output/article-unlocks.json"],
        gate: "SRS items must reference already-seen stream lines; islands/articles stay gated.",
        currentCount: input.srsSupport.length,
        status: input.srsSupport.length === input.sentenceStream.length ? "implemented" : "partial"
      }
    ]
  };
}
