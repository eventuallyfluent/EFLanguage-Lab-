import {
  AcquisitionPathStage,
  AcquisitionVocabPath,
  AcquisitionVocabPathEntry,
  GeneratedSentence,
  IslandTag,
  IslandUnlock,
  LexiconEntry,
  SentenceStreamBuildReport,
  SentenceStreamItem,
  SentenceStreamReviewItem,
  SrsSupportItem
} from "./models";
import { productPolicy } from "./productPolicy";
import { Hsk30SourceEntry } from "./data/hsk30Source";

export const acquisitionPathStages: AcquisitionPathStage[] = [
  {
    id: "seed-100",
    minKnownWords: 0,
    label: "Survival HSK spoken base",
    rankingBias: "hsk-spoken",
    allowedContent: ["sentence-stream", "srs-support"],
    allowedThemes: ["identity", "daily-life", "food", "drink", "school", "time", "location", "home", "social", "question", "description", "preference", "ability"],
    forbiddenThemes: ["work", "health", "transport"],
    ciCoverageRange: [0.95, 0.98]
  },
  {
    id: "core-300",
    minKnownWords: 300,
    label: "Daily life mixed frequency",
    rankingBias: "mixed-daily",
    allowedContent: ["sentence-stream", "short-reading", "srs-support"],
    allowedThemes: ["identity", "daily-life", "food", "drink", "school", "time", "location", "home", "shopping", "social", "question", "description", "preference", "ability"],
    forbiddenThemes: ["work", "health"],
    ciCoverageRange: [0.95, 0.98]
  },
  {
    id: "bridge-1000",
    minKnownWords: 1000,
    label: "First practical language islands",
    rankingBias: "bridge-islands",
    allowedContent: ["sentence-stream", "short-reading", "article", "language-island", "srs-support"],
    allowedThemes: ["identity", "daily-life", "food", "drink", "school", "time", "location", "home", "shopping", "transport", "social", "question", "description", "preference", "ability"],
    forbiddenThemes: ["health", "work"],
    ciCoverageRange: [0.95, 0.98]
  },
  {
    id: "adult-2000",
    minKnownWords: 2000,
    label: "Adult operating-life islands",
    rankingBias: "adult-islands",
    allowedContent: ["sentence-stream", "short-reading", "article", "language-island", "srs-support"],
    allowedThemes: ["identity", "daily-life", "food", "drink", "school", "work", "shopping", "time", "location", "home", "transport", "health", "weather", "social", "question", "description", "preference", "ability"],
    forbiddenThemes: [],
    ciCoverageRange: [0.95, 0.98]
  },
  {
    id: "adult-3000",
    minKnownWords: 3000,
    label: "Adult nuance and article growth",
    rankingBias: "book-weighted",
    allowedContent: ["sentence-stream", "short-reading", "article", "language-island", "srs-support"],
    allowedThemes: ["identity", "daily-life", "food", "drink", "family", "school", "work", "shopping", "time", "location", "home", "transport", "health", "weather", "reading", "shadowing", "social", "question", "description", "preference", "ability"],
    forbiddenThemes: [],
    ciCoverageRange: [0.96, 0.98]
  },
  {
    id: "broad-5000",
    minKnownWords: 5000,
    label: "Broad practical reading",
    rankingBias: "book-weighted",
    allowedContent: ["sentence-stream", "article", "language-island", "srs-support"],
    allowedThemes: ["identity", "daily-life", "food", "drink", "family", "school", "work", "shopping", "time", "location", "home", "transport", "health", "weather", "reading", "shadowing", "social", "question", "description", "preference", "ability"],
    forbiddenThemes: [],
    ciCoverageRange: [0.96, 0.98]
  },
  {
    id: "near-authentic-7500",
    minKnownWords: 7500,
    label: "Near-authentic controlled input",
    rankingBias: "book-weighted",
    allowedContent: ["sentence-stream", "article", "language-island", "srs-support"],
    allowedThemes: ["identity", "daily-life", "food", "drink", "family", "school", "work", "shopping", "time", "location", "home", "transport", "health", "weather", "reading", "shadowing", "social", "question", "description", "preference", "ability"],
    forbiddenThemes: [],
    ciCoverageRange: [0.96, 0.98]
  },
  {
    id: "operating-10000",
    minKnownWords: 10000,
    label: "10k operating base",
    rankingBias: "book-weighted",
    allowedContent: ["sentence-stream", "article", "language-island", "srs-support"],
    allowedThemes: ["identity", "daily-life", "food", "drink", "family", "school", "work", "shopping", "time", "location", "home", "transport", "health", "weather", "reading", "shadowing", "social", "question", "description", "preference", "ability"],
    forbiddenThemes: [],
    ciCoverageRange: [0.96, 0.98]
  }
];

export const islandUnlocks: IslandUnlock[] = [
  {
    id: "island-city-movement",
    label: "City movement",
    unlockAtWordCount: 1000,
    themeTags: ["transport", "location", "time"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading"],
    notes: "First practical island: delays, stations, routes, and simple movement."
  },
  {
    id: "island-errands",
    label: "Errands and shopping",
    unlockAtWordCount: 1000,
    themeTags: ["shopping", "daily-life", "location"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading"],
    notes: "Simple daily errands without adult pressure."
  },
  {
    id: "island-work-admin",
    label: "Work and admin pressure",
    unlockAtWordCount: 2000,
    themeTags: ["work", "time", "question"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "article"],
    notes: "Adult operating-life language starts here, not before."
  },
  {
    id: "island-health-visits",
    label: "Health visits",
    unlockAtWordCount: 2000,
    themeTags: ["health", "time", "location"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "article"],
    notes: "Doctor visits and health logistics unlock after adult-life coverage."
  }
];

export function buildAcquisitionVocabPath(lexicon: LexiconEntry[], hskSourceEntries: Hsk30SourceEntry[] = []): AcquisitionVocabPath {
  const entries = hskSourceEntries.length >= 10000 ? buildHskSourcePathEntries(lexicon, hskSourceEntries) : buildLexiconPathEntries(lexicon);

  return {
    targetVocabularyCount: 10000,
    currentCandidateCount: entries.length,
    sourceFamilies: ["HSK_3_0", "MOVIE_FREQUENCY", "BOOK_FREQUENCY", "BLCU_FREQUENCY"],
    rankingStrategy: "HSK 3.0 source list supplies the 10k backbone; movie ranks bias spoken CI; book ranks bias article/readings after unlock; BLCU supports general frequency.",
    stages: acquisitionPathStages,
    entries
  };
}

function buildLexiconPathEntries(lexicon: LexiconEntry[]): AcquisitionVocabPathEntry[] {
  return [...lexicon]
    .sort((a, b) => (b.acquisitionScore ?? 0) - (a.acquisitionScore ?? 0))
    .map((entry, index): AcquisitionVocabPathEntry => ({
      wordIndex: index + 1,
      vocabularyId: entry.id,
      simplified: entry.simplified,
      hskLevel: entry.hskLevel,
      partOfSpeech: entry.partOfSpeech,
      islandTags: entry.islandTags,
      unlockAtWordCount: unlockForEntry(entry, index + 1),
      sourceMemberships: entry.sourceMemberships ?? [],
      movieRank: entry.movieRank,
      bookRank: entry.bookRank,
      blcuRank: entry.blcuRank,
      acquisitionScore: entry.acquisitionScore ?? 0
    }));
}

function buildHskSourcePathEntries(lexicon: LexiconEntry[], hskSourceEntries: Hsk30SourceEntry[]): AcquisitionVocabPathEntry[] {
  const lexiconBySimplified = new Map(lexicon.map((entry) => [entry.simplified, entry]));
  const lexiconOrder = new Map(lexicon.map((entry, index) => [entry.id, index + 1]));
  const sourceEntries = hskSourceEntries
    .map((sourceEntry, sourceIndex): AcquisitionVocabPathEntry & { sourceOrder: number; gateFloor: number; knownLexiconOrder: number } => {
    const knownEntry = lexiconBySimplified.get(sourceEntry.simplified);
    return {
      wordIndex: sourceIndex + 1,
      vocabularyId: knownEntry?.id ?? `hsk30:${sourceEntry.sourceListId}`,
      sourceListId: sourceEntry.sourceListId,
      simplified: sourceEntry.simplified,
      pinyin: sourceEntry.pinyin,
      hskLevel: sourceEntry.hskLevel,
      partOfSpeech: knownEntry?.partOfSpeech ?? sourceEntry.partOfSpeech,
      islandTags: knownEntry?.islandTags ?? [],
      unlockAtWordCount: knownEntry ? unlockForEntry(knownEntry, sourceIndex + 1) : unlockForSourceIndex(sourceIndex + 1),
      sourceMemberships: [
        { source: "HSK_3_0", permissionSource: true },
        ...(knownEntry?.sourceMemberships ?? []).filter((membership) => membership.source !== "HSK_3_0")
      ],
      movieRank: knownEntry?.movieRank,
      bookRank: knownEntry?.bookRank,
      blcuRank: knownEntry?.blcuRank,
      acquisitionScore: knownEntry?.acquisitionScore ?? Number((10000 - sourceIndex + (9 - sourceEntry.hskLevel) * 100).toFixed(2)),
      sourceOrder: sourceIndex + 1,
      gateFloor: gateFloorFor(knownEntry, sourceIndex + 1),
      knownLexiconOrder: knownEntry ? lexiconOrder.get(knownEntry.id) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER
    };
  });
  const sourcePathIds = new Set(sourceEntries.map((entry) => entry.vocabularyId));
  const requiredLocalEntries = lexicon
    .filter((entry) => !sourcePathIds.has(entry.id))
    .map((entry, index): AcquisitionVocabPathEntry & { sourceOrder: number; gateFloor: number; knownLexiconOrder: number } => ({
      wordIndex: hskSourceEntries.length + index + 1,
      vocabularyId: entry.id,
      sourceListId: `local:${entry.id}`,
      simplified: entry.simplified,
      pinyin: entry.pinyin,
      hskLevel: entry.hskLevel,
      partOfSpeech: entry.partOfSpeech,
      islandTags: entry.islandTags,
      unlockAtWordCount: unlockForEntry(entry, hskSourceEntries.length + index + 1),
      sourceMemberships: entry.sourceMemberships ?? [{ source: "HSK_3_0", permissionSource: true }],
      movieRank: entry.movieRank,
      bookRank: entry.bookRank,
      blcuRank: entry.blcuRank,
      acquisitionScore: entry.acquisitionScore ?? 0,
      sourceOrder: hskSourceEntries.length + index + 1,
      gateFloor: gateFloorFor(entry, hskSourceEntries.length + index + 1),
      knownLexiconOrder: lexiconOrder.get(entry.id) ?? Number.MAX_SAFE_INTEGER
    }));

  return uniqueAcquisitionEntries([...sourceEntries, ...requiredLocalEntries].sort(compareAcquisitionEntries))
    .slice(0, 10000)
    .map(({ sourceOrder: _sourceOrder, gateFloor: _gateFloor, knownLexiconOrder: _knownLexiconOrder, ...entry }, index) => ({
      ...entry,
      wordIndex: index + 1,
      unlockAtWordCount: Math.max(entry.unlockAtWordCount, unlockForSourceIndex(index + 1))
    }));
}

function uniqueAcquisitionEntries(
  entries: Array<AcquisitionVocabPathEntry & { sourceOrder: number; gateFloor: number; knownLexiconOrder: number }>
): Array<AcquisitionVocabPathEntry & { sourceOrder: number; gateFloor: number; knownLexiconOrder: number }> {
  const seenIds = new Set<string>();
  const seenSimplified = new Set<string>();
  const out: Array<AcquisitionVocabPathEntry & { sourceOrder: number; gateFloor: number; knownLexiconOrder: number }> = [];
  for (const entry of entries) {
    if (seenIds.has(entry.vocabularyId) || seenSimplified.has(entry.simplified)) continue;
    seenIds.add(entry.vocabularyId);
    seenSimplified.add(entry.simplified);
    out.push(entry);
  }
  return out;
}

export function buildSentenceStream(sentences: GeneratedSentence[], path: AcquisitionVocabPath): SentenceStreamItem[] {
  return buildSentenceStreamWithReport(sentences, path).stream;
}

export function buildSentenceStreamWithReport(sentences: GeneratedSentence[], path: AcquisitionVocabPath): { stream: SentenceStreamItem[]; report: SentenceStreamBuildReport } {
  const pathOrder = new Map(path.entries.map((entry) => [entry.vocabularyId, entry.wordIndex]));
  const pathIdsByIndex = path.entries.map((entry) => entry.vocabularyId);
  const candidates = [...sentences]
    .map((sentence) => {
      const sortedVocabulary = [...sentence.vocabularyIds].sort((a, b) => (pathOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (pathOrder.get(b) ?? Number.MAX_SAFE_INTEGER));
      const targetWordIndex = Math.max(...sortedVocabulary.map((id) => pathOrder.get(id) ?? Number.MAX_SAFE_INTEGER));
      return { sentence, sortedVocabulary, targetWordIndex };
    })
    .sort((a, b) => a.targetWordIndex - b.targetWordIndex || (a.sentence.unlockAtWordCount ?? 100) - (b.sentence.unlockAtWordCount ?? 100) || a.sentence.id.localeCompare(b.sentence.id));

  const stream: SentenceStreamItem[] = [];
  const reviewedSentenceIds = new Set<string>();
  const reviewOnlySentences: SentenceStreamReviewItem[] = [];
  const blockedSentences: SentenceStreamReviewItem[] = [];

  for (const candidate of candidates) {
    const disposition = dispositionForCandidate(candidate.sentence, candidate.sortedVocabulary, pathOrder, pathIdsByIndex);
    if (disposition.disposition === "review-only") {
      reviewOnlySentences.push(disposition);
      reviewedSentenceIds.add(candidate.sentence.id);
      continue;
    }
    if (disposition.disposition === "blocked") {
      blockedSentences.push(disposition);
      reviewedSentenceIds.add(candidate.sentence.id);
      continue;
    }
    const newWordIds = disposition.unknownVocabularyIds;
    const knownVocabularyIds = candidate.sortedVocabulary.filter((id) => !newWordIds.includes(id));
    const index = stream.length;
    stream.push({
      id: `stream-${String(index + 1).padStart(5, "0")}`,
      sentenceId: candidate.sentence.id,
      simplified: candidate.sentence.simplified,
      pinyin: candidate.sentence.pinyin,
      english: candidate.sentence.english,
      knownWordThreshold: Math.max(0, (pathOrder.get(newWordIds[0]) ?? 1) - 1),
      knownVocabularyIds,
      newWordIds,
      vocabularyIds: candidate.sentence.vocabularyIds,
      repetitionFamilyId: `${candidate.sentence.templateId}:${(candidate.sentence.themeTags ?? []).join("-")}`,
      templateId: candidate.sentence.templateId,
      sourceStatus: "curated",
      qualityScore: candidate.sentence.qualityScore,
      islandTags: candidate.sentence.themeTags ?? [],
      reviewStatus: "curated"
    });
    reviewedSentenceIds.add(candidate.sentence.id);
  }

  for (const candidate of candidates) {
    if (reviewedSentenceIds.has(candidate.sentence.id)) continue;
    blockedSentences.push({
      sentenceId: candidate.sentence.id,
      simplified: candidate.sentence.simplified,
      english: candidate.sentence.english,
      vocabularyIds: candidate.sentence.vocabularyIds,
      knownWordThreshold: candidate.sentence.unlockAtWordCount ?? 0,
      disposition: "blocked",
      reason: "too-many-new-words",
      unknownVocabularyIds: candidate.sortedVocabulary
    });
  }

  return {
    stream,
    report: {
      candidateSentenceCount: sentences.length,
      acquisitionItemCount: stream.length,
      reviewOnlyCount: reviewOnlySentences.length,
      blockedCount: blockedSentences.length,
      reviewOnlySentences,
      blockedSentences
    }
  };
}

export function assertSequentialCiStream(stream: SentenceStreamItem[], path?: AcquisitionVocabPath): void {
  const pathOrder = path ? new Map(path.entries.map((entry) => [entry.vocabularyId, entry.wordIndex])) : undefined;
  for (const item of stream) {
    if (item.newWordIds.length !== 1) throw new Error(`CI stream item must introduce exactly one word: ${item.id}`);
    if (item.knownVocabularyIds.includes(item.newWordIds[0])) throw new Error(`CI stream item repeats the new word as known vocabulary: ${item.id}`);
    if (!pathOrder) continue;
    const newWordIndex = pathOrder.get(item.newWordIds[0]);
    if (newWordIndex === undefined) throw new Error(`CI stream item new word is missing from path: ${item.id}`);
    if (item.knownWordThreshold !== newWordIndex - 1) {
      throw new Error(`CI stream item has wrong known threshold: ${item.id} expected ${newWordIndex - 1}, got ${item.knownWordThreshold}`);
    }
    const outOfRangeKnownIds = item.knownVocabularyIds.filter((id) => (pathOrder.get(id) ?? Number.MAX_SAFE_INTEGER) > item.knownWordThreshold);
    if (outOfRangeKnownIds.length > 0) throw new Error(`CI stream item uses future words as known vocabulary: ${item.id} ${outOfRangeKnownIds.join(", ")}`);
  }
}

function acquiredSetFor(knownWordThreshold: number, pathIdsByIndex: string[]): Set<string> {
  return new Set(pathIdsByIndex.slice(0, Math.max(0, knownWordThreshold)));
}

function dispositionForCandidate(
  sentence: GeneratedSentence,
  sortedVocabulary: string[],
  pathOrder: Map<string, number>,
  pathIdsByIndex: string[]
): SentenceStreamReviewItem {
  const knownWordThreshold = sentence.unlockAtWordCount ?? 0;
  const missingPathIds = sortedVocabulary.filter((id) => !pathOrder.has(id));
  if (missingPathIds.length > 0) {
    return {
      sentenceId: sentence.id,
      simplified: sentence.simplified,
      english: sentence.english,
      vocabularyIds: sentence.vocabularyIds,
      knownWordThreshold,
      disposition: "blocked",
      reason: "missing-path-vocabulary",
      unknownVocabularyIds: missingPathIds
    };
  }

  const acquired = acquiredSetFor(knownWordThreshold, pathIdsByIndex);
  const unknownIds = sortedVocabulary.filter((id) => !acquired.has(id));
  if (unknownIds.length === 0) {
    return {
      sentenceId: sentence.id,
      simplified: sentence.simplified,
      english: sentence.english,
      vocabularyIds: sentence.vocabularyIds,
      knownWordThreshold,
      disposition: "review-only",
      reason: "known-only",
      unknownVocabularyIds: []
    };
  }
  if (unknownIds.length > 1) {
    return {
      sentenceId: sentence.id,
      simplified: sentence.simplified,
      english: sentence.english,
      vocabularyIds: sentence.vocabularyIds,
      knownWordThreshold,
      disposition: "blocked",
      reason: "too-many-new-words",
      unknownVocabularyIds: unknownIds
    };
  }

  return {
    sentenceId: sentence.id,
    simplified: sentence.simplified,
    english: sentence.english,
    vocabularyIds: sentence.vocabularyIds,
    knownWordThreshold,
    disposition: "acquisition-ci",
    reason: "ci-plus-one",
    unknownVocabularyIds: unknownIds
  };
}

function compareAcquisitionEntries(
  a: AcquisitionVocabPathEntry & { sourceOrder: number; gateFloor: number; knownLexiconOrder: number },
  b: AcquisitionVocabPathEntry & { sourceOrder: number; gateFloor: number; knownLexiconOrder: number }
): number {
  if (a.gateFloor !== b.gateFloor) return a.gateFloor - b.gateFloor;
  const aKnown = a.knownLexiconOrder !== Number.MAX_SAFE_INTEGER ? 0 : 1;
  const bKnown = b.knownLexiconOrder !== Number.MAX_SAFE_INTEGER ? 0 : 1;
  if (aKnown !== bKnown) return aKnown - bKnown;
  if (aKnown === 0 && a.knownLexiconOrder !== b.knownLexiconOrder) return a.knownLexiconOrder - b.knownLexiconOrder;
  if (a.hskLevel !== b.hskLevel) return a.hskLevel - b.hskLevel;
  if ((b.movieRank ?? Number.MAX_SAFE_INTEGER) !== (a.movieRank ?? Number.MAX_SAFE_INTEGER)) {
    return (a.movieRank ?? Number.MAX_SAFE_INTEGER) - (b.movieRank ?? Number.MAX_SAFE_INTEGER);
  }
  return a.sourceOrder - b.sourceOrder;
}

function gateFloorFor(entry: LexiconEntry | undefined, sourceIndex: number): number {
  if (!entry) return unlockForSourceIndex(sourceIndex);
  if (entry.islandTags.some((tag) => tag === "work" || tag === "health")) return 2000;
  if (entry.islandTags.some((tag) => tag === "transport")) return 1000;
  if (entry.bookRank !== undefined && entry.movieRank === undefined) return 300;
  return entry.acquisitionTier === "seed-100" ? 0 : 300;
}

export function buildSrsSupportItems(stream: SentenceStreamItem[]): SrsSupportItem[] {
  return stream.map((item) => ({
    id: `srs-${item.id}`,
    sentenceStreamItemId: item.id,
    vocabularyIds: item.vocabularyIds,
    introducedAfterCi: true,
    role: "support-retention"
  }));
}

export function buildArticleUnlocks() {
  return productPolicy.articleUnlocks;
}

function unlockForEntry(entry: LexiconEntry, index: number): number {
  if (entry.islandTags.some((tag) => tag === "work" || tag === "health")) return Math.max(2000, index);
  if (entry.islandTags.some((tag) => tag === "transport")) return Math.max(1000, index);
  if (entry.bookRank !== undefined && entry.movieRank === undefined) return Math.max(300, index);
  if (index <= 100) return 100;
  if (index <= 300) return 300;
  return index;
}

function unlockForSourceIndex(index: number): number {
  if (index <= 100) return 100;
  if (index <= 300) return 300;
  if (index <= 1000) return 1000;
  if (index <= 2000) return 2000;
  if (index <= 3000) return 3000;
  return index;
}
