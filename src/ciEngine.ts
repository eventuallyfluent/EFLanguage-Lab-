import {
  AcquisitionVocabPath,
  AcquisitionVocabPathEntry,
  CiAuthoringPacket,
  CiAuthoringSlot,
  CiAuthoringVocabularyItem,
  CiCoverageReport,
  CompactCiAuthoringPacket,
  CiCurationBatch,
  CiCurationBatchItem,
  CiCurationQueueItem,
  CiCurationSlot,
  CiPath,
  CiPathStage,
  CiSentenceTarget,
  SentenceStreamItem
} from "./models";

export const ciPathStages: CiPathStage[] = [
  {
    id: "ci-0001-0100",
    knownWordStart: 0,
    knownWordEnd: 100,
    label: "Survival CI+1 foundation",
    maxNewItemsPerSentence: 1,
    targetKnownCoverage: [0.95, 0.98],
    targetExposureRange: [8, 12],
    acquisitionMode: "ci-plus-one",
    tooEasyPolicy: "review-only"
  },
  {
    id: "ci-0101-0300",
    knownWordStart: 100,
    knownWordEnd: 300,
    label: "Daily-life CI+1 expansion",
    maxNewItemsPerSentence: 1,
    targetKnownCoverage: [0.95, 0.98],
    targetExposureRange: [8, 12],
    acquisitionMode: "ci-plus-one",
    tooEasyPolicy: "review-only"
  },
  {
    id: "ci-0301-1000",
    knownWordStart: 300,
    knownWordEnd: 1000,
    label: "Core sentence ladder",
    maxNewItemsPerSentence: 1,
    targetKnownCoverage: [0.95, 0.98],
    targetExposureRange: [10, 14],
    acquisitionMode: "ci-plus-one",
    tooEasyPolicy: "review-only"
  },
  {
    id: "ci-1001-2000",
    knownWordStart: 1000,
    knownWordEnd: 2000,
    label: "Practical island bridge",
    maxNewItemsPerSentence: 1,
    targetKnownCoverage: [0.95, 0.98],
    targetExposureRange: [10, 15],
    acquisitionMode: "ci-plus-one",
    tooEasyPolicy: "review-only"
  },
  {
    id: "ci-2001-3000",
    knownWordStart: 2000,
    knownWordEnd: 3000,
    label: "Adult operating-life ladder",
    maxNewItemsPerSentence: 1,
    targetKnownCoverage: [0.95, 0.98],
    targetExposureRange: [10, 15],
    acquisitionMode: "ci-plus-one",
    tooEasyPolicy: "review-only"
  },
  {
    id: "ci-3001-10000",
    knownWordStart: 3000,
    knownWordEnd: 10000,
    label: "Long-form adult CI and article bridge",
    maxNewItemsPerSentence: 2,
    targetKnownCoverage: [0.96, 0.98],
    targetExposureRange: [8, 15],
    acquisitionMode: "ci-plus-one",
    tooEasyPolicy: "review-only"
  }
];

export function buildCiPath(): CiPath {
  return {
    targetVocabularyCount: 10000,
    primaryEngine: true,
    sourcePath: "acquisition-vocab-path",
    stages: ciPathStages
  };
}

export function buildCiSentenceTargets(path: AcquisitionVocabPath, stream: SentenceStreamItem[]): CiSentenceTarget[] {
  const exposureCounts = exposureCountsByVocabularyId(stream);
  return path.entries.map((entry) => {
    const stage = stageForWordIndex(entry.wordIndex);
    const currentCuratedExposures = exposureCounts.get(entry.vocabularyId) ?? 0;
    return {
      id: `ci-target-${String(entry.wordIndex).padStart(5, "0")}`,
      vocabularyId: entry.vocabularyId,
      wordIndex: entry.wordIndex,
      simplified: entry.simplified,
      pinyin: entry.pinyin,
      sourceListId: entry.sourceListId,
      knownWordThreshold: Math.max(0, entry.wordIndex - 1),
      targetExposureCount: targetExposureCountFor(entry.wordIndex),
      currentCuratedExposures,
      requiredKnownCoverage: stage.targetKnownCoverage,
      maxNewItemsPerSentence: stage.maxNewItemsPerSentence,
      status: currentCuratedExposures > 0 ? "has-curated-seed" : "needs-curation"
    };
  });
}

export function isAcquisitionCiSentence(item: SentenceStreamItem): boolean {
  return item.newWordIds.length > 0 && item.newWordIds.length <= 1;
}

export function buildCiCurationQueue(targets: CiSentenceTarget[], limit = 500): CiCurationQueueItem[] {
  return targets
    .map((target): CiCurationQueueItem => {
      const exposureDeficit = Math.max(0, target.targetExposureCount - target.currentCuratedExposures);
      const authorability = authorabilityFor(target);
      return {
        id: `ci-queue-${String(target.wordIndex).padStart(5, "0")}`,
        targetId: target.id,
        vocabularyId: target.vocabularyId,
        wordIndex: target.wordIndex,
        simplified: target.simplified,
        pinyin: target.pinyin,
        knownWordThreshold: target.knownWordThreshold,
        currentCuratedExposures: target.currentCuratedExposures,
        targetExposureCount: target.targetExposureCount,
        exposureDeficit,
        priority: priorityFor(target.wordIndex),
        stageId: stageForWordIndex(target.wordIndex).id,
        authorability: authorability.status,
        authoringNotes: authorability.notes
      };
    })
    .filter((item) => item.exposureDeficit > 0)
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.wordIndex - b.wordIndex)
    .slice(0, limit);
}

export function buildAuthorableCiCurationQueue(queue: CiCurationQueueItem[], limit = 500): CiCurationQueueItem[] {
  return queue
    .filter((item) => item.authorability === "ready")
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.wordIndex - b.wordIndex)
    .slice(0, limit);
}

export function buildCiCoverageReport(targets: CiSentenceTarget[]): CiCoverageReport {
  const stages = ciPathStages.map((stage) => {
    const stageTargets = targets.filter((target) => target.wordIndex > stage.knownWordStart && target.wordIndex <= stage.knownWordEnd);
    const totalExposureDeficit = stageTargets.reduce((sum, target) => sum + Math.max(0, target.targetExposureCount - target.currentCuratedExposures), 0);
    return {
      stageId: stage.id,
      knownWordStart: stage.knownWordStart,
      knownWordEnd: stage.knownWordEnd,
      targetCount: stageTargets.length,
      targetsWithCuratedSeed: stageTargets.filter((target) => target.currentCuratedExposures > 0).length,
      targetsNeedingCuration: stageTargets.filter((target) => target.currentCuratedExposures < target.targetExposureCount).length,
      totalExposureDeficit
    };
  });

  return {
    targetVocabularyCount: 10000,
    targetCount: targets.length,
    targetsWithCuratedSeed: targets.filter((target) => target.currentCuratedExposures > 0).length,
    targetsNeedingCuration: targets.filter((target) => target.currentCuratedExposures < target.targetExposureCount).length,
    totalExposureDeficit: stages.reduce((sum, stage) => sum + stage.totalExposureDeficit, 0),
    stages
  };
}

export function buildCiCurationBatches(queue: CiCurationQueueItem[], path: AcquisitionVocabPath, batchSize = 25, maxBatches = 4): CiCurationBatch[] {
  const nonAuthorable = queue.find((item) => item.authorability !== "ready");
  if (nonAuthorable) {
    throw new Error(`CI curation batches must be built from the authorable queue; ${nonAuthorable.id} is ${nonAuthorable.authorability}.`);
  }

  const selected = queue.slice(0, batchSize * maxBatches);
  const batches: CiCurationBatch[] = [];

  for (let batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
    const batchItems = selected.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
    if (batchItems.length === 0) continue;
    const items = batchItems.map((item) => buildBatchItem(item, path));
    batches.push({
      id: `ci-batch-${String(batchIndex + 1).padStart(3, "0")}`,
      sequence: batchIndex + 1,
      stageId: items[0].stageId,
      targetWordStart: Math.min(...items.map((item) => item.wordIndex)),
      targetWordEnd: Math.max(...items.map((item) => item.wordIndex)),
      targetCount: items.length,
      sentenceSlotCount: items.reduce((sum, item) => sum + item.sentenceSlots.length, 0),
      items
    });
  }

  return batches;
}

export function buildCiAuthoringPackets(batches: CiCurationBatch[], path: AcquisitionVocabPath): CiAuthoringPacket[] {
  const pathById = new Map(path.entries.map((entry) => [entry.vocabularyId, entry]));
  return batches.map((batch): CiAuthoringPacket => ({
    id: `ci-authoring-${String(batch.sequence).padStart(3, "0")}`,
    sourceBatchId: batch.id,
    sequence: batch.sequence,
    stageId: batch.stageId,
    targetWordStart: batch.targetWordStart,
    targetWordEnd: batch.targetWordEnd,
    purpose: "author-ci-plus-one-sentences",
    globalRules: authoringGlobalRules(),
    items: batch.items.map((item) => buildAuthoringPacketItem(item, pathById))
  }));
}

export function buildCompactCiAuthoringPackets(batches: CiCurationBatch[], path: AcquisitionVocabPath): CompactCiAuthoringPacket[] {
  const pathById = new Map(path.entries.map((entry) => [entry.vocabularyId, entry]));
  return batches.map((batch): CompactCiAuthoringPacket => ({
    id: `ci-authoring-compact-${String(batch.sequence).padStart(3, "0")}`,
    sourceBatchId: batch.id,
    sequence: batch.sequence,
    stageId: batch.stageId,
    targetWordStart: batch.targetWordStart,
    targetWordEnd: batch.targetWordEnd,
    purpose: "author-ci-plus-one-sentences",
    globalRules: authoringGlobalRules(),
    vocabularyPool: vocabularyPoolForBatch(batch, pathById),
    items: batch.items.map((item) => buildCompactAuthoringPacketItem(item, pathById))
  }));
}

function authoringGlobalRules(): string[] {
  return [
    "Create natural, high-frequency Mandarin sentences for adult learners.",
    "Each sentence must introduce exactly one required new word.",
    "All other words must come from the allowed known vocabulary for that slot.",
    "Do not add untracked vocabulary, names, idioms, or grammar beyond the slot constraints.",
    "Known-only lines are review/shadowing material, not acquisition CI.",
    "Reject sentences that sound like translationese or are not reusable in speaking."
  ];
}

function exposureCountsByVocabularyId(stream: SentenceStreamItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of stream) {
    for (const id of item.newWordIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function stageForWordIndex(wordIndex: number): CiPathStage {
  return ciPathStages.find((stage) => wordIndex > stage.knownWordStart && wordIndex <= stage.knownWordEnd) ?? ciPathStages[ciPathStages.length - 1];
}

function targetExposureCountFor(wordIndex: number): number {
  if (wordIndex <= 300) return 10;
  if (wordIndex <= 3000) return 12;
  return 9;
}

function authorabilityFor(target: CiSentenceTarget): { status: CiCurationQueueItem["authorability"]; notes: string[] } {
  if (target.wordIndex <= 16) {
    return {
      status: "bootstrap-only",
      notes: [
        "Too early for learner-facing authored CI sentences without fragment pressure.",
        "Use curated pack/review/shadowing material until enough function words and objects are known."
      ]
    };
  }

  if (target.wordIndex < 25) {
    return {
      status: "needs-more-known-vocabulary",
      notes: [
        "Known vocabulary is still too thin for consistently natural reusable sentences.",
        "Do not force this target into learner-facing output unless a reviewed natural line exists."
      ]
    };
  }

  return {
    status: "ready",
    notes: [
      "Known vocabulary is large enough for short natural CI+1 authoring.",
      "Still requires authored-intake naturalness validation before promotion."
    ]
  };
}

function buildBatchItem(item: CiCurationQueueItem, path: AcquisitionVocabPath): CiCurationBatchItem {
  const knownWindowStart = Math.max(0, item.wordIndex - 101);
  const allowedKnownVocabularyIds = path.entries.slice(knownWindowStart, Math.max(0, item.wordIndex - 1)).map((entry) => entry.vocabularyId);
  return {
    queueItemId: item.id,
    targetId: item.targetId,
    vocabularyId: item.vocabularyId,
    wordIndex: item.wordIndex,
    simplified: item.simplified,
    pinyin: item.pinyin,
    stageId: item.stageId,
    allowedKnownVocabularyIds,
    sentenceSlots: buildSlotsForItem(item)
  };
}

function buildAuthoringPacketItem(item: CiCurationBatchItem, pathById: Map<string, AcquisitionVocabPathEntry>) {
  const requiredEntry = requiredPathEntry(pathById, item.vocabularyId);
  const allowedKnownVocabulary = item.allowedKnownVocabularyIds.map((id) => vocabularyItemFor(requiredPathEntry(pathById, id)));
  return {
    targetId: item.targetId,
    vocabularyId: item.vocabularyId,
    wordIndex: item.wordIndex,
    stageId: item.stageId,
    requiredNewWord: vocabularyItemFor(requiredEntry),
    sentenceSlots: item.sentenceSlots.map((slot): CiAuthoringSlot => ({
      id: slot.id,
      slotIndex: slot.slotIndex,
      mode: allowedKnownVocabulary.length === 0 ? "bootstrap-seed" : "ci-plus-one",
      functionHint: slot.functionHint,
      requiredNewWord: vocabularyItemFor(requiredEntry),
      allowedKnownVocabulary,
      acceptanceCriteria: acceptanceCriteriaFor(slot, allowedKnownVocabulary.length)
    }))
  };
}

function buildCompactAuthoringPacketItem(item: CiCurationBatchItem, pathById: Map<string, AcquisitionVocabPathEntry>) {
  const allowedKnownVocabularyIds = item.allowedKnownVocabularyIds.filter((id) => pathById.has(id));
  return {
    targetId: item.targetId,
    vocabularyId: item.vocabularyId,
    wordIndex: item.wordIndex,
    stageId: item.stageId,
    sentenceSlots: item.sentenceSlots.map((slot) => ({
      id: slot.id,
      slotIndex: slot.slotIndex,
      mode: allowedKnownVocabularyIds.length === 0 ? "bootstrap-seed" as const : "ci-plus-one" as const,
      functionHint: slot.functionHint,
      requiredNewWordId: item.vocabularyId,
      allowedKnownVocabularyIds,
      acceptanceCriteria: acceptanceCriteriaFor(slot, allowedKnownVocabularyIds.length)
    }))
  };
}

function vocabularyPoolForBatch(batch: CiCurationBatch, pathById: Map<string, AcquisitionVocabPathEntry>): CiAuthoringVocabularyItem[] {
  const ids = new Set<string>();
  for (const item of batch.items) {
    ids.add(item.vocabularyId);
    for (const knownId of item.allowedKnownVocabularyIds) ids.add(knownId);
  }
  return Array.from(ids)
    .map((id) => pathById.get(id))
    .filter((entry): entry is AcquisitionVocabPathEntry => entry !== undefined)
    .sort((a, b) => a.wordIndex - b.wordIndex)
    .map(vocabularyItemFor);
}

function requiredPathEntry(pathById: Map<string, AcquisitionVocabPathEntry>, vocabularyId: string): AcquisitionVocabPathEntry {
  const entry = pathById.get(vocabularyId);
  if (!entry) throw new Error(`Missing acquisition path entry for CI authoring: ${vocabularyId}`);
  return entry;
}

function vocabularyItemFor(entry: AcquisitionVocabPathEntry): CiAuthoringVocabularyItem {
  return {
    vocabularyId: entry.vocabularyId,
    wordIndex: entry.wordIndex,
    simplified: entry.simplified,
    pinyin: entry.pinyin,
    hskLevel: entry.hskLevel,
    partOfSpeech: entry.partOfSpeech,
    islandTags: entry.islandTags,
    movieRank: entry.movieRank,
    bookRank: entry.bookRank,
    blcuRank: entry.blcuRank
  };
}

function acceptanceCriteriaFor(slot: CiCurationSlot, allowedKnownVocabularyCount: number): string[] {
  if (allowedKnownVocabularyCount === 0) {
    return [
      `Required seed word id is ${slot.requiredNewWordId}.`,
      "Bootstrap seed slot: this is not counted as normal 95% CI+1 acquisition.",
      "Use no untracked vocabulary.",
      `Sentence function should be ${slot.functionHint}.`,
      "Keep the line short, spoken, and reusable for shadowing.",
      "Promote later repeated exposures into true CI+1 once enough known vocabulary exists."
    ];
  }

  return [
    `Required new word id is ${slot.requiredNewWordId}.`,
    `Use no more than ${slot.maxOtherNewItems} other new words.`,
    `Known vocabulary coverage must be at least ${slot.minKnownCoverage}.`,
    `Sentence function should be ${slot.functionHint}.`,
    "Sentence must be natural beginner Mandarin, not a word-by-word English gloss.",
    "Sentence must be suitable for shadowing: short, spoken, and reusable."
  ];
}

function buildSlotsForItem(item: CiCurationQueueItem): CiCurationSlot[] {
  const slotCount = Math.min(item.exposureDeficit, item.targetExposureCount);
  return Array.from({ length: slotCount }, (_, index) => ({
    id: `${item.id}-slot-${String(index + 1).padStart(2, "0")}`,
    slotIndex: index + 1,
    requiredNewWordId: item.vocabularyId,
    maxOtherNewItems: 0,
    minKnownCoverage: item.wordIndex <= 3000 ? 0.95 : 0.96,
    functionHint: functionHints[index % functionHints.length]
  }));
}

const functionHints: CiCurationSlot["functionHint"][] = ["statement", "question", "negation", "time", "preference", "location", "description"];

function priorityFor(wordIndex: number): CiCurationQueueItem["priority"] {
  if (wordIndex <= 300) return "now";
  if (wordIndex <= 1000) return "next";
  return "later";
}

function priorityRank(priority: CiCurationQueueItem["priority"]): number {
  if (priority === "now") return 0;
  if (priority === "next") return 1;
  return 2;
}
