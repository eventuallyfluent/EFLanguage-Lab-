import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PartOfSpeech } from "../models";

export interface Hsk30SourceEntry {
  sourceListId: string;
  simplified: string;
  pinyin: string;
  hskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  partOfSpeech: PartOfSpeech;
  webNo?: number;
}

const defaultSourcePath = join("source-lists", "hsk30.csv");

export function loadHsk30SourceEntries(sourcePath = defaultSourcePath): Hsk30SourceEntry[] {
  if (!existsSync(sourcePath)) return [];
  const text = readFileSync(sourcePath, "utf8");
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const header = parseCsvLine(headerLine);
  const indexes = {
    id: header.indexOf("ID"),
    simplified: header.indexOf("Simplified"),
    pinyin: header.indexOf("Pinyin"),
    pos: header.indexOf("POS"),
    level: header.indexOf("Level"),
    webNo: header.indexOf("WebNo")
  };

  if (Object.values(indexes).some((index) => index < 0)) {
    throw new Error(`Invalid HSK 3.0 source header: ${headerLine}`);
  }

  const entries: Hsk30SourceEntry[] = [];

  for (const line of lines) {
    const fields = parseCsvLine(line);
    const simplified = firstVariant(fields[indexes.simplified]);
    if (!simplified) continue;
    const level = levelFromSource(fields[indexes.level]);
    if (!Number.isInteger(level) || level < 1 || level > 9) continue;
    entries.push({
      sourceListId: fields[indexes.id],
      simplified,
      pinyin: firstVariant(fields[indexes.pinyin]),
      hskLevel: level as Hsk30SourceEntry["hskLevel"],
      partOfSpeech: mapHskPos(fields[indexes.pos]),
      webNo: numberOrUndefined(fields[indexes.webNo])
    });
  }

  return entries.sort((a, b) => a.hskLevel - b.hskLevel || (a.webNo ?? Number.MAX_SAFE_INTEGER) - (b.webNo ?? Number.MAX_SAFE_INTEGER));
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      fields.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  fields.push(current);
  return fields;
}

function firstVariant(value: string): string {
  return value.split("|")[0]?.trim() ?? "";
}

function numberOrUndefined(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function levelFromSource(value: string): number {
  if (value === "7-9") return 7;
  return Number(value);
}

function mapHskPos(pos: string): PartOfSpeech {
  const clean = pos.toLowerCase();
  if (clean.includes("v")) return "verb";
  if (clean.includes("pron")) return "pronoun";
  if (clean.includes("adj")) return "adjective";
  if (clean.includes("adv")) return "adverb";
  if (clean.includes("num")) return "number";
  if (clean.includes("conj")) return "conjunction";
  if (clean.includes("mw") || clean.includes("clf")) return "measure";
  if (clean.includes("part")) return "particle";
  if (clean.includes("loc")) return "location";
  if (clean.includes("time")) return "time";
  return "noun";
}
