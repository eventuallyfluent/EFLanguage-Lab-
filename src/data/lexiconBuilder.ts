import { FrequencyPriority, LexiconEntry, SourceTag, VocabSourceAudit, VocabSourceMembership } from "../models";

export interface LexiconBuildReport extends VocabSourceAudit {
  total: number;
}

export interface BuiltLexicon {
  entries: LexiconEntry[];
  report: LexiconBuildReport;
}

export interface SourceRankInputs {
  blcuRanks: Record<string, number>;
  movieRanks: Record<string, number>;
  bookRanks: Record<string, number>;
}

export function buildLexicon(entries: LexiconEntry[], sourceRanks: SourceRankInputs): BuiltLexicon {
  const seen = new Set<string>();
  const missingMetadata: string[] = [];
  const normalized = entries
    .map((entry) => {
      if (seen.has(entry.id)) throw new Error(`Duplicate lexicon id: ${entry.id}`);
      seen.add(entry.id);
      if (!entry.simplified || !entry.pinyin || !entry.english || entry.islandTags.length === 0) {
        missingMetadata.push(entry.id);
      }
      const blcuRank = sourceRanks.blcuRanks[entry.simplified];
      const movieRank = sourceRanks.movieRanks[entry.id];
      const bookRank = sourceRanks.bookRanks[entry.id];
      const source: SourceTag = entry.source === "BLCU" ? "BLCU" : "HSK";
      const sourceMemberships = membershipsFor(source, blcuRank, movieRank, bookRank);
      const acquisitionScore = scoreFor(entry, blcuRank, movieRank, bookRank);
      return {
        ...entry,
        source,
        sourceMemberships,
        blcuRank,
        movieRank,
        bookRank,
        acquisitionScore,
        acquisitionTier: entry.acquisitionTier ?? (entries.indexOf(entry) < 100 ? "seed-100" : "hsk-core-300"),
        frequencyPriority: entry.frequencyPriority ?? priorityFromScore(acquisitionScore)
      };
    })
    .sort((a, b) => {
      const tierWeight = tierSort(a.acquisitionTier) - tierSort(b.acquisitionTier);
      if (tierWeight !== 0) return tierWeight;
      if (a.hskLevel !== b.hskLevel) return a.hskLevel - b.hskLevel;
      return (b.acquisitionScore ?? 0) - (a.acquisitionScore ?? 0);
    });

  const sourceCoverage = {
    HSK_3_0: normalized.filter((entry) => entry.sourceMemberships?.some((membership) => membership.source === "HSK_3_0")).length,
    MOVIE_FREQUENCY: normalized.filter((entry) => entry.movieRank !== undefined).length,
    BOOK_FREQUENCY: normalized.filter((entry) => entry.bookRank !== undefined).length,
    BLCU_FREQUENCY: normalized.filter((entry) => entry.blcuRank !== undefined).length
  };

  return {
    entries: normalized,
    report: {
      total: normalized.length,
      totalEntries: normalized.length,
      sourceCoverage,
      hskBackbone: normalized.filter((entry) => entry.source === "HSK").length,
      movieRanked: normalized.filter((entry) => entry.movieRank !== undefined).length,
      bookRanked: normalized.filter((entry) => entry.bookRank !== undefined).length,
      blcuRanked: normalized.filter((entry) => entry.blcuRank !== undefined).length,
      multiSourceEntries: normalized.filter((entry) => (entry.sourceMemberships?.length ?? 0) > 1).length,
      missingMovieRank: normalized.filter((entry) => entry.movieRank === undefined).map((entry) => entry.id),
      missingBookRank: normalized.filter((entry) => entry.bookRank === undefined).map((entry) => entry.id),
      missingBlcuRank: normalized.filter((entry) => entry.blcuRank === undefined).map((entry) => entry.id),
      missingMetadata
    }
  };
}

function membershipsFor(source: SourceTag, blcuRank: number | undefined, movieRank: number | undefined, bookRank: number | undefined): VocabSourceMembership[] {
  const memberships: VocabSourceMembership[] = [];
  if (source === "HSK") memberships.push({ source: "HSK_3_0", permissionSource: true });
  if (movieRank !== undefined) memberships.push({ source: "MOVIE_FREQUENCY", rank: movieRank, permissionSource: false });
  if (bookRank !== undefined) memberships.push({ source: "BOOK_FREQUENCY", rank: bookRank, permissionSource: false });
  if (blcuRank !== undefined) memberships.push({ source: "BLCU_FREQUENCY", rank: blcuRank, permissionSource: false });
  return memberships;
}

function scoreFor(entry: LexiconEntry, blcuRank: number | undefined, movieRank: number | undefined, bookRank: number | undefined): number {
  const hskScore = Math.max(0, 120 - entry.hskLevel * 12);
  const movieScore = rankScore(movieRank, 85);
  const bookScore = rankScore(bookRank, 70);
  const blcuScore = rankScore(blcuRank, 55);
  const usefulnessScore = usefulnessFor(entry);
  return Number((hskScore + movieScore + bookScore + blcuScore + usefulnessScore).toFixed(2));
}

function rankScore(rank: number | undefined, max: number): number {
  if (rank === undefined) return 0;
  return Math.max(0, max - Math.log2(rank + 1) * 8);
}

function usefulnessFor(entry: LexiconEntry): number {
  if (entry.partOfSpeech === "verb" || entry.partOfSpeech === "pronoun" || entry.partOfSpeech === "time") return 18;
  if (entry.partOfSpeech === "noun") return 12;
  if (entry.partOfSpeech === "adjective" || entry.partOfSpeech === "adverb") return 8;
  return 4;
}

function priorityFromScore(score: number | undefined): FrequencyPriority {
  if (score === undefined) return "low";
  if (score >= 190) return "high";
  if (score >= 130) return "medium";
  return "low";
}

function tierSort(tier: LexiconEntry["acquisitionTier"]): number {
  if (tier === "seed-100") return 0;
  if (tier === "hsk-core-300") return 1;
  return 2;
}
