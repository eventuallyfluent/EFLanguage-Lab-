import { existsSync, readFileSync, statSync } from "node:fs";
import { PanMandarinSourceAudit, PanMandarinSourceDefinition, PanMandarinSourceStatus } from "../models";
import { loadHsk30SourceEntries } from "./hsk30Source";
import { loadPanMandarinRawSources } from "./panMandarinVocab";

export const panMandarinSourceRegistry: PanMandarinSourceDefinition[] = [
  {
    id: "TUBELEX_CHINESE",
    label: "TUBELEX Chinese",
    role: "modern-media-frequency",
    rankingWeight: 25,
    expectedPaths: ["source-lists/tubelex-zh.tsv", "source-lists/tubelex-zh.tsv.xz"],
    canonicalUrl: "https://github.com/naist-nlp/tubelex",
    licenseNote: "TUBELEX repository is BSD-3-Clause; verify downloaded frequency file provenance before redistribution.",
    parserStatus: "implemented",
    notes: "Modern YouTube subtitle frequency signal. Use as one strong communication signal, not as the whole ranking."
  },
  {
    id: "SUBTLEX_CH",
    label: "SUBTLEX-CH",
    role: "subtitle-frequency",
    rankingWeight: 10,
    expectedPaths: ["source-lists/subtlex-ch/SUBTLEX-CH-WF", "source-lists/subtlex-ch.zip"],
    canonicalUrl: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0010729",
    licenseNote: "PLOS supplementary file is described as free for research purposes; preserve citation and terms notes.",
    parserStatus: "implemented",
    notes: "Film subtitle frequency. Useful, but should not dominate the pan-Mandarin path by itself."
  },
  {
    id: "SPOKEN_CORPUS",
    label: "Genuine spoken corpus",
    role: "conversation-frequency",
    rankingWeight: 20,
    expectedPaths: ["source-lists/spoken-corpus.csv", "source-lists/spoken-corpus.tsv"],
    licenseNote: "No source selected yet. Only import a corpus with clear permitted local use.",
    parserStatus: "planned",
    notes: "Placeholder for true conversational Mandarin, ideally with regional metadata."
  },
  {
    id: "BALANCED_WRITTEN",
    label: "Balanced written corpus",
    role: "balanced-written-frequency",
    rankingWeight: 20,
    expectedPaths: ["source-lists/balanced-written.csv", "source-lists/balanced-written.tsv", "source-lists/bcc-frequency.csv"],
    licenseNote: "No source selected yet. BCC or equivalent must be checked for accessible frequency-list terms.",
    parserStatus: "planned",
    notes: "Counterweight to subtitle/media bias; useful for broad written frequency."
  },
  {
    id: "HSK_3_0_REFERENCE",
    label: "HSK 3.0 reference",
    role: "learner-coverage-reference",
    rankingWeight: 10,
    expectedPaths: ["source-lists/hsk30.csv"],
    licenseNote: "Existing project source list; used as learner coverage and proficiency reference.",
    parserStatus: "implemented",
    notes: "Coverage reference only. It no longer controls the pan-Mandarin ranking foundation."
  },
  {
    id: "TBCL_TOCFL_REFERENCE",
    label: "TBCL/TOCFL reference",
    role: "learner-coverage-reference",
    rankingWeight: 10,
    expectedPaths: ["source-lists/tbcl.csv", "source-lists/tocfl.csv", "source-lists/tocfl-and-chars.csv"],
    canonicalUrl: "https://github.com/tomcumming/tocfl-word-list",
    licenseNote: "Prefer official TBCL/TOCFL files; derived CSV generator is Unlicense but still preserve source provenance.",
    parserStatus: "implemented",
    notes: "Taiwan learner coverage and regional reference."
  },
  {
    id: "LANCASTER_WRITTEN",
    label: "Lancaster written/academic",
    role: "formal-reading-signal",
    rankingWeight: 0,
    expectedPaths: ["source-lists/lancaster.csv", "source-lists/lancaster.tsv"],
    licenseNote: "No source file selected yet. Treat as later formal-reading metadata.",
    parserStatus: "planned",
    notes: "Academic or formal written signal; not early communication priority."
  },
  {
    id: "MANUAL_USEFULNESS",
    label: "Manual usefulness cleanup",
    role: "manual-quality-gate",
    rankingWeight: 5,
    expectedPaths: ["source-lists/manual-usefulness.json"],
    licenseNote: "Project-authored review metadata.",
    parserStatus: "manual",
    notes: "Quality gate for misleading frequency, fragments, proper nouns, specialist words, and regional pairs."
  }
];

export function buildPanMandarinSourceAudit(generatedAt = new Date().toISOString()): PanMandarinSourceAudit {
  const sourceStatuses = panMandarinSourceRegistry.map(statusForSource);
  const warnings = sourceStatuses.flatMap((status) => {
    if (status.importMode === "missing" && status.rankingWeight > 0) {
      return [`${status.id} is missing; pan-Mandarin ranking cannot be considered complete.`];
    }
    if (status.importMode === "file" && status.parserStatus === "planned") {
      return [`${status.id} file exists but parser is still planned.`];
    }
    return [];
  });

  return {
    target: "pan-mandarin-concept-backed-10k",
    generatedAt,
    sourceStatuses,
    warnings
  };
}

function statusForSource(source: PanMandarinSourceDefinition): PanMandarinSourceStatus {
  const availablePaths = source.expectedPaths.filter((path) => existsSync(path));
  const importedEntryCount = importedCountFor(source, availablePaths);
  const importMode = source.parserStatus === "manual" ? "manual" : availablePaths.length > 0 ? "file" : "missing";
  return {
    ...source,
    importMode,
    availablePaths,
    importedEntryCount
  };
}

function importedCountFor(source: PanMandarinSourceDefinition, availablePaths: string[]): number {
  if (source.id === "HSK_3_0_REFERENCE") return loadHsk30SourceEntries().length;
  if (source.id === "TUBELEX_CHINESE") return loadPanMandarinRawSources().tubelex.length;
  if (source.id === "SUBTLEX_CH") return loadPanMandarinRawSources().subtlex.length;
  if (source.id === "TBCL_TOCFL_REFERENCE") return loadPanMandarinRawSources().tocfl.length;
  const firstTextPath = availablePaths.find((path) => /\.(csv|tsv|txt)$/i.test(path));
  if (!firstTextPath) return availablePaths.some((path) => statSync(path).size > 0) ? 0 : 0;
  return countDataRows(firstTextPath);
}

function countDataRows(path: string): number {
  const text = readFileSync(path, "utf8").trim();
  if (!text) return 0;
  const rows = text.split(/\r?\n/).filter(Boolean);
  if (rows.length === 0) return 0;
  return Math.max(0, rows.length - 1);
}
