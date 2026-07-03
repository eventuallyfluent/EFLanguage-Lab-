import { LexiconEntry, ReadingSentence } from "./models";

export function assertNoDuplicates<T>(items: T[], getText: (item: T) => string): void {
  const seen = new Set<string>();
  for (const item of items) {
    const text = getText(item);
    if (seen.has(text)) throw new Error(`Duplicate output detected: ${text}`);
    seen.add(text);
  }
}

export function coverageFor(vocabularyIds: string[], lexicon: LexiconEntry[]): number {
  const known = new Set(lexicon.map((entry) => entry.id));
  const total = vocabularyIds.length;
  if (total === 0) return 1;
  const covered = vocabularyIds.filter((id) => known.has(id)).length;
  return Number((covered / total).toFixed(4));
}

export function readingCoverageFor(sentences: ReadingSentence[]): number {
  const total = sentences.reduce((sum, sentence) => sum + sentence.vocabularyIds.length + sentence.newWordIds.length, 0);
  if (total === 0) return 1;
  const newWords = sentences.reduce((sum, sentence) => sum + sentence.newWordIds.length, 0);
  return Number(((total - newWords) / total).toFixed(4));
}

export function difficultyFor(vocabulary: LexiconEntry[]): "beginner-1" | "beginner-2" | "beginner-3" {
  const uniqueCount = new Set(vocabulary.map((entry) => entry.id)).size;
  const hasLevel2 = vocabulary.some((entry) => entry.hskLevel >= 2);
  if (uniqueCount <= 3 && !hasLevel2) return "beginner-1";
  if (uniqueCount <= 5) return "beginner-2";
  return "beginner-3";
}

export function validateCiPlusOne(sentences: ReadingSentence[]): boolean {
  const coverage = readingCoverageFor(sentences);
  return coverage >= 0.95 && coverage <= 0.98 && sentences.every((sentence) => sentence.newWordIds.length <= 2);
}

export function sentenceSignature(text: string): string {
  return text
    .replace(/^(今天|昨天|明天|每天|早上|晚上|下午)/, "<time>")
    .replace(/^(我|你|他|她|我们)/, "<subject>")
    .replace(/不/g, "<neg>")
    .replace(/也/g, "")
    .replace(/了$/g, "")
    .replace(/吗$/g, "?");
}
