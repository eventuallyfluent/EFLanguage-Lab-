import { existsSync } from "node:fs";
import { AcquisitionVocabPath, LexiconEntry, SourceListImportAudit, SourceListImportStatus, VocabSourceFamily } from "../models";
import { blcuFrequencyRanks } from "./blcuFrequency";
import { bookFrequencyRanks } from "./bookFrequency";
import { Hsk30SourceEntry } from "./hsk30Source";
import { movieFrequencyRanks } from "./movieFrequency";

const sourcePaths: Record<VocabSourceFamily, string[]> = {
  HSK_3_0: ["source-lists/hsk30.csv"],
  MOVIE_FREQUENCY: ["source-lists/movie-frequency.csv", "source-lists/movie-frequency.json"],
  BOOK_FREQUENCY: ["source-lists/book-frequency.csv", "source-lists/book-frequency.json"],
  BLCU_FREQUENCY: ["src/data/blcuFrequency.ts"]
};

export function buildSourceListImportAudit(input: {
  hsk30SourceEntries: Hsk30SourceEntry[];
  lexicon: LexiconEntry[];
  acquisitionVocabPath: AcquisitionVocabPath;
}): SourceListImportAudit {
  const sourceLists: SourceListImportStatus[] = [
    statusForHsk(input.hsk30SourceEntries, input.lexicon),
    statusForFixture("MOVIE_FREQUENCY", movieFrequencyRanks, input.lexicon, "Legacy spoken-priority ranks are fixture metadata until the real movie/spoken corpus list is imported. They do not replace pan-Mandarin source ranking."),
    statusForFixture("BOOK_FREQUENCY", bookFrequencyRanks, input.lexicon, "Legacy reading-priority ranks are fixture metadata until the real book/written corpus list is imported. They do not replace pan-Mandarin source ranking."),
    statusForFixture("BLCU_FREQUENCY", blcuFrequencyRanks, input.lexicon, "BLCU/Beijing ranks are supporting metadata, not a beginner permission source.")
  ];

  const warnings = sourceLists
    .filter((status) => status.importMode !== "file" && status.source !== "BLCU_FREQUENCY")
    .map((status) => `${status.source} is not file-backed yet; import the real list before treating its ranks as complete.`);

  if (input.acquisitionVocabPath.currentCandidateCount < 10000) {
    warnings.push("Acquisition vocabulary path has fewer than 10,000 candidates.");
  }

  return {
    targetVocabularyCount: 10000,
    acquisitionPathCandidateCount: input.acquisitionVocabPath.currentCandidateCount,
    sourceLists,
    warnings
  };
}

function statusForHsk(hsk30SourceEntries: Hsk30SourceEntry[], lexicon: LexiconEntry[]): SourceListImportStatus {
  const expectedPaths = sourcePaths.HSK_3_0;
  return {
    source: "HSK_3_0",
    expectedPaths,
    importMode: expectedPaths.some((path) => existsSync(path)) ? "file" : "missing",
    importedEntryCount: hsk30SourceEntries.length,
    rankedLexiconEntryCount: lexicon.filter((entry) => entry.sourceMemberships?.some((membership) => membership.source === "HSK_3_0")).length,
    permissionSource: true,
    notes: "HSK 3.0 is the file-backed learner coverage reference for the legacy HSK-backed path. The pan-Mandarin 10k path is ranked by corpus frequency and communication usefulness."
  };
}

function statusForFixture(source: Exclude<VocabSourceFamily, "HSK_3_0">, ranks: Record<string, number>, lexicon: LexiconEntry[], notes: string): SourceListImportStatus {
  const expectedPaths = sourcePaths[source];
  const fileBacked = expectedPaths.some((path) => existsSync(path));
  return {
    source,
    expectedPaths,
    importMode: fileBacked ? "file" : Object.keys(ranks).length > 0 ? "fixture" : "missing",
    importedEntryCount: Object.keys(ranks).length,
    rankedLexiconEntryCount: lexicon.filter((entry) => entry.sourceMemberships?.some((membership) => membership.source === source)).length,
    permissionSource: false,
    notes
  };
}
