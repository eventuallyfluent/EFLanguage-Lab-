import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AuthoredCiSentence } from "../models";

const defaultSourcePath = join("source-lists", "authored-ci-sentences.json");

export function loadAuthoredCiSentences(sourcePath = defaultSourcePath): AuthoredCiSentence[] {
  if (!existsSync(sourcePath)) return [];
  const parsed = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`${sourcePath} must contain a JSON array of authored CI sentences.`);
  }

  return parsed.map((item, index) => normalizeAuthoredCiSentence(item, index, sourcePath));
}

export const authoredCiSentences: AuthoredCiSentence[] = loadAuthoredCiSentences();

function normalizeAuthoredCiSentence(item: unknown, index: number, sourcePath: string): AuthoredCiSentence {
  if (!item || typeof item !== "object") {
    throw new Error(`${sourcePath}[${index}] must be an authored CI sentence object.`);
  }

  const record = item as Record<string, unknown>;
  return {
    id: requiredString(record, "id", index, sourcePath),
    packetId: requiredString(record, "packetId", index, sourcePath),
    sourceBatchId: requiredString(record, "sourceBatchId", index, sourcePath),
    slotId: requiredString(record, "slotId", index, sourcePath),
    targetId: requiredString(record, "targetId", index, sourcePath),
    requiredNewWordId: requiredString(record, "requiredNewWordId", index, sourcePath),
    simplified: requiredString(record, "simplified", index, sourcePath),
    pinyin: requiredString(record, "pinyin", index, sourcePath),
    english: requiredString(record, "english", index, sourcePath),
    vocabularyIds: requiredStringArray(record, "vocabularyIds", index, sourcePath),
    reviewStatus: reviewStatus(record, index, sourcePath)
  };
}

function requiredString(record: Record<string, unknown>, key: string, index: number, sourcePath: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${sourcePath}[${index}].${key} must be a non-empty string.`);
  }
  return value;
}

function requiredStringArray(record: Record<string, unknown>, key: string, index: number, sourcePath: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new Error(`${sourcePath}[${index}].${key} must be an array of non-empty strings.`);
  }
  return value;
}

function reviewStatus(record: Record<string, unknown>, index: number, sourcePath: string): AuthoredCiSentence["reviewStatus"] {
  const value = record.reviewStatus;
  if (value !== "authored" && value !== "curated") {
    throw new Error(`${sourcePath}[${index}].reviewStatus must be "authored" or "curated".`);
  }
  return value;
}
