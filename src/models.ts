export type SourceTag = "HSK" | "BLCU";
export type VocabSourceFamily = "HSK_3_0" | "MOVIE_FREQUENCY" | "BOOK_FREQUENCY" | "BLCU_FREQUENCY";
export type FrequencyPriority = "high" | "medium" | "low";
export type CurriculumTierId = "100-tier" | "300-tier" | "1000-tier" | "2000-tier" | "3000-tier";
export type ContentComplexity = "single-clause" | "paired-clause" | "multi-clause";
export type ContentType = "sentence" | "dialogue-turn" | "reading-line";
export type PartOfSpeech =
  | "pronoun"
  | "verb"
  | "noun"
  | "adjective"
  | "time"
  | "location"
  | "adverb"
  | "particle"
  | "measure"
  | "number"
  | "conjunction";

export type IslandTag =
  | "identity"
  | "daily-life"
  | "food"
  | "drink"
  | "family"
  | "school"
  | "work"
  | "shopping"
  | "time"
  | "location"
  | "home"
  | "transport"
  | "health"
  | "weather"
  | "reading"
  | "shadowing"
  | "social"
  | "question"
  | "description"
  | "preference"
  | "ability";

export interface LexiconEntry {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
  hskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  source: SourceTag;
  sourceMemberships?: VocabSourceMembership[];
  blcuRank?: number;
  movieRank?: number;
  bookRank?: number;
  acquisitionScore?: number;
  acquisitionTier?: "seed-100" | "hsk-core-300" | "blcu-expansion";
  partOfSpeech: PartOfSpeech;
  frequencyPriority: FrequencyPriority;
  islandTags: IslandTag[];
}

export interface VocabSourceMembership {
  source: VocabSourceFamily;
  rank?: number;
  permissionSource: boolean;
}

export interface TemplateSlot {
  name: string;
  type: PartOfSpeech | "object" | "subject";
  requiredTags?: IslandTag[];
  excludedTags?: IslandTag[];
}

export interface SentenceTemplate {
  id: string;
  category:
    | "identity"
    | "action"
    | "time"
    | "preference"
    | "ability"
    | "question"
    | "description"
    | "completion"
    | "repetition"
    | "location";
  zhPattern: string;
  enPattern: string;
  slots: TemplateSlot[];
  constraints: string[];
}

export interface GeneratedSentence {
  id: string;
  templateId: string;
  simplified: string;
  pinyin: string;
  english: string;
  vocabularyIds: string[];
  difficulty: "beginner-1" | "beginner-2" | "beginner-3";
  qualityScore: number;
  reviewStatus: "draft" | "validated" | "curated";
  sourceNote?: string;
  progressionLevel?: 1 | 2 | 3 | 4;
  themeTags?: IslandTag[];
  unlockAtWordCount?: number;
  tierId?: CurriculumTierId;
  packId?: string;
  complexity?: ContentComplexity;
  contentType?: ContentType;
  variations: string[];
}

export interface DialogueTurn {
  speaker: "A" | "B";
  simplified: string;
  pinyin: string;
  english: string;
  vocabularyIds: string[];
  tierId?: CurriculumTierId;
  packId?: string;
  unlockAtWordCount?: number;
  complexity?: ContentComplexity;
  contentType?: "dialogue-turn";
}

export interface Dialogue {
  id: string;
  title: string;
  islandTags: IslandTag[];
  turns: DialogueTurn[];
  knownVocabularyCoverage: number;
}

export interface ReadingSentence {
  simplified: string;
  pinyin: string;
  english: string;
  vocabularyIds: string[];
  newWordIds: string[];
  tierId?: CurriculumTierId;
  packId?: string;
  unlockAtWordCount?: number;
  complexity?: ContentComplexity;
  contentType?: "reading-line";
}

export interface ReadingPassage {
  id: string;
  title: string;
  islandTags: IslandTag[];
  sentences: ReadingSentence[];
  knownVocabularyCoverage: number;
  ciPlusOneValid: boolean;
}

export interface Island {
  id: string;
  name: string;
  tags: IslandTag[];
  description: string;
  requiredVocabularyIds: string[];
}

export interface CurriculumTierPolicy {
  id: CurriculumTierId;
  minKnownWords: number;
  label: string;
  requiredThemes: IslandTag[];
  forbiddenThemes: IslandTag[];
  targetSentenceCount: number;
  dialogueCount: number;
  readingCount: number;
  maxClauseComplexity: ContentComplexity;
  allowedGrammar: string[];
  unlockNotes: string;
}

export interface CurriculumDialogue extends Dialogue {
  tierId: CurriculumTierId;
  packId: string;
  unlockAtWordCount: number;
  complexity: ContentComplexity;
  reviewStatus: "curated";
}

export interface CurriculumReading extends ReadingPassage {
  tierId: CurriculumTierId;
  packId: string;
  unlockAtWordCount: number;
  complexity: ContentComplexity;
  reviewStatus: "curated";
}

export interface CurriculumPack {
  id: string;
  tierId: CurriculumTierId;
  title: string;
  summary: string;
  unlockAtWordCount: number;
  themeTags: IslandTag[];
  sentenceCountTarget: number;
  dialogueCountTarget: number;
  readingCountTarget: number;
  sentences: GeneratedSentence[];
  dialogues: CurriculumDialogue[];
  readings: CurriculumReading[];
}

export type ProductLoopRole = "primary-acquisition" | "core-practice" | "support-retention" | "unlockable-reading";
export type PrimaryAcquisitionMode = "ci-plus-one-sentence-stream";
export type RepetitionStyle = "glossika-style";

export interface JourneyMilestone {
  knownWordCount: number;
  label: string;
  acquisitionFocus: string;
  unlockedContent: string[];
}

export interface ArticleUnlockPolicy {
  id: string;
  minKnownWords: number;
  minKnownVocabularyCoverage: number;
  maxNewWordsPerSentence: 1 | 2;
  allowedComplexity: ContentComplexity;
  description: string;
}

export interface ProductSurfacePolicy {
  id: "sentence-stream" | "shadowing" | "srs" | "articles";
  label: string;
  role: ProductLoopRole;
  description: string;
}

export interface ProductPolicy {
  targetVocabularyCount: 10000;
  primaryAcquisitionMode: PrimaryAcquisitionMode;
  repetitionStyle: RepetitionStyle;
  srsRole: "support-retention";
  productSurfaces: ProductSurfacePolicy[];
  journeyMilestones: JourneyMilestone[];
  articleUnlocks: ArticleUnlockPolicy[];
  nonGoals: string[];
}

export interface VocabSourceDefinition {
  id: VocabSourceFamily;
  label: string;
  role: "backbone" | "spoken-priority" | "reading-priority" | "supporting-rank";
  permissionSource: boolean;
  description: string;
}

export interface VocabSourceAudit {
  totalEntries: number;
  sourceCoverage: Record<VocabSourceFamily, number>;
  hskBackbone: number;
  movieRanked: number;
  bookRanked: number;
  blcuRanked: number;
  multiSourceEntries: number;
  missingMovieRank: string[];
  missingBookRank: string[];
  missingBlcuRank: string[];
  missingMetadata: string[];
}

export interface SourceListImportStatus {
  source: VocabSourceFamily;
  expectedPaths: string[];
  importMode: "file" | "fixture" | "missing";
  importedEntryCount: number;
  rankedLexiconEntryCount: number;
  permissionSource: boolean;
  notes: string;
}

export interface SourceListImportAudit {
  targetVocabularyCount: 10000;
  acquisitionPathCandidateCount: number;
  sourceLists: SourceListImportStatus[];
  warnings: string[];
}

export interface AcquisitionVocabPathEntry {
  wordIndex: number;
  vocabularyId: string;
  simplified: string;
  pinyin?: string;
  sourceListId?: string;
  hskLevel: number;
  partOfSpeech: PartOfSpeech;
  islandTags: IslandTag[];
  unlockAtWordCount: number;
  sourceMemberships: VocabSourceMembership[];
  movieRank?: number;
  bookRank?: number;
  blcuRank?: number;
  acquisitionScore: number;
}

export interface AcquisitionPathStage {
  id: "seed-100" | "core-300" | "bridge-1000" | "adult-2000" | "adult-3000" | "broad-5000" | "near-authentic-7500" | "operating-10000";
  minKnownWords: number;
  label: string;
  rankingBias: "hsk-spoken" | "mixed-daily" | "bridge-islands" | "adult-islands" | "book-weighted";
  allowedContent: Array<"sentence-stream" | "short-reading" | "article" | "language-island" | "srs-support">;
  allowedThemes: IslandTag[];
  forbiddenThemes: IslandTag[];
  ciCoverageRange: [number, number];
}

export interface AcquisitionVocabPath {
  targetVocabularyCount: 10000;
  currentCandidateCount: number;
  sourceFamilies: VocabSourceFamily[];
  rankingStrategy: string;
  stages: AcquisitionPathStage[];
  entries: AcquisitionVocabPathEntry[];
}

export interface SentenceStreamItem {
  id: string;
  sentenceId: string;
  simplified: string;
  pinyin: string;
  english: string;
  knownWordThreshold: number;
  knownVocabularyIds: string[];
  newWordIds: string[];
  vocabularyIds: string[];
  repetitionFamilyId: string;
  templateId: string;
  sourceStatus: "curated";
  qualityScore: number;
  islandTags: IslandTag[];
  reviewStatus: "curated";
}

export type SentenceStreamDisposition = "acquisition-ci" | "review-only" | "blocked";

export interface SentenceStreamReviewItem {
  sentenceId: string;
  simplified: string;
  english: string;
  vocabularyIds: string[];
  knownWordThreshold: number;
  disposition: SentenceStreamDisposition;
  reason: "ci-plus-one" | "known-only" | "too-many-new-words" | "missing-path-vocabulary";
  unknownVocabularyIds: string[];
}

export interface SentenceStreamBuildReport {
  candidateSentenceCount: number;
  acquisitionItemCount: number;
  reviewOnlyCount: number;
  blockedCount: number;
  reviewOnlySentences: SentenceStreamReviewItem[];
  blockedSentences: SentenceStreamReviewItem[];
}

export interface IslandUnlock {
  id: string;
  label: string;
  unlockAtWordCount: number;
  themeTags: IslandTag[];
  allowedContent: Array<"sentence-stream" | "dialogue" | "short-reading" | "article">;
  notes: string;
}

export interface SrsSupportItem {
  id: string;
  sentenceStreamItemId: string;
  vocabularyIds: string[];
  introducedAfterCi: true;
  role: "support-retention";
}

export type ShadowLineStatus = "accepted-review" | "needs-human-review" | "blocked";

export interface ShadowCurriculumItem {
  id: string;
  day: number;
  sequenceInCourse: number;
  conceptId: string;
  targetCommunicationPathRank: number;
  simplified: string;
  traditional?: string;
  pinyin?: string;
  english: string;
  displayMode: "sentence" | "target-placeholder";
  lineStatus: ShadowLineStatus;
  sourceCandidateId: string;
  naturalnessDisposition?: PanMandarinNaturalnessDisposition;
  reviewStatus: "review-only";
}

export interface DailyShadowScheduleDay {
  day: number;
  newItemIds: string[];
  reviewDayNumbers: number[];
  reviewItemIds: string[];
  sessionItemIds: string[];
  newCount: number;
  reviewCount: number;
  sessionCount: number;
  activeWindowStartDay: number;
  activeWindowEndDay: number;
  estimatedMinutes: number;
}

export interface DailyShadowSchedule {
  id: "daily-shadow-schedule-v1";
  targetItemCount: 10000;
  newItemsPerDay: 10;
  totalDays: 1000;
  defaultCompletionYears: number;
  rollingReviewWindowDays: 5;
  sessionTargetMinutes: number;
  items: ShadowCurriculumItem[];
  days: DailyShadowScheduleDay[];
}

export interface ShadowSessionPlan {
  id: "shadow-session-plan-v1";
  scheduleId: DailyShadowSchedule["id"];
  displayFields: Array<"simplified" | "pinyin" | "english">;
  audioMode: "browser-tts-fallback";
  autoAdvance: true;
  listenPassesPerLine: number;
  shadowPassesPerLine: number;
  secondsPerListenPass: number;
  secondsPerShadowPass: number;
  defaultSessionMinutes: number;
  controls: Array<"pause" | "replay" | "previous" | "next" | "mark-complete" | "toggle-pinyin" | "toggle-english">;
}

export interface SrsDailyPlanDay {
  day: number;
  newCardItemIds: string[];
  maxNewCards: number;
  introducedOnlyFromSeenShadowItems: true;
}

export interface SrsDailyPlan {
  id: "srs-daily-plan-v1";
  maxNewCardsPerDay: 10;
  scheduler: "fsrs-compatible-local-v1";
  vacationMode: {
    pausesDuePressure: true;
    preservesCardState: true;
  };
  days: SrsDailyPlanDay[];
}

export interface CurriculumRoadmapStoryUnlock {
  storyId: string;
  title: string;
  unlockAtWordCount: number;
  unlockDay: number;
  selectedTopicId?: string;
}

export interface CurriculumRoadmapIslandUnlock {
  islandId: string;
  label: string;
  unlockAtWordCount: number;
  unlockDay: number;
}

export interface CurriculumRoadmap {
  id: "curriculum-roadmap-v1";
  targetVocabularyCount: 10000;
  newItemsPerDay: 10;
  totalShadowDays: 1000;
  defaultCompletionYears: number;
  stages: AcquisitionPathStage[];
  storyUnlocks: CurriculumRoadmapStoryUnlock[];
  islandUnlocks: CurriculumRoadmapIslandUnlock[];
  honestPromise: string;
}

export interface CiPathStage {
  id: string;
  knownWordStart: number;
  knownWordEnd: number;
  label: string;
  maxNewItemsPerSentence: 1 | 2;
  targetKnownCoverage: [number, number];
  targetExposureRange: [number, number];
  acquisitionMode: "ci-plus-one";
  tooEasyPolicy: "review-only";
}

export interface CiPath {
  targetVocabularyCount: 10000;
  primaryEngine: true;
  sourcePath: "acquisition-vocab-path";
  stages: CiPathStage[];
}

export interface CiSentenceTarget {
  id: string;
  vocabularyId: string;
  wordIndex: number;
  simplified: string;
  pinyin?: string;
  sourceListId?: string;
  knownWordThreshold: number;
  targetExposureCount: number;
  currentCuratedExposures: number;
  requiredKnownCoverage: [number, number];
  maxNewItemsPerSentence: 1 | 2;
  status: "needs-curation" | "has-curated-seed";
}

export interface CiCurationQueueItem {
  id: string;
  targetId: string;
  vocabularyId: string;
  wordIndex: number;
  simplified: string;
  pinyin?: string;
  knownWordThreshold: number;
  currentCuratedExposures: number;
  targetExposureCount: number;
  exposureDeficit: number;
  priority: "now" | "next" | "later";
  stageId: string;
  authorability: "ready" | "bootstrap-only" | "needs-more-known-vocabulary";
  authoringNotes: string[];
}

export interface CiCoverageStageReport {
  stageId: string;
  knownWordStart: number;
  knownWordEnd: number;
  targetCount: number;
  targetsWithCuratedSeed: number;
  targetsNeedingCuration: number;
  totalExposureDeficit: number;
}

export interface CiAuthorabilityDeficitSummary {
  targetCount: number;
  totalExposureDeficit: number;
}

export interface CiCoverageReport {
  targetVocabularyCount: 10000;
  targetCount: number;
  targetsWithCuratedSeed: number;
  targetsNeedingCuration: number;
  totalExposureDeficit: number;
  authorabilitySummary: {
    ready: CiAuthorabilityDeficitSummary;
    bootstrapOnly: CiAuthorabilityDeficitSummary;
    needsMoreKnownVocabulary: CiAuthorabilityDeficitSummary;
    nonAuthorable: CiAuthorabilityDeficitSummary;
  };
  stages: CiCoverageStageReport[];
}

export interface CiCurationSlot {
  id: string;
  slotIndex: number;
  requiredNewWordId: string;
  maxOtherNewItems: 0 | 1;
  minKnownCoverage: number;
  functionHint: "statement" | "question" | "negation" | "time" | "preference" | "location" | "description";
}

export interface CiCurationBatchItem {
  queueItemId: string;
  targetId: string;
  vocabularyId: string;
  wordIndex: number;
  simplified: string;
  pinyin?: string;
  stageId: string;
  allowedKnownVocabularyIds: string[];
  sentenceSlots: CiCurationSlot[];
}

export interface CiCurationBatch {
  id: string;
  sequence: number;
  stageId: string;
  targetWordStart: number;
  targetWordEnd: number;
  targetCount: number;
  sentenceSlotCount: number;
  items: CiCurationBatchItem[];
}

export interface CiAuthoringVocabularyItem {
  vocabularyId: string;
  wordIndex: number;
  simplified: string;
  pinyin?: string;
  hskLevel: number;
  partOfSpeech: PartOfSpeech;
  islandTags: IslandTag[];
  movieRank?: number;
  bookRank?: number;
  blcuRank?: number;
}

export interface CiAuthoringSlot {
  id: string;
  slotIndex: number;
  mode: "bootstrap-seed" | "ci-plus-one";
  functionHint: CiCurationSlot["functionHint"];
  requiredNewWord: CiAuthoringVocabularyItem;
  allowedKnownVocabulary: CiAuthoringVocabularyItem[];
  acceptanceCriteria: string[];
}

export interface CiAuthoringPacketItem {
  targetId: string;
  vocabularyId: string;
  wordIndex: number;
  stageId: string;
  requiredNewWord: CiAuthoringVocabularyItem;
  sentenceSlots: CiAuthoringSlot[];
}

export interface CiAuthoringPacket {
  id: string;
  sourceBatchId: string;
  sequence: number;
  stageId: string;
  targetWordStart: number;
  targetWordEnd: number;
  purpose: "author-ci-plus-one-sentences";
  globalRules: string[];
  items: CiAuthoringPacketItem[];
}

export interface CompactCiAuthoringSlot {
  id: string;
  slotIndex: number;
  mode: "bootstrap-seed" | "ci-plus-one";
  functionHint: CiCurationSlot["functionHint"];
  requiredNewWordId: string;
  allowedKnownVocabularyIds: string[];
  acceptanceCriteria: string[];
}

export interface CompactCiAuthoringPacketItem {
  targetId: string;
  vocabularyId: string;
  wordIndex: number;
  stageId: string;
  sentenceSlots: CompactCiAuthoringSlot[];
}

export interface CompactCiAuthoringPacket {
  id: string;
  sourceBatchId: string;
  sequence: number;
  stageId: string;
  targetWordStart: number;
  targetWordEnd: number;
  purpose: "author-ci-plus-one-sentences";
  globalRules: string[];
  vocabularyPool: CiAuthoringVocabularyItem[];
  items: CompactCiAuthoringPacketItem[];
}

export interface AuthoredCiSentence {
  id: string;
  packetId: string;
  sourceBatchId: string;
  slotId: string;
  targetId: string;
  requiredNewWordId: string;
  simplified: string;
  pinyin: string;
  english: string;
  vocabularyIds: string[];
  reviewStatus: "authored" | "curated";
}

export interface AuthoredCiValidationIssue {
  sentenceId: string;
  slotId: string;
  severity: "error" | "warning";
  message: string;
}

export interface AuthoredCiValidationReport {
  sentenceCount: number;
  acceptedCount: number;
  rejectedCount: number;
  issues: AuthoredCiValidationIssue[];
  acceptedSentenceIds: string[];
  rejectedSentenceIds: string[];
}

export interface CiPipelineStep {
  id: string;
  order: number;
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  gate: string;
  currentCount?: number;
  status: "implemented" | "partial" | "pending-source";
}

export interface CiPipelineContract {
  productGoal: "10k-source-backed-ci-plus-one-path";
  primaryEngine: "ci-plus-one-sentence-stream";
  srsRole: "support-retention-only";
  steps: CiPipelineStep[];
}

export type PanMandarinSourceFamily =
  | "TUBELEX_CHINESE"
  | "SUBTLEX_CH"
  | "SPOKEN_CORPUS"
  | "BALANCED_WRITTEN"
  | "HSK_3_0_REFERENCE"
  | "TBCL_TOCFL_REFERENCE"
  | "LANCASTER_WRITTEN"
  | "MANUAL_USEFULNESS";

export type PanMandarinSourceRole =
  | "modern-media-frequency"
  | "subtitle-frequency"
  | "conversation-frequency"
  | "balanced-written-frequency"
  | "learner-coverage-reference"
  | "formal-reading-signal"
  | "manual-quality-gate";

export interface PanMandarinSourceDefinition {
  id: PanMandarinSourceFamily;
  label: string;
  role: PanMandarinSourceRole;
  rankingWeight: number;
  expectedPaths: string[];
  canonicalUrl?: string;
  licenseNote: string;
  parserStatus: "implemented" | "planned" | "manual";
  notes: string;
}

export interface PanMandarinSourceStatus extends PanMandarinSourceDefinition {
  importMode: "file" | "missing" | "manual";
  availablePaths: string[];
  importedEntryCount: number;
}

export interface PanMandarinSourceAudit {
  target: "pan-mandarin-concept-backed-10k";
  generatedAt: string;
  sourceStatuses: PanMandarinSourceStatus[];
  warnings: string[];
}

export interface PanMandarinSourceMembership {
  source: PanMandarinSourceFamily;
  rank?: number;
  frequency?: number;
  level?: string;
  region?: "global" | "mainland" | "taiwan" | "shared";
}

export type PanMandarinPartOfSpeech = PartOfSpeech | "unknown";
export type PanMandarinSentenceability = "sentence-target" | "function-frame" | "needs-companion-word" | "defer" | "blocked";
export type PanMandarinGrammarTagStatus = "tagged" | "unclassified";
export type PanMandarinNaturalnessDisposition =
  | "accepted-review"
  | "needs-human-review"
  | "rejected-robotic"
  | "rejected-semantic"
  | "rejected-too-thin";

export interface PanMandarinSentenceReadiness {
  sentenceability: PanMandarinSentenceability;
  partOfSpeech: PanMandarinPartOfSpeech;
  grammarRoles: string[];
  minimumKnownBase: number;
  cleanupNotes: string[];
}

export interface PanMandarinVariant {
  variantId: string;
  region: "universal" | "mainland" | "taiwan" | "hong-kong" | "other";
  simplified: string;
  traditional?: string;
  pinyin?: string;
  pronunciationRegion?: "standard-mainland" | "standard-taiwan" | "shared";
  sourceRefs: string[];
  exampleStatus: "missing" | "source-backed" | "reviewed";
}

export interface PanMandarinConcept {
  conceptId: string;
  gloss: string;
  category:
    | "universal-core"
    | "universal-regionally-uneven"
    | "essential-regional-pair"
    | "mainland-preferred"
    | "taiwan-preferred"
    | "formal-written"
    | "colloquial"
    | "low-value-specialist";
  globalRank?: number;
  communicationPathRank?: number;
  mainlandRank?: number;
  taiwanRank?: number;
  communicationRank?: number;
  readingRank?: number;
  sentenceReadiness: PanMandarinSentenceReadiness;
  scores: {
    globalFrequency: number;
    mainlandFrequency: number;
    taiwanFrequency: number;
    spoken: number;
    written: number;
    learnerCoverage: number;
    manualUsefulness: number;
  };
  variants: PanMandarinVariant[];
  sourceMemberships: PanMandarinSourceMembership[];
}

export interface PanMandarinGrammarPoint {
  id: string;
  label: string;
  simplified: string;
  level: "bootstrap" | "early" | "core";
  sourceRefs: string[];
  role: string;
}

export interface PanMandarinCiCandidate {
  id: string;
  conceptId: string;
  targetGlobalRank: number;
  targetCommunicationPathRank: number;
  target: {
    simplified: string;
    traditional?: string;
    pinyin?: string;
    gloss: string;
    partOfSpeech: PanMandarinPartOfSpeech;
    sentenceability: PanMandarinSentenceability;
  };
  mode: "bootstrap" | "ci-plus-one" | "blocked";
  naturalnessDisposition: PanMandarinNaturalnessDisposition;
  naturalnessReasons: string[];
  simplified?: string;
  traditional?: string;
  pinyin?: string;
  english?: string;
  knownConceptIds: string[];
  newConceptIds: string[];
  grammarPointIds: string[];
  grammarSourceRefs: string[];
  grammarLevel?: PanMandarinGrammarPoint["level"];
  grammarTagStatus: PanMandarinGrammarTagStatus;
  reviewStatus: "review-only";
}

export interface PanMandarinCiCoverageReport {
  targetConceptCount: number;
  sentenceReadyCount: number;
  functionFrameCount: number;
  needsCompanionWordCount: number;
  deferredCount: number;
  blockedCount: number;
  candidateCount: number;
  acceptedReviewCount: number;
  needsHumanReviewCount: number;
  rejectedCount: number;
  trueCiPlusOneCount: number;
  bootstrapCount: number;
  unclassifiedGrammarCount: number;
  targetsWithCandidateOrReason: number;
}

export type PanMandarinContentReviewStatus = "review-only";
export type PanMandarinContentQueueStatus = "review-ready" | "needs-more-ci-coverage" | "blocked";

export interface PanMandarinIslandUnlock {
  id: string;
  label: string;
  unlockAtWordCount: number;
  themeTags: IslandTag[];
  purpose: "language-island";
  allowedContent: Array<"sentence-stream" | "dialogue" | "short-reading" | "story">;
  status: PanMandarinContentQueueStatus;
  reviewStatus: PanMandarinContentReviewStatus;
  eligibleConceptIds: string[];
  sentenceCandidateIds: string[];
  notes: string[];
}

export interface PanMandarinStoryQueue {
  id: string;
  title: string;
  islandId: string;
  unlockAtWordCount: number;
  knownVocabularyRange: [number, number];
  maxAllowedCommunicationPathRank: number;
  themeTags: IslandTag[];
  storyType: "micro-story" | "scenario-story" | "dialogue-story";
  storyFormat: "dialogue-story";
  selectedTopicId?: string;
  topicSupportScore: number;
  topicEvidenceConceptIds: string[];
  targetLineCount: number;
  requiredKnownConceptIds: string[];
  targetNewConceptIds: string[];
  suggestedSentenceCandidateIds: string[];
  knownCoverageTarget: [number, number];
  maxNewConceptsPerLine: 1 | 2;
  grammarPointIds: string[];
  authoringBrief: string;
  status: PanMandarinContentQueueStatus;
  reviewStatus: PanMandarinContentReviewStatus;
  blockingReasons: string[];
}

export interface PanMandarinPremadeLine {
  id: string;
  sourceCandidateId: string;
  conceptId: string;
  source: "ci-candidate" | "dialogue-turn";
  simplified: string;
  traditional?: string;
  pinyin?: string;
  english: string;
  knownConceptIds: string[];
  newConceptIds: string[];
  grammarPointIds: string[];
  conceptIds: string[];
  maxConceptCommunicationPathRank: number;
  overrideConceptIds: string[];
  overrideReasons: string[];
  naturalnessDisposition: "accepted-review";
  islandTags: IslandTag[];
  episodeBeat: string;
  speaker: string;
  scenePurpose: string;
}

export interface PanMandarinPremadeIsland {
  id: string;
  sourceIslandId: string;
  label: string;
  unlockAtWordCount: number;
  themeTags: IslandTag[];
  reviewStatus: PanMandarinContentReviewStatus;
  shortPhrases: string[];
  miniDialogueLines: string[];
  scenarioPrompts: string[];
  sentencePack: PanMandarinPremadeLine[];
  storyIds: string[];
  notes: string[];
}

export interface PanMandarinPremadeStory {
  id: string;
  sourceStoryQueueId: string;
  islandId: string;
  title: string;
  unlockAtWordCount: number;
  knownVocabularyRange: [number, number];
  maxAllowedCommunicationPathRank: number;
  themeTags: IslandTag[];
  storyType: "micro-story" | "scenario-story" | "dialogue-story";
  storyFormat: "dialogue-story";
  selectedTopicId?: string;
  topicSupportScore: number;
  topicEvidenceConceptIds: string[];
  reviewStatus: PanMandarinContentReviewStatus;
  status: PanMandarinContentQueueStatus;
  milestoneKnownWordEnd: number;
  knownCoverageTarget: [number, number];
  maxNewConceptsPerLine: 1 | 2;
  lines: PanMandarinPremadeLine[];
  turns: PanMandarinPremadeLine[];
  authoringBrief: string;
  notes: string[];
}

export interface PanMandarinContentCoverageReport {
  islandCount: number;
  storyQueueCount: number;
  premadeIslandCount: number;
  premadeStoryCount: number;
  premadeStoryLineCount: number;
  milestoneStoryCount: number;
  islandPhrasePackCount: number;
  islandMiniDialogueLineCount: number;
  islandScenarioPromptCount: number;
  storyCoherenceTaggedLineCount: number;
  overrideLineCount: number;
  overrideConceptCount: number;
  reviewReadyIslandCount: number;
  reviewReadyStoryQueueCount: number;
  blockedStoryQueueCount: number;
  earliestIslandUnlockAtWordCount: number;
  adultIslandCountBefore2000: number;
  storyQueuesWithCoverageTargets: number;
}

export type PanMandarinContentReviewItemType = "story-line" | "island-phrase" | "island-dialogue-line" | "island-scenario-prompt";
export type PanMandarinContentReviewSourceItemType = "premade-story-line" | "premade-island";
export type PanMandarinContentReviewDisposition = "needs-human-review";
export type PanMandarinContentSuggestedCurationAction = "review-naturalness-and-promote" | "rewrite-before-promotion" | "convert-scenario-to-controlled-lines";

export interface PanMandarinContentReviewQueueItem {
  id: string;
  itemType: PanMandarinContentReviewItemType;
  sourceId: string;
  sourceItemId: string;
  sourceItemType: PanMandarinContentReviewSourceItemType;
  islandId: string;
  storyId?: string;
  unlockAtWordCount: number;
  maxAllowedCommunicationPathRank: number;
  knownCoverageTarget: [number, number];
  simplified: string;
  pinyin?: string;
  english?: string;
  islandTags: IslandTag[];
  grammarPointIds: string[];
  conceptIds: string[];
  overrideConceptIds: string[];
  overrideReasons: string[];
  episodeBeat?: string;
  speaker?: PanMandarinPremadeLine["speaker"];
  scenePurpose?: string;
  reviewStatus: PanMandarinContentReviewStatus;
  reviewDisposition: PanMandarinContentReviewDisposition;
  suggestedCurationAction: PanMandarinContentSuggestedCurationAction;
  blockingReasons: string[];
  reviewReasons: string[];
}

export interface PanMandarinContentReviewReport {
  queueItemCount: number;
  storyLineItemCount: number;
  islandPhraseItemCount: number;
  islandDialogueLineItemCount: number;
  islandScenarioPromptItemCount: number;
  needsHumanReviewCount: number;
  overrideItemCount: number;
  reviewOnlyItemCount: number;
  earliestUnlockAtWordCount: number;
  latestUnlockAtWordCount: number;
}

export interface PanMandarinStoryTopicCandidate {
  id: string;
  label: string;
  inferredDomain: string;
  requiredForms: string[];
  supportingForms: string[];
  requiredConceptIds: string[];
  supportingConceptIds: string[];
  missingForms: string[];
  supportScore: number;
  status: "supported" | "blocked";
  blockingReasons: string[];
}

export interface PanMandarinStoryTopicPlan {
  id: string;
  knownVocabularyRange: [number, number];
  unlockAtWordCount: number;
  maxAllowedCommunicationPathRank: number;
  availableConceptCount: number;
  practicalClusterForms: string[];
  supportedTopicCandidates: PanMandarinStoryTopicCandidate[];
  blockedTopicCandidates: PanMandarinStoryTopicCandidate[];
  selectedTopicId?: string;
  selectedTopicLabel?: string;
  selectedTopicSupportScore?: number;
  selectedTopicEvidenceConceptIds: string[];
  status: "story-ready" | "blocked";
  blockingReasons: string[];
}
