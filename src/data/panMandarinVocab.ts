import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TextDecoder } from "node:util";
import {
  PanMandarinConcept,
  PanMandarinPartOfSpeech,
  PanMandarinSentenceReadiness,
  PanMandarinSourceFamily,
  PanMandarinSourceMembership,
  PanMandarinVariant,
  PartOfSpeech
} from "../models";

interface TubelexEntry {
  word: string;
  count: number;
  videos: number;
  channels: number;
  rank: number;
}

interface SubtlexEntry {
  word: string;
  count: number;
  perMillion: number;
  contextCount: number;
  rank: number;
}

interface TocflEntry {
  word: string;
  pinyin: string;
  level: string;
  gloss: string;
  otherTranslations: string;
}

interface HskReferenceEntry {
  simplified: string;
  traditional?: string;
  pinyin: string;
  level: string;
  partOfSpeech: PartOfSpeech;
}

interface RawSources {
  tubelex: TubelexEntry[];
  subtlex: SubtlexEntry[];
  tocfl: TocflEntry[];
  hsk: HskReferenceEntry[];
}

type ConceptDraft = {
  conceptId: string;
  form: string;
  gloss?: string;
  pinyin?: string;
  traditional?: string;
  sourceMemberships: PanMandarinSourceMembership[];
  sourceRefs: Set<string>;
  tubelexRank?: number;
  tubelexCount?: number;
  tubelexChannels?: number;
  subtlexRank?: number;
  subtlexCount?: number;
  hskLevel?: string;
  tocflLevel?: string;
  partOfSpeech?: PartOfSpeech;
};

const defaultLimit = 10000;

export function loadPanMandarinRawSources(): RawSources {
  return {
    tubelex: loadTubelexEntries(),
    subtlex: loadSubtlexEntries(),
    tocfl: loadTocflEntries(),
    hsk: loadHskReferenceEntries()
  };
}

export function buildPanMandarinVocab(limit = defaultLimit): PanMandarinConcept[] {
  const raw = loadPanMandarinRawSources();
  const drafts = new Map<string, ConceptDraft>();

  for (const entry of raw.tubelex) {
    const draft = ensureDraft(drafts, entry.word);
    draft.tubelexRank = entry.rank;
    draft.tubelexCount = entry.count;
    draft.tubelexChannels = entry.channels;
    addMembership(draft, { source: "TUBELEX_CHINESE", rank: entry.rank, frequency: entry.count, region: "global" });
  }

  for (const entry of raw.subtlex) {
    const draft = ensureDraft(drafts, entry.word);
    draft.subtlexRank = entry.rank;
    draft.subtlexCount = entry.count;
    addMembership(draft, { source: "SUBTLEX_CH", rank: entry.rank, frequency: entry.count, region: "global" });
  }

  for (const entry of raw.hsk) {
    const draft = ensureDraft(drafts, entry.simplified);
    draft.pinyin ??= entry.pinyin;
    draft.traditional ??= entry.traditional;
    draft.hskLevel = entry.level;
    draft.partOfSpeech ??= entry.partOfSpeech;
    addMembership(draft, { source: "HSK_3_0_REFERENCE", level: entry.level, region: "mainland" });
  }

  const hskByTraditional = new Map(raw.hsk.filter((entry) => entry.traditional).map((entry) => [entry.traditional, entry]));
  for (const entry of raw.tocfl) {
    const hskMatch = hskByTraditional.get(entry.word);
    const form = hskMatch?.simplified ?? entry.word;
    const draft = ensureDraft(drafts, form);
    draft.pinyin ??= entry.pinyin;
    draft.traditional ??= entry.word;
    draft.gloss ??= entry.gloss;
    draft.tocflLevel = entry.level;
    addMembership(draft, { source: "TBCL_TOCFL_REFERENCE", level: entry.level, region: "taiwan" });
  }

  const globalRanked = Array.from(drafts.values())
    .map(toConcept)
    .sort(compareConcepts)
    .slice(0, limit)
    .map((concept, index) => ({
      ...concept,
      globalRank: index + 1,
      communicationRank: index + 1
    }));

  const communicationRanks = new Map(
    [...globalRanked]
      .sort(compareCommunicationPath)
      .map((concept, index) => [concept.conceptId, index + 1])
  );

  return globalRanked.map((concept) => ({
    ...concept,
    communicationPathRank: communicationRanks.get(concept.conceptId) ?? concept.globalRank
  }));
}

export function panMandarinVocabToCsv(concepts: PanMandarinConcept[]): string {
  const header = [
    "globalRank",
    "conceptId",
    "gloss",
    "category",
    "simplified",
    "traditional",
    "pinyin",
    "tubelexRank",
    "subtlexRank",
    "hsk30Level",
    "tocflLevel",
    "sourceTags",
    "globalFrequencyScore",
    "spokenScore",
    "writtenScore",
    "learnerCoverageScore"
  ];
  const rows = concepts.map((concept) => {
    const primary = concept.variants[0];
    const membership = new Map(concept.sourceMemberships.map((item) => [item.source, item]));
    return [
      concept.globalRank ?? "",
      concept.conceptId,
      concept.gloss,
      concept.category,
      primary?.simplified ?? "",
      primary?.traditional ?? "",
      primary?.pinyin ?? "",
      membership.get("TUBELEX_CHINESE")?.rank ?? "",
      membership.get("SUBTLEX_CH")?.rank ?? "",
      membership.get("HSK_3_0_REFERENCE")?.level ?? "",
      membership.get("TBCL_TOCFL_REFERENCE")?.level ?? "",
      concept.sourceMemberships.map((item) => item.source).join("|"),
      concept.scores.globalFrequency,
      concept.scores.spoken,
      concept.scores.written,
      concept.scores.learnerCoverage
    ];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

function loadTubelexEntries(sourcePath = join("source-lists", "tubelex-zh.tsv")): TubelexEntry[] {
  if (!existsSync(sourcePath)) return [];
  const [headerLine, ...lines] = readFileSync(sourcePath, "utf8").split(/\r?\n/).filter(Boolean);
  const header = headerLine.split("\t");
  const wordIndex = header.indexOf("word");
  const countIndex = header.indexOf("count");
  const videosIndex = header.indexOf("videos");
  const channelsIndex = header.indexOf("channels");
  const out: TubelexEntry[] = [];
  for (const line of lines) {
    const fields = line.split("\t");
    const word = fields[wordIndex]?.trim();
    if (!isMandarinWordForm(word)) continue;
    out.push({
      word,
      count: numberOrZero(fields[countIndex]),
      videos: numberOrZero(fields[videosIndex]),
      channels: numberOrZero(fields[channelsIndex]),
      rank: out.length + 1
    });
  }
  return out;
}

function loadSubtlexEntries(sourcePath = join("source-lists", "subtlex-ch", "SUBTLEX-CH-WF")): SubtlexEntry[] {
  if (!existsSync(sourcePath)) return [];
  const text = new TextDecoder("gb18030").decode(readFileSync(sourcePath));
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headerIndex = lines.findIndex((line) => line.startsWith("Word\t"));
  if (headerIndex < 0) return [];
  const header = lines[headerIndex].split("\t");
  const indexes = {
    word: header.indexOf("Word"),
    count: header.indexOf("WCount"),
    perMillion: header.indexOf("W/million"),
    contextCount: header.indexOf("W-CD")
  };
  const out: SubtlexEntry[] = [];
  for (const line of lines.slice(headerIndex + 1)) {
    const fields = line.split("\t");
    const word = fields[indexes.word]?.trim();
    if (!isMandarinWordForm(word)) continue;
    out.push({
      word,
      count: numberOrZero(fields[indexes.count]),
      perMillion: numberOrZero(fields[indexes.perMillion]),
      contextCount: numberOrZero(fields[indexes.contextCount]),
      rank: out.length + 1
    });
  }
  return out;
}

function loadTocflEntries(sourcePath = join("source-lists", "tocfl.csv")): TocflEntry[] {
  if (!existsSync(sourcePath)) return [];
  const rows = parseCsv(readFileSync(sourcePath, "utf8"));
  const header = rows[0] ?? [];
  const indexes = {
    word: header.indexOf("Word"),
    pinyin: header.indexOf("Pinyin"),
    level: header.indexOf("Level"),
    gloss: header.indexOf("First Translation"),
    otherTranslations: header.indexOf("Other Translations")
  };
  return rows.slice(1)
    .map((row): TocflEntry => ({
      word: row[indexes.word]?.trim() ?? "",
      pinyin: row[indexes.pinyin]?.trim() ?? "",
      level: row[indexes.level]?.trim() ?? "",
      gloss: row[indexes.gloss]?.trim() ?? "",
      otherTranslations: row[indexes.otherTranslations]?.trim() ?? ""
    }))
    .filter((entry) => isMandarinWordForm(entry.word));
}

function loadHskReferenceEntries(sourcePath = join("source-lists", "hsk30.csv")): HskReferenceEntry[] {
  if (!existsSync(sourcePath)) return [];
  const rows = parseCsv(readFileSync(sourcePath, "utf8"));
  const header = rows[0] ?? [];
  const indexes = {
    simplified: header.indexOf("Simplified"),
    traditional: header.indexOf("Traditional"),
    pinyin: header.indexOf("Pinyin"),
    pos: header.indexOf("POS"),
    level: header.indexOf("Level")
  };
  return rows.slice(1)
    .map((row): HskReferenceEntry => ({
      simplified: firstVariant(row[indexes.simplified] ?? ""),
      traditional: firstVariant(row[indexes.traditional] ?? ""),
      pinyin: firstVariant(row[indexes.pinyin] ?? ""),
      level: row[indexes.level]?.trim() ?? "",
      partOfSpeech: mapHskPos(row[indexes.pos] ?? "")
    }))
    .filter((entry) => isMandarinWordForm(entry.simplified));
}

function ensureDraft(drafts: Map<string, ConceptDraft>, form: string): ConceptDraft {
  const existing = drafts.get(form);
  if (existing) return existing;
  const draft: ConceptDraft = {
    conceptId: conceptIdFor(form),
    form,
    sourceMemberships: [],
    sourceRefs: new Set()
  };
  drafts.set(form, draft);
  return draft;
}

function addMembership(draft: ConceptDraft, membership: PanMandarinSourceMembership): void {
  if (draft.sourceMemberships.some((item) => item.source === membership.source)) return;
  draft.sourceMemberships.push(membership);
  draft.sourceRefs.add(membership.source);
}

function toConcept(draft: ConceptDraft): PanMandarinConcept {
  const spoken = Math.max(rankScore(draft.tubelexRank, 100), rankScore(draft.subtlexRank, 80));
  const written = 0;
  const learnerCoverage = (draft.hskLevel ? 45 : 0) + (draft.tocflLevel ? 45 : 0);
  const globalFrequency = Math.round(spoken + written + learnerCoverage * 0.2);
  const primaryVariant: PanMandarinVariant = {
    variantId: `${draft.conceptId}:shared`,
    region: draft.tocflLevel && !draft.hskLevel ? "taiwan" : "universal",
    simplified: draft.form,
    traditional: draft.traditional && draft.traditional !== draft.form ? draft.traditional : undefined,
    pinyin: draft.pinyin,
    pronunciationRegion: draft.tocflLevel && !draft.hskLevel ? "standard-taiwan" : "shared",
    sourceRefs: Array.from(draft.sourceRefs).sort(),
    exampleStatus: "missing"
  };

  return {
    conceptId: draft.conceptId,
    gloss: draft.gloss ?? draft.form,
    category: categoryFor(draft),
    mainlandRank: draft.hskLevel ? draft.tubelexRank : undefined,
    taiwanRank: draft.tocflLevel ? draft.tubelexRank ?? draft.subtlexRank : undefined,
    readingRank: draft.tubelexRank === undefined && draft.subtlexRank === undefined ? undefined : Math.min(draft.tubelexRank ?? Number.MAX_SAFE_INTEGER, draft.subtlexRank ?? Number.MAX_SAFE_INTEGER),
    sentenceReadiness: sentenceReadinessFor(draft),
    scores: {
      globalFrequency,
      mainlandFrequency: Math.round(rankScore(draft.tubelexRank, 100) + (draft.hskLevel ? 20 : 0)),
      taiwanFrequency: Math.round(rankScore(draft.tubelexRank, 100) + (draft.tocflLevel ? 20 : 0)),
      spoken: Math.round(spoken),
      written,
      learnerCoverage,
      manualUsefulness: 0
    },
    variants: [primaryVariant],
    sourceMemberships: draft.sourceMemberships.sort((a, b) => a.source.localeCompare(b.source))
  };
}

function categoryFor(draft: ConceptDraft): PanMandarinConcept["category"] {
  if ((draft.tubelexRank ?? Number.MAX_SAFE_INTEGER) <= 3000 && draft.subtlexRank !== undefined && draft.hskLevel && draft.tocflLevel) return "universal-core";
  if (draft.hskLevel && draft.tocflLevel) return "universal-regionally-uneven";
  if (draft.tocflLevel && !draft.hskLevel) return "taiwan-preferred";
  if (draft.hskLevel && !draft.tocflLevel) return "mainland-preferred";
  if ((draft.tubelexRank ?? Number.MAX_SAFE_INTEGER) <= 5000 || (draft.subtlexRank ?? Number.MAX_SAFE_INTEGER) <= 5000) return "colloquial";
  return "low-value-specialist";
}

function sentenceReadinessFor(draft: ConceptDraft): PanMandarinSentenceReadiness {
  const partOfSpeech = inferredPartOfSpeech(draft);
  const grammarRoles = grammarRolesFor(draft.form, partOfSpeech);
  const cleanupNotes: string[] = [];
  const isSingleChar = Array.from(draft.form).length === 1;
  const weakGloss = !draft.gloss || draft.gloss === draft.form || /surname|variant of|Kangxi|radical|classifier|CL:|Buddhist|dynasty|brand/i.test(draft.gloss);

  if (weakGloss) cleanupNotes.push("Gloss needs review before learner-facing use.");
  if (["的", "了", "着", "把", "被"].includes(draft.form)) cleanupNotes.push("High-frequency grammar item; teach inside reviewed frames.");
  if (isSingleChar && partOfSpeech === "unknown") cleanupNotes.push("Single-character item with unknown part of speech.");

  if (["我", "你", "他", "她", "我们", "这个", "这里", "那里", "的", "了", "吗", "不", "没", "没有", "很", "也", "都", "就", "在", "是", "有", "想", "会", "能", "去", "每天"].includes(draft.form)) {
    return {
      sentenceability: "function-frame",
      partOfSpeech,
      grammarRoles: grammarRoles.length > 0 ? grammarRoles : ["function-word"],
      minimumKnownBase: 24,
      cleanupNotes
    };
  }

  if (partOfSpeech === "unknown" && weakGloss) {
    return {
      sentenceability: "blocked",
      partOfSpeech,
      grammarRoles,
      minimumKnownBase: 1000,
      cleanupNotes: [...cleanupNotes, "Insufficient metadata for safe sentence generation."]
    };
  }

  if (partOfSpeech === "unknown" || (isSingleChar && ["particle", "adverb", "conjunction", "measure", "number", "pronoun"].includes(partOfSpeech))) {
    return {
      sentenceability: "needs-companion-word",
      partOfSpeech,
      grammarRoles,
      minimumKnownBase: 300,
      cleanupNotes: [...cleanupNotes, "Needs a companion word or grammar frame for natural input."]
    };
  }

  if (categoryFor(draft) === "low-value-specialist") {
    return {
      sentenceability: "defer",
      partOfSpeech,
      grammarRoles,
      minimumKnownBase: 3000,
      cleanupNotes: [...cleanupNotes, "Low-value specialist item for later review."]
    };
  }

  return {
    sentenceability: "sentence-target",
    partOfSpeech,
    grammarRoles,
    minimumKnownBase: (draft.tubelexRank ?? Number.MAX_SAFE_INTEGER) <= 3000 ? 24 : 300,
    cleanupNotes
  };
}

function inferredPartOfSpeech(draft: ConceptDraft): PanMandarinPartOfSpeech {
  if (draft.partOfSpeech) return draft.partOfSpeech;
  const gloss = (draft.gloss ?? "").toLowerCase();
  if (/^to |to be |to have /.test(gloss)) return "verb";
  if (/^not\b|also|therefore|if|but|already|very|too\b|again|still|only|just\b/.test(gloss)) return "adverb";
  if (/particle|marker/.test(gloss)) return "particle";
  if (/who|what|where|which|why|you|he|she|we|they|oneself|this|that/.test(gloss)) return "pronoun";
  if (/one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million/.test(gloss)) return "number";
  if (/big|small|good|bad|difficult|easy|happy|sad|hot|cold|busy|tired|important|correct|convenient/.test(gloss)) return "adjective";
  if (gloss) return "noun";
  return "unknown";
}

function grammarRolesFor(form: string, partOfSpeech: PanMandarinPartOfSpeech): string[] {
  const roles: string[] = [];
  if (form === "是") roles.push("identity-copula");
  if (form === "有") roles.push("existence-possession");
  if (form === "在") roles.push("location-state");
  if (form === "不") roles.push("present-negation");
  if (form === "没有" || form === "没") roles.push("completion-negation");
  if (form === "吗") roles.push("yes-no-question");
  if (form === "很") roles.push("adjective-link");
  if (form === "了") roles.push("completion-particle");
  if (form === "想") roles.push("desire-modal");
  if (form === "会") roles.push("learned-ability-modal");
  if (form === "能") roles.push("permission-possibility-modal");
  if (form === "去") roles.push("motion-to-location");
  if (form === "每天") roles.push("habitual-time");
  if (form === "都") roles.push("inclusive-adverb");
  if (partOfSpeech === "measure") roles.push("measure-word");
  return roles;
}

function compareConcepts(a: PanMandarinConcept, b: PanMandarinConcept): number {
  return b.scores.globalFrequency - a.scores.globalFrequency
    || b.scores.spoken - a.scores.spoken
    || b.scores.learnerCoverage - a.scores.learnerCoverage
    || a.conceptId.localeCompare(b.conceptId);
}

function compareCommunicationPath(a: PanMandarinConcept, b: PanMandarinConcept): number {
  return readinessRank(a.sentenceReadiness.sentenceability) - readinessRank(b.sentenceReadiness.sentenceability)
    || a.sentenceReadiness.minimumKnownBase - b.sentenceReadiness.minimumKnownBase
    || (a.globalRank ?? Number.MAX_SAFE_INTEGER) - (b.globalRank ?? Number.MAX_SAFE_INTEGER)
    || a.conceptId.localeCompare(b.conceptId);
}

function readinessRank(value: PanMandarinSentenceReadiness["sentenceability"]): number {
  if (value === "function-frame") return 0;
  if (value === "sentence-target") return 1;
  if (value === "needs-companion-word") return 2;
  if (value === "defer") return 3;
  return 4;
}

function rankScore(rank: number | undefined, max: number): number {
  if (rank === undefined) return 0;
  return Math.max(0, max - Math.log2(rank + 1) * 6);
}

function isMandarinWordForm(value: string | undefined): value is string {
  return Boolean(value && value !== "[TOTAL]" && /^[\p{Script=Han}]+$/u.test(value));
}

function numberOrZero(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstVariant(value: string): string {
  return value.split("|")[0]?.trim() ?? "";
}

function conceptIdFor(form: string): string {
  return `cmn-${Array.from(form).map((char) => char.codePointAt(0)?.toString(16)).join("-")}`;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      field += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
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
