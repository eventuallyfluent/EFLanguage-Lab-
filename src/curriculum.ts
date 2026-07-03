import { ContentComplexity, CurriculumPack, CurriculumTierId, CurriculumTierPolicy, GeneratedSentence, IslandTag } from "./models";

export const curriculumTierPolicies: CurriculumTierPolicy[] = [
  {
    id: "100-tier",
    minKnownWords: 100,
    label: "Survival beginner",
    requiredThemes: ["identity", "daily-life", "food", "drink", "school", "time", "home", "location", "social", "question"],
    forbiddenThemes: ["work", "health", "transport", "weather", "shopping"],
    targetSentenceCount: 60,
    dialogueCount: 8,
    readingCount: 8,
    maxClauseComplexity: "single-clause",
    allowedGrammar: ["是", "有", "在", "去", "喜欢", "想", "会", "不", "没有", "吗", "很", "也", "每天"],
    unlockNotes: "Classroom-safe survival content only."
  },
  {
    id: "300-tier",
    minKnownWords: 300,
    label: "Core daily life",
    requiredThemes: ["shopping", "daily-life", "food", "drink", "social", "time", "location"],
    forbiddenThemes: ["work", "health"],
    targetSentenceCount: 80,
    dialogueCount: 4,
    readingCount: 4,
    maxClauseComplexity: "paired-clause",
    allowedGrammar: ["想", "要", "请", "也", "不", "没有", "吗", "很", "太", "了", "每", "能"],
    unlockNotes: "Simple errands, stores, restaurants, basic devices, light transport only."
  },
  {
    id: "1000-tier",
    minKnownWords: 1000,
    label: "Practical bridge",
    requiredThemes: ["transport", "time", "location", "social", "shopping"],
    forbiddenThemes: ["work", "health"],
    targetSentenceCount: 100,
    dialogueCount: 3,
    readingCount: 3,
    maxClauseComplexity: "paired-clause",
    allowedGrammar: ["可是", "请", "再", "一点", "了", "没有", "要", "想", "会", "能"],
    unlockNotes: "Practical movement, missed plans, and simple scheduling without adult operating-life pressure."
  },
  {
    id: "2000-tier",
    minKnownWords: 2000,
    label: "Adult operating life",
    requiredThemes: ["work", "health", "transport", "time"],
    forbiddenThemes: [],
    targetSentenceCount: 120,
    dialogueCount: 4,
    readingCount: 4,
    maxClauseComplexity: "paired-clause",
    allowedGrammar: ["可是", "没有", "要", "想", "会", "能", "了", "请"],
    unlockNotes: "Work, health, and money-pressure content may appear here."
  },
  {
    id: "3000-tier",
    minKnownWords: 3000,
    label: "Adult nuance",
    requiredThemes: ["work", "health", "social", "time"],
    forbiddenThemes: [],
    targetSentenceCount: 140,
    dialogueCount: 4,
    readingCount: 4,
    maxClauseComplexity: "multi-clause",
    allowedGrammar: ["可是", "没有", "要", "想", "会", "能", "了", "请", "再"],
    unlockNotes: "Longer multi-clause adult scenarios and tradeoffs."
  }
];

export function curriculumPolicyForTier(tierId: CurriculumTierId): CurriculumTierPolicy {
  const policy = curriculumTierPolicies.find((entry) => entry.id === tierId);
  if (!policy) throw new Error(`Missing curriculum policy for tier ${tierId}`);
  return policy;
}

export function isComplexityAllowed(level: ContentComplexity, max: ContentComplexity): boolean {
  return complexityRank(level) <= complexityRank(max);
}

export function validateCurriculumPack(pack: CurriculumPack, knownLexiconIds: Set<string>): string[] {
  const issues: string[] = [];
  const policy = curriculumPolicyForTier(pack.tierId);
  const packThemes = new Set(pack.themeTags);

  for (const forbidden of policy.forbiddenThemes) {
    if (packThemes.has(forbidden)) issues.push(`Forbidden theme ${forbidden} in ${pack.id}`);
  }

  if (!isComplexityAllowed(maxPackComplexity(pack), policy.maxClauseComplexity)) {
    issues.push(`Pack ${pack.id} exceeds max complexity ${policy.maxClauseComplexity}`);
  }

  if (pack.sentences.length < 3) issues.push(`Pack ${pack.id} has too few sentences`);
  if (pack.dialogues.length < 1 || pack.dialogues.length > 2) issues.push(`Pack ${pack.id} must have 1-2 dialogues`);
  if (pack.readings.length !== 1) issues.push(`Pack ${pack.id} must have exactly 1 reading`);

  for (const sentence of pack.sentences) {
    if ((sentence.unlockAtWordCount ?? 0) > pack.unlockAtWordCount) issues.push(`Sentence ${sentence.id} unlocks after pack ${pack.id}`);
    if (!sentence.vocabularyIds.every((id) => knownLexiconIds.has(id))) issues.push(`Sentence ${sentence.id} uses unknown vocabulary`);
    for (const forbidden of policy.forbiddenThemes) {
      if ((sentence.themeTags ?? []).includes(forbidden)) issues.push(`Forbidden sentence theme ${forbidden} in ${sentence.id}`);
    }
  }

  for (const dialogue of pack.dialogues) {
    if (dialogue.unlockAtWordCount > pack.unlockAtWordCount) issues.push(`Dialogue ${dialogue.id} unlocks after pack ${pack.id}`);
    for (const forbidden of policy.forbiddenThemes) {
      if (dialogue.islandTags.includes(forbidden)) issues.push(`Forbidden dialogue theme ${forbidden} in ${dialogue.id}`);
    }
    for (const turn of dialogue.turns) {
      if (!turn.vocabularyIds.every((id) => knownLexiconIds.has(id))) issues.push(`Dialogue ${dialogue.id} uses unknown vocabulary`);
    }
  }

  for (const reading of pack.readings) {
    if (reading.unlockAtWordCount > pack.unlockAtWordCount) issues.push(`Reading ${reading.id} unlocks after pack ${pack.id}`);
    if (!isComplexityAllowed(reading.complexity, policy.maxClauseComplexity)) issues.push(`Reading ${reading.id} exceeds tier complexity`);
    if (reading.knownVocabularyCoverage < 0.95 || reading.knownVocabularyCoverage > 0.98) issues.push(`Reading ${reading.id} has invalid CI+1 coverage`);
    if (!reading.ciPlusOneValid) issues.push(`Reading ${reading.id} failed CI+1 validation`);
    if (reading.sentences.every((sentence) => sentence.newWordIds.length === 0)) issues.push(`Reading ${reading.id} has no controlled new word`);
    for (const forbidden of policy.forbiddenThemes) {
      if (reading.islandTags.includes(forbidden)) issues.push(`Forbidden reading theme ${forbidden} in ${reading.id}`);
    }
    for (const sentence of reading.sentences) {
      if (sentence.newWordIds.length > 2) issues.push(`Reading ${reading.id} sentence introduces too many new words`);
      if (!sentence.vocabularyIds.every((id) => knownLexiconIds.has(id)) || !sentence.newWordIds.every((id) => knownLexiconIds.has(id))) {
        issues.push(`Reading ${reading.id} uses unknown vocabulary`);
      }
    }
  }

  return issues;
}

export function maxPackComplexity(pack: CurriculumPack): ContentComplexity {
  const ranks = [
    ...pack.sentences.map((sentence) => sentence.complexity ?? "single-clause"),
    ...pack.dialogues.map((dialogue) => dialogue.complexity),
    ...pack.readings.map((reading) => reading.complexity)
  ];
  return ranks.reduce((max, current) => (complexityRank(current) > complexityRank(max) ? current : max), "single-clause" as ContentComplexity);
}

export function flattenPackSentences(packs: CurriculumPack[]): GeneratedSentence[] {
  const seen = new Set<string>();
  const flattened: GeneratedSentence[] = [];
  for (const pack of packs) {
    for (const sentence of pack.sentences) {
      if (seen.has(sentence.id)) continue;
      seen.add(sentence.id);
      flattened.push(sentence);
    }
  }
  return flattened;
}

function complexityRank(level: ContentComplexity): number {
  if (level === "single-clause") return 0;
  if (level === "paired-clause") return 1;
  return 2;
}
