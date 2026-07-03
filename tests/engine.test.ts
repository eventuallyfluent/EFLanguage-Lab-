import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { isValidCombination } from "../src/compatibility";
import { curriculumPolicyForTier, curriculumTierPolicies, validateCurriculumPack } from "../src/curriculum";
import type { IslandTag } from "../src/models";
import { curriculumPacks } from "../src/data/curriculumContent";
import { curatedSentences } from "../src/data/curatedSentences";
import { hskSeedLexicon, lexicon, lexiconBuildReport } from "../src/data/lexicon";
import {
  generateAll,
  generateCurriculumPacks,
  generateDialogues,
  generateDraftSentences,
  generateLockedCurriculumPacks,
  generateLockedSentences,
  generateReadings,
  generateSentences,
  generateSentencesForKnownWordCount
} from "../src/generator";
import { progressionTiers, requiredWordCountForSentence, tierForKnownWordCount } from "../src/progression";
import { templates } from "../src/templates";
import { assertNoDuplicates, readingCoverageFor, validateCiPlusOne } from "../src/quality";
import { productPolicy } from "../src/productPolicy";
import { vocabSourceRegistry } from "../src/data/sourceRegistry";
import { assertSequentialCiStream, buildAcquisitionVocabPath, buildSentenceStream, buildSentenceStreamWithReport, buildSrsSupportItems, islandUnlocks } from "../src/pathEngine";
import { loadHsk30SourceEntries } from "../src/data/hsk30Source";
import { buildAuthorableCiCurationQueue, buildCiAuthoringPackets, buildCiCoverageReport, buildCiCurationBatches, buildCiCurationQueue, buildCiPath, buildCiSentenceTargets, buildCompactCiAuthoringPackets, isAcquisitionCiSentence } from "../src/ciEngine";
import { buildSourceListImportAudit } from "../src/data/sourceListAudit";
import { promoteAuthoredCiSentencesToStream, validateAuthoredCiSentences } from "../src/ciAuthoringIntake";
import { buildCiPipelineContract } from "../src/ciPipeline";
import { authoredCiSentences, loadAuthoredCiSentences } from "../src/data/authoredCiSentences";
import { buildPanMandarinSourceAudit, panMandarinSourceRegistry } from "../src/data/panMandarinSources";
import { buildPanMandarinVocab, loadPanMandarinRawSources, panMandarinVocabToCsv } from "../src/data/panMandarinVocab";
import { buildPanMandarinCiCandidates, buildPanMandarinCiCoverageReport, classifyPanMandarinNaturalness } from "../src/data/panMandarinCi";
import { panMandarinGrammarPoints } from "../src/data/panMandarinGrammar";
import { buildPanMandarinContentCoverageReport, buildPanMandarinContentReviewQueue, buildPanMandarinContentReviewReport, buildPanMandarinIslandUnlocks, buildPanMandarinPremadeIslands, buildPanMandarinPremadeStories, buildPanMandarinStoryQueues, buildPanMandarinStoryTopicPlan } from "../src/data/panMandarinContentQueues";
import { buildCurriculumRoadmap, buildDailyShadowSchedule, buildShadowSessionPlan, buildSrsDailyPlan } from "../src/shadowCurriculum";

test("scaled lexicon keeps the 100-word HSK seed and adds ranked HSK expansion", () => {
  assert.equal(hskSeedLexicon.length, 100);
  assert.equal(lexicon.length > hskSeedLexicon.length, true);
  assert.equal(lexicon.length >= 150, true);
  assert.equal(lexicon.every((entry) => entry.source === "HSK"), true);
  assert.equal(lexicon.every((entry) => entry.hskLevel >= 1 && entry.hskLevel <= 3), true);
  assert.equal(lexiconBuildReport.hskBackbone, lexicon.length);
  assert.equal(lexiconBuildReport.movieRanked > 0, true);
  assert.equal(lexiconBuildReport.bookRanked > 0, true);
  assert.equal(lexiconBuildReport.blcuRanked >= 100, true);
  assert.equal(lexiconBuildReport.multiSourceEntries > 0, true);
  assert.deepEqual(lexiconBuildReport.missingMetadata, []);
  assert.equal(lexicon.some((entry) => entry.blcuRank !== undefined && entry.acquisitionTier === "hsk-core-300"), true);
  assert.equal(lexicon.some((entry) => entry.movieRank !== undefined && entry.bookRank !== undefined), true);
});

test("source registry restores HSK, movie, book, and BLCU source families", () => {
  assert.deepEqual(
    vocabSourceRegistry.map((source) => source.id),
    ["HSK_3_0", "MOVIE_FREQUENCY", "BOOK_FREQUENCY", "BLCU_FREQUENCY"]
  );
  assert.equal(vocabSourceRegistry.find((source) => source.id === "HSK_3_0")?.permissionSource, true);
  assert.equal(vocabSourceRegistry.find((source) => source.id === "MOVIE_FREQUENCY")?.role, "spoken-priority");
  assert.equal(vocabSourceRegistry.find((source) => source.id === "BOOK_FREQUENCY")?.role, "reading-priority");
  assert.equal(vocabSourceRegistry.find((source) => source.id === "BLCU_FREQUENCY")?.role, "supporting-rank");
});

test("acquisition vocab path uses movie and book rank signals toward a 10k target", () => {
  const hsk30SourceEntries = loadHsk30SourceEntries();
  const path = buildAcquisitionVocabPath(lexicon, hsk30SourceEntries);
  assert.equal(hsk30SourceEntries.length >= 10000, true);
  assert.equal(path.targetVocabularyCount, 10000);
  assert.equal(path.currentCandidateCount, 10000);
  assert.equal(path.sourceFamilies.includes("MOVIE_FREQUENCY"), true);
  assert.equal(path.sourceFamilies.includes("BOOK_FREQUENCY"), true);
  assert.equal(path.entries.every((entry) => entry.sourceMemberships.some((membership) => membership.source === "HSK_3_0")), true);
  assert.equal(path.entries.some((entry) => entry.movieRank !== undefined), true);
  assert.equal(path.entries.some((entry) => entry.bookRank !== undefined), true);
  assert.equal(new Set(path.entries.map((entry) => entry.vocabularyId)).size, path.entries.length);
  assert.equal(new Set(path.entries.map((entry) => entry.simplified)).size, path.entries.length);
  assert.equal(path.stages.some((stage) => stage.minKnownWords === 10000), true);
  assert.equal(path.stages.find((stage) => stage.id === "adult-3000")?.rankingBias, "book-weighted");
});

test("source-list import audit distinguishes real HSK source from movie and book fixtures", () => {
  const hsk30SourceEntries = loadHsk30SourceEntries();
  const path = buildAcquisitionVocabPath(lexicon, hsk30SourceEntries);
  const audit = buildSourceListImportAudit({ hsk30SourceEntries, lexicon, acquisitionVocabPath: path });
  const bySource = new Map(audit.sourceLists.map((source) => [source.source, source]));
  assert.equal(audit.targetVocabularyCount, 10000);
  assert.equal(audit.acquisitionPathCandidateCount, 10000);
  assert.equal(bySource.get("HSK_3_0")?.importMode, "file");
  assert.equal((bySource.get("HSK_3_0")?.importedEntryCount ?? 0) >= 10000, true);
  assert.equal(bySource.get("MOVIE_FREQUENCY")?.importMode, "fixture");
  assert.equal(bySource.get("BOOK_FREQUENCY")?.importMode, "fixture");
  assert.equal(bySource.get("MOVIE_FREQUENCY")?.permissionSource, false);
  assert.equal(bySource.get("BOOK_FREQUENCY")?.permissionSource, false);
  assert.equal(bySource.get("HSK_3_0")?.notes.includes("legacy HSK-backed path"), true);
  assert.equal(bySource.get("HSK_3_0")?.notes.includes("pan-Mandarin 10k path is ranked by corpus frequency"), true);
  assert.equal(bySource.get("MOVIE_FREQUENCY")?.notes.includes("fixture metadata"), true);
  assert.equal(bySource.get("BOOK_FREQUENCY")?.notes.includes("fixture metadata"), true);
  assert.equal(audit.warnings.some((warning) => warning.includes("MOVIE_FREQUENCY")), true);
  assert.equal(audit.warnings.some((warning) => warning.includes("BOOK_FREQUENCY")), true);
});

test("pan-Mandarin source audit records corpus availability without changing the CI path", () => {
  const audit = buildPanMandarinSourceAudit("2026-07-02T00:00:00.000Z");
  const bySource = new Map(audit.sourceStatuses.map((source) => [source.id, source]));
  assert.equal(audit.target, "pan-mandarin-concept-backed-10k");
  assert.equal(panMandarinSourceRegistry.length >= 8, true);
  assert.equal(bySource.get("HSK_3_0_REFERENCE")?.importMode, "file");
  assert.equal((bySource.get("HSK_3_0_REFERENCE")?.importedEntryCount ?? 0) >= 10000, true);
  assert.equal(bySource.get("TUBELEX_CHINESE")?.role, "modern-media-frequency");
  assert.equal(bySource.get("SUBTLEX_CH")?.role, "subtitle-frequency");
  assert.equal(bySource.get("TBCL_TOCFL_REFERENCE")?.role, "learner-coverage-reference");
  assert.equal(bySource.get("MANUAL_USEFULNESS")?.importMode, "manual");
  assert.equal(bySource.get("HSK_3_0_REFERENCE")?.notes.includes("does not control the pan-Mandarin ranking foundation"), true);
  assert.equal(bySource.get("TBCL_TOCFL_REFERENCE")?.notes.includes("does not control the pan-Mandarin ranking foundation"), true);
  assert.equal(bySource.get("SPOKEN_CORPUS")?.importMode, "missing");
  assert.equal(bySource.get("BALANCED_WRITTEN")?.importMode, "missing");
  assert.equal(audit.warnings.some((warning) => warning.includes("SPOKEN_CORPUS")), true);
  assert.equal(audit.warnings.some((warning) => warning.includes("BALANCED_WRITTEN")), true);
  assert.equal(
    audit.warnings.some((warning) => warning.includes("TUBELEX_CHINESE")),
    bySource.get("TUBELEX_CHINESE")?.importMode === "missing" || bySource.get("TUBELEX_CHINESE")?.parserStatus === "planned"
  );
});

test("pan-Mandarin parsers load file-backed frequency and learner-reference lists", () => {
  const raw = loadPanMandarinRawSources();
  assert.equal(raw.tubelex.length > 10000, true);
  assert.equal(raw.subtlex.length > 10000, true);
  assert.equal(raw.hsk.length >= 10000, true);
  assert.equal(raw.tocfl.length > 100, true);
  assert.deepEqual(raw.tubelex.slice(0, 4).map((entry) => entry.word), ["的", "了", "是", "在"]);
  assert.deepEqual(raw.subtlex.slice(0, 4).map((entry) => entry.word), ["的", "我", "你", "是"]);
  assert.equal(raw.tubelex[0].count > raw.tubelex[1].count, true);
  assert.equal(raw.tubelex[0].videos > 0, true);
  assert.equal(raw.tubelex[0].channels > 0, true);
  assert.equal(raw.subtlex[0].count > raw.subtlex[1].count, true);
  assert.equal(raw.subtlex[0].perMillion > 0, true);
  assert.equal(raw.subtlex[0].contextCount > 0, true);
  assert.equal(raw.hsk[0].simplified.length > 0, true);
  assert.equal(raw.hsk[0].pinyin.length > 0, true);
  assert.equal(raw.tocfl[0].word.length > 0, true);
  assert.equal(raw.tocfl[0].level.length > 0, true);
});

test("pan-Mandarin vocabulary export creates ranked tagged concept entries", () => {
  const vocab = buildPanMandarinVocab();
  assert.equal(vocab.length, 10000);
  assert.equal(vocab.every((entry, index) => entry.globalRank === index + 1), true);
  assert.equal(vocab.every((entry) => Number.isInteger(entry.communicationPathRank)), true);
  assert.equal(vocab.every((entry) => entry.sentenceReadiness.sentenceability.length > 0), true);
  assert.equal(vocab.every((entry) => entry.sentenceReadiness.minimumKnownBase >= 0), true);
  assert.equal(vocab.some((entry) => entry.sourceMemberships.some((membership) => membership.source === "TUBELEX_CHINESE")), true);
  assert.equal(vocab.some((entry) => entry.sourceMemberships.some((membership) => membership.source === "SUBTLEX_CH")), true);
  assert.equal(vocab.some((entry) => entry.sourceMemberships.some((membership) => membership.source === "HSK_3_0_REFERENCE")), true);
  assert.equal(vocab.some((entry) => entry.sourceMemberships.some((membership) => membership.source === "TBCL_TOCFL_REFERENCE")), true);
  assert.equal(vocab.some((entry) => entry.variants.some((variant) => variant.traditional && variant.traditional !== variant.simplified)), true);
  assert.equal(vocab.some((entry) => entry.category === "universal-core"), true);
  assert.equal(panMandarinVocabToCsv(vocab).startsWith("globalRank,conceptId,gloss"), true);
});

test("pan-Mandarin vocabulary ranking is deterministic and keeps representative memberships", () => {
  const first = buildPanMandarinVocab();
  const second = buildPanMandarinVocab();
  const firstPageIds = ["cmn-7684", "cmn-4e86", "cmn-662f", "cmn-4f60", "cmn-6211", "cmn-4ed6", "cmn-5c31", "cmn-4e5f", "cmn-6709", "cmn-6211-4eec"];
  assert.deepEqual(first.slice(0, 10).map((entry) => entry.conceptId), firstPageIds);
  assert.deepEqual(second.slice(0, 10).map((entry) => entry.conceptId), firstPageIds);
  assert.equal(new Set(first.map((entry) => entry.communicationPathRank)).size, first.length);

  const de = first.find((entry) => entry.conceptId === "cmn-7684");
  assert.ok(de);
  assert.deepEqual(
    de.sourceMemberships.map((membership) => membership.source),
    ["HSK_3_0_REFERENCE", "SUBTLEX_CH", "TBCL_TOCFL_REFERENCE", "TUBELEX_CHINESE"]
  );
  assert.equal(de.sentenceReadiness.sentenceability, "function-frame");
  assert.equal(de.variants[0].sourceRefs.includes("TUBELEX_CHINESE"), true);
  assert.equal(de.variants[0].sourceRefs.includes("SUBTLEX_CH"), true);

  const women = first.find((entry) => entry.conceptId === "cmn-6211-4eec");
  assert.ok(women);
  assert.equal(women.variants[0].simplified, "我们");
  assert.equal(women.variants[0].traditional, "我們");
  assert.equal(women.variants[0].pronunciationRegion, "shared");
});

test("pan-Mandarin variants preserve script region and source-reference boundaries", () => {
  const vocab = buildPanMandarinVocab();
  const shared = vocab.find((entry) => entry.conceptId === "cmn-6211-4eec");
  assert.ok(shared);
  assert.equal(shared.variants[0].region, "universal");
  assert.equal(shared.variants[0].simplified, "我们");
  assert.equal(shared.variants[0].traditional, "我們");
  assert.equal(shared.variants[0].sourceRefs.includes("HSK_3_0_REFERENCE"), true);
  assert.equal(shared.variants[0].sourceRefs.includes("TBCL_TOCFL_REFERENCE"), true);
  assert.equal(shared.sourceMemberships.some((membership) => membership.source === "HSK_3_0_REFERENCE" && membership.region === "mainland"), true);
  assert.equal(shared.sourceMemberships.some((membership) => membership.source === "TBCL_TOCFL_REFERENCE" && membership.region === "taiwan"), true);

  const taiwanReference = vocab.find((entry) => entry.conceptId === "cmn-6709-4e9b");
  assert.ok(taiwanReference);
  assert.equal(taiwanReference.category, "taiwan-preferred");
  assert.equal(taiwanReference.variants[0].region, "taiwan");
  assert.equal(taiwanReference.variants[0].pronunciationRegion, "standard-taiwan");
  assert.equal(taiwanReference.variants[0].sourceRefs.includes("TBCL_TOCFL_REFERENCE"), true);
  assert.equal(taiwanReference.sourceMemberships.some((membership) => membership.source === "TBCL_TOCFL_REFERENCE" && membership.region === "taiwan"), true);
});

test("pan-Mandarin CI candidates are review-only and keep bootstrap separate from CI+1", () => {
  const vocab = buildPanMandarinVocab();
  const candidates = buildPanMandarinCiCandidates(vocab);
  const report = buildPanMandarinCiCoverageReport(vocab, candidates);
  assert.equal(candidates.length, 10000);
  assert.equal(report.targetConceptCount, 10000);
  assert.equal(report.targetsWithCandidateOrReason, 10000);
  assert.equal(candidates.every((candidate) => candidate.reviewStatus === "review-only"), true);
  assert.equal(candidates.filter((candidate) => candidate.mode === "ci-plus-one").every((candidate) => candidate.newConceptIds.length === 1), true);
  assert.equal(candidates.filter((candidate) => candidate.mode === "bootstrap").every((candidate) => candidate.newConceptIds.length === 0), true);
  assert.equal(candidates.every((candidate) => candidate.grammarPointIds.length > 0 || candidate.grammarTagStatus === "unclassified"), true);
  assert.equal(report.acceptedReviewCount > 0, true);
  assert.equal(report.needsHumanReviewCount > 0, true);
  assert.equal(report.rejectedCount > 0, true);
});

test("pan-Mandarin grammar tags start with reliable template-backed points", () => {
  assert.equal(panMandarinGrammarPoints.length >= 14, true);
  assert.equal(panMandarinGrammarPoints.some((point) => point.id === "grammar-shi-identity" && point.sourceRefs.includes("template:identity-01")), true);
  assert.equal(panMandarinGrammarPoints.some((point) => point.simplified === "吗"), true);
  assert.equal(new Set(panMandarinGrammarPoints.map((point) => point.id)).size, panMandarinGrammarPoints.length);
});

test("pan-Mandarin naturalness gate rejects known robotic fragments", () => {
  assert.equal(classifyPanMandarinNaturalness("我有。", ["cmn-a", "cmn-b"], "have"), "rejected-robotic");
  assert.equal(classifyPanMandarinNaturalness("是我。", ["cmn-a", "cmn-b"], "is me"), "rejected-robotic");
  assert.equal(classifyPanMandarinNaturalness("我想。", ["cmn-a", "cmn-b"], "want"), "rejected-robotic");
  assert.equal(classifyPanMandarinNaturalness("我想要水。", ["cmn-a", "cmn-b"], "water"), "accepted-review");
});

test("pan-Mandarin language islands and story queues stay gated and review-only", () => {
  const vocab = buildPanMandarinVocab();
  const candidates = buildPanMandarinCiCandidates(vocab);
  const islands = buildPanMandarinIslandUnlocks(vocab, candidates);
  const topicPlans = buildPanMandarinStoryTopicPlan(vocab);
  const stories = buildPanMandarinStoryQueues(islands, candidates, vocab);
  const premadeIslands = buildPanMandarinPremadeIslands(islands, stories, candidates);
  const premadeStories = buildPanMandarinPremadeStories(stories, candidates, vocab);
  const report = buildPanMandarinContentCoverageReport(islands, stories, premadeIslands, premadeStories);
  const reviewQueue = buildPanMandarinContentReviewQueue(premadeIslands, premadeStories);
  const reviewReport = buildPanMandarinContentReviewReport(reviewQueue);
  const expectedUnlocks = [1001, 2001, 3001, 4001, 5001, 6001, 7001, 8001, 9001, 10001];
  const expectedAllowedRanks = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
  const storyUnlocks = premadeStories.map((story) => story.unlockAtWordCount).sort((a, b) => a - b);
  const storyAllowedRanks = premadeStories.map((story) => story.maxAllowedCommunicationPathRank).sort((a, b) => a - b);
  const fillerLines = new Set(["我问你。", "你回答了。", "我知道了。"]);
  const fillerFragments = [...fillerLines];

  assert.equal(topicPlans.length, expectedUnlocks.length);
  assert.deepEqual(topicPlans.map((plan) => plan.unlockAtWordCount), expectedUnlocks);
  assert.deepEqual(topicPlans.map((plan) => plan.maxAllowedCommunicationPathRank), expectedAllowedRanks);
  assert.equal(topicPlans.every((plan) => plan.status === "story-ready" && plan.selectedTopicId), true);
  assert.equal(topicPlans.every((plan) => plan.supportedTopicCandidates.some((candidate) => candidate.id === plan.selectedTopicId && candidate.missingForms.length === 0)), true);
  assert.deepEqual(storyUnlocks, expectedUnlocks);
  assert.deepEqual(storyAllowedRanks, expectedAllowedRanks);
  assert.equal(islands.length, expectedAllowedRanks.length);
  assert.equal(islands.every((island) => island.unlockAtWordCount >= 1000), true);
  assert.equal(islands.filter((island) => island.themeTags.includes("work") || island.themeTags.includes("health")).every((island) => island.unlockAtWordCount >= 2000), true);
  assert.equal(islands.every((island) => island.reviewStatus === "review-only"), true);
  assert.equal(stories.length, expectedUnlocks.length);
  assert.equal(stories.every((story) => story.reviewStatus === "review-only"), true);
  assert.equal(stories.every((story) => story.storyFormat === "dialogue-story" && story.storyType === "dialogue-story"), true);
  assert.equal(stories.every((story) => story.unlockAtWordCount === story.maxAllowedCommunicationPathRank + 1), true);
  assert.equal(stories.every((story) => story.knownCoverageTarget[0] >= 0.95 && story.knownCoverageTarget[1] <= 0.98), true);
  assert.equal(stories.every((story) => story.maxNewConceptsPerLine <= 2), true);
  assert.equal(stories.filter((story) => story.maxAllowedCommunicationPathRank < 3000).every((story) => story.maxNewConceptsPerLine === 1), true);
  assert.equal(premadeIslands.length, islands.length);
  assert.equal(premadeStories.length, stories.length);
  assert.equal(premadeIslands.every((island) => island.reviewStatus === "review-only" && island.sentencePack.length > 0), true);
  assert.equal(premadeIslands.every((island) => island.shortPhrases.length > 0), true);
  assert.equal(premadeIslands.every((island) => island.miniDialogueLines.length > 0), true);
  assert.equal(premadeIslands.every((island) => island.scenarioPrompts.length > 0), true);
  assert.equal(premadeIslands.flatMap((island) => island.sentencePack).every((line) => fillerFragments.every((fragment) => !line.simplified.includes(fragment))), true);
  assert.equal(premadeStories.every((story) => story.reviewStatus === "review-only" && story.lines.length > 0), true);
  assert.equal(premadeStories.every((story) => story.storyFormat === "dialogue-story" && story.turns.length === story.lines.length), true);
  assert.equal(premadeStories.every((story) => new Set(story.turns.map((line) => line.speaker)).size >= 2), true);
  assert.equal(premadeStories.every((story) => story.lines.every((line) => line.source === "dialogue-turn")), true);
  assert.equal(premadeStories.every((story) => story.lines.every((line) => line.maxConceptCommunicationPathRank <= story.maxAllowedCommunicationPathRank)), true);
  assert.equal(premadeStories.flatMap((story) => story.lines).every((line) => !fillerLines.has(line.simplified)), true);
  assert.equal(premadeStories.every((story) => story.lines.every((line) => line.islandTags.length > 0 && line.episodeBeat.length > 0 && line.scenePurpose.length > 0)), true);
  assert.equal(premadeStories.every((story) => story.lines.every((line) => line.overrideConceptIds.length === 0)), true);
  assert.equal(premadeStories.every((story) => story.lines.every((line) => line.overrideConceptIds.length === line.overrideReasons.length)), true);
  assert.equal(premadeStories.every((story) => story.milestoneKnownWordEnd === story.maxAllowedCommunicationPathRank), true);
  assert.equal(premadeStories.filter((story) => story.maxAllowedCommunicationPathRank < 3000).flatMap((story) => story.lines).every((line) => line.newConceptIds.length <= 1), true);
  assert.equal(report.earliestIslandUnlockAtWordCount, 1000);
  assert.equal(report.adultIslandCountBefore2000, 0);
  assert.equal(report.storyQueuesWithCoverageTargets, stories.length);
  assert.equal(report.premadeIslandCount, premadeIslands.length);
  assert.equal(report.premadeStoryCount, premadeStories.length);
  assert.equal(report.milestoneStoryCount, expectedUnlocks.length);
  assert.equal(report.islandPhrasePackCount, expectedAllowedRanks.length);
  assert.equal(report.islandMiniDialogueLineCount > 0, true);
  assert.equal(report.islandScenarioPromptCount > 0, true);
  assert.equal(report.premadeStoryLineCount, premadeStories.reduce((sum, story) => sum + story.lines.length, 0));
  assert.equal(report.storyCoherenceTaggedLineCount, report.premadeStoryLineCount);
  assert.equal(report.overrideLineCount, premadeStories.flatMap((story) => story.lines).filter((line) => line.overrideConceptIds.length > 0).length);
  assert.equal(report.overrideConceptCount, 0);
  assert.equal(reviewReport.queueItemCount, report.premadeStoryLineCount + report.islandPhrasePackCount * 4 + report.islandMiniDialogueLineCount + report.islandScenarioPromptCount);
  assert.equal(reviewReport.storyLineItemCount, report.premadeStoryLineCount);
  assert.equal(reviewReport.islandPhraseItemCount, report.islandPhrasePackCount * 4);
  assert.equal(reviewReport.islandDialogueLineItemCount, report.islandMiniDialogueLineCount);
  assert.equal(reviewReport.islandScenarioPromptItemCount, report.islandScenarioPromptCount);
  assert.equal(reviewReport.needsHumanReviewCount, reviewReport.queueItemCount);
  assert.equal(reviewReport.reviewOnlyItemCount, reviewReport.queueItemCount);
  assert.equal(reviewReport.overrideItemCount, report.overrideLineCount);
  assert.equal(reviewReport.earliestUnlockAtWordCount, 1000);
  assert.equal(reviewReport.latestUnlockAtWordCount, 10001);
  assert.equal(reviewQueue.every((item) => item.reviewStatus === "review-only" && item.reviewDisposition === "needs-human-review"), true);
  assert.equal(reviewQueue.every((item) => fillerFragments.every((fragment) => !item.simplified.includes(fragment))), true);
  assert.equal(reviewQueue.filter((item) => item.itemType === "story-line").every((item) => item.episodeBeat && item.scenePurpose && item.islandTags.length > 0), true);
  assert.equal(reviewQueue.every((item) => item.sourceItemId === item.sourceId && item.sourceItemType.length > 0), true);
  assert.equal(reviewQueue.every((item) => item.maxAllowedCommunicationPathRank > 0 && item.maxAllowedCommunicationPathRank <= 10000), true);
  assert.equal(reviewQueue.every((item) => item.knownCoverageTarget[0] >= 0.95 && item.knownCoverageTarget[1] <= 0.98), true);
  assert.equal(reviewQueue.every((item) => item.suggestedCurationAction.length > 0 && Array.isArray(item.blockingReasons) && item.reviewReasons.length > 0), true);
  assert.equal(reviewQueue.filter((item) => item.itemType === "island-scenario-prompt").every((item) => item.suggestedCurationAction === "convert-scenario-to-controlled-lines" && item.blockingReasons.length > 0), true);
  const learnerFacingSentenceIds = new Set(generateSentencesForKnownWordCount(1000).map((sentence) => sentence.id));
  assert.equal(reviewQueue.every((item) => !learnerFacingSentenceIds.has(item.id) && !learnerFacingSentenceIds.has(item.sourceItemId)), true);
});

test("sentence stream is curated CI material derived from path vocabulary", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const result = buildSentenceStreamWithReport([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const stream = result.stream;
  const known = new Set(lexicon.map((entry) => entry.id));
  assert.equal(stream.length > 0, true);
  assert.equal(stream.every((item) => item.reviewStatus === "curated"), true);
  assert.equal(stream.every((item) => item.newWordIds.length === 1), true);
  assert.equal(stream.every((item) => item.vocabularyIds.every((id) => known.has(id))), true);
  assert.equal(result.report.candidateSentenceCount > stream.length, true);
  assert.equal(result.report.reviewOnlyCount + result.report.blockedCount + result.report.acquisitionItemCount, result.report.candidateSentenceCount);
  assert.equal(result.report.blockedSentences.every((item) => item.disposition === "blocked"), true);
  assert.doesNotThrow(() => assertSequentialCiStream(stream, path));
});

test("CI path is the primary 10k acquisition engine, not easy review", () => {
  const ciPath = buildCiPath();
  assert.equal(ciPath.primaryEngine, true);
  assert.equal(ciPath.targetVocabularyCount, 10000);
  assert.equal(ciPath.sourcePath, "acquisition-vocab-path");
  assert.equal(ciPath.stages.every((stage) => stage.acquisitionMode === "ci-plus-one"), true);
  assert.equal(ciPath.stages.every((stage) => stage.tooEasyPolicy === "review-only"), true);
  assert.equal(ciPath.stages.every((stage) => stage.maxNewItemsPerSentence <= 2), true);
});

test("CI sentence targets cover the 10k list with repeated exposure requirements", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  assert.equal(targets.length, 10000);
  assert.equal(targets.every((target) => target.targetExposureCount >= 5 && target.targetExposureCount <= 15), true);
  assert.equal(targets.every((target) => target.requiredKnownCoverage[0] >= 0.95), true);
  assert.equal(targets.every((target) => target.maxNewItemsPerSentence <= 2), true);
  assert.equal(targets.some((target) => target.status === "needs-curation"), true);
});

test("CI curation queue prioritizes exposure deficits for the next sentence work", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 100);
  assert.equal(queue.length, 100);
  assert.equal(queue.every((item) => item.exposureDeficit > 0), true);
  assert.equal(queue[0].priority, "now");
  assert.equal(queue.every((item, index) => index === 0 || queue[index - 1].wordIndex <= item.wordIndex || queue[index - 1].priority !== item.priority), true);
  assert.equal(queue.find((item) => item.wordIndex === 1)?.authorability, "bootstrap-only");
  assert.equal(queue.find((item) => item.wordIndex === 17)?.authorability, "needs-more-known-vocabulary");
  assert.equal(queue.find((item) => item.wordIndex === 25)?.authorability, "ready");
});

test("authorable CI queue skips early fragment-pressure targets", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 100);
  const authorable = buildAuthorableCiCurationQueue(queue, 100);
  assert.equal(authorable.length > 0, true);
  assert.equal(queue.some((item) => item.authorability !== "ready"), true);
  assert.equal(authorable.every((item) => item.authorability === "ready"), true);
  assert.equal(authorable.every((item) => item.wordIndex >= 25), true);
});

test("CI coverage report tracks stage deficits across the full ladder", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const report = buildCiCoverageReport(targets);
  assert.equal(report.targetVocabularyCount, 10000);
  assert.equal(report.targetCount, 10000);
  assert.equal(report.targetsNeedingCuration > 9000, true);
  assert.equal(report.totalExposureDeficit > 90000, true);
  assert.equal(report.authorabilitySummary.ready.targetCount > 9000, true);
  assert.equal(report.authorabilitySummary.bootstrapOnly.targetCount > 0, true);
  assert.equal(report.authorabilitySummary.needsMoreKnownVocabulary.targetCount > 0, true);
  assert.equal(report.authorabilitySummary.nonAuthorable.targetCount > 0, true);
  assert.equal(report.authorabilitySummary.ready.targetCount + report.authorabilitySummary.nonAuthorable.targetCount, report.targetsNeedingCuration);
  assert.equal(report.authorabilitySummary.ready.totalExposureDeficit + report.authorabilitySummary.nonAuthorable.totalExposureDeficit, report.totalExposureDeficit);
  assert.equal(report.stages.some((stage) => stage.stageId === "ci-0001-0100" && stage.targetCount === 100), true);
});

test("CI curation batches turn the queue into concrete sentence-slot work packets", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 500);
  const authorable = buildAuthorableCiCurationQueue(queue, 500);
  assert.throws(() => buildCiCurationBatches(queue, path), /authorable queue/);
  const batches = buildCiCurationBatches(authorable, path);
  assert.equal(batches.length, 4);
  assert.equal(batches.every((batch) => batch.targetCount === 25), true);
  assert.equal(batches.every((batch) => batch.sentenceSlotCount > 0), true);
  assert.equal(batches.every((batch) => batch.items.every((item) => item.wordIndex >= 25)), true);
  assert.equal(batches.every((batch) => batch.items.every((item) => item.sentenceSlots.every((slot) => slot.requiredNewWordId === item.vocabularyId))), true);
  assert.equal(batches.every((batch) => batch.items.every((item) => item.allowedKnownVocabularyIds.length <= 100)), true);
  assert.equal(batches.every((batch) => batch.items.every((item) => item.sentenceSlots.every((slot) => slot.maxOtherNewItems === 0))), true);
});

test("CI authoring packets enrich curation batches with word metadata and acceptance rules", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 500);
  const authorable = buildAuthorableCiCurationQueue(queue, 500);
  const batches = buildCiCurationBatches(authorable, path);
  const packets = buildCiAuthoringPackets(batches, path);
  assert.equal(packets.length, batches.length);
  assert.equal(packets.every((packet) => packet.purpose === "author-ci-plus-one-sentences"), true);
  assert.equal(packets.every((packet) => packet.globalRules.some((rule) => rule.includes("exactly one required new word"))), true);
  assert.equal(packets.every((packet) => packet.items.every((item) => item.wordIndex >= 25)), true);
  assert.equal(
    packets.reduce((sum, packet) => sum + packet.items.reduce((itemSum, item) => itemSum + item.sentenceSlots.length, 0), 0),
    batches.reduce((sum, batch) => sum + batch.sentenceSlotCount, 0)
  );
  for (const packet of packets) {
    for (const item of packet.items) {
      assert.equal(item.requiredNewWord.vocabularyId, item.vocabularyId);
      assert.equal(item.requiredNewWord.wordIndex, item.wordIndex);
      assert.equal(item.sentenceSlots.every((slot) => slot.requiredNewWord.vocabularyId === item.vocabularyId), true);
      assert.equal(item.sentenceSlots.every((slot) => slot.allowedKnownVocabulary.every((word) => word.wordIndex < item.wordIndex)), true);
      assert.equal(item.sentenceSlots.every((slot) => slot.acceptanceCriteria.some((criteria) => criteria.includes(item.vocabularyId))), true);
      assert.equal(item.sentenceSlots.every((slot) => (slot.allowedKnownVocabulary.length === 0 ? slot.mode === "bootstrap-seed" : slot.mode === "ci-plus-one")), true);
      assert.equal(item.sentenceSlots.every((slot) => (slot.mode === "bootstrap-seed" ? slot.acceptanceCriteria.some((criteria) => criteria.includes("not counted as normal 95% CI+1")) : true)), true);
    }
  }
});

test("compact CI authoring packets preserve slots with a shared vocabulary pool", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 500);
  const authorable = buildAuthorableCiCurationQueue(queue, 500);
  const batches = buildCiCurationBatches(authorable, path);
  const verbosePackets = buildCiAuthoringPackets(batches, path);
  const compactPackets = buildCompactCiAuthoringPackets(batches, path);
  assert.equal(compactPackets.length, verbosePackets.length);
  assert.equal(
    compactPackets.reduce((sum, packet) => sum + packet.items.reduce((itemSum, item) => itemSum + item.sentenceSlots.length, 0), 0),
    verbosePackets.reduce((sum, packet) => sum + packet.items.reduce((itemSum, item) => itemSum + item.sentenceSlots.length, 0), 0)
  );
  for (const packet of compactPackets) {
    const poolIds = new Set(packet.vocabularyPool.map((word) => word.vocabularyId));
    assert.equal(packet.vocabularyPool.length, poolIds.size);
    for (const item of packet.items) {
      assert.equal(poolIds.has(item.vocabularyId), true);
      for (const slot of item.sentenceSlots) {
        assert.equal(slot.requiredNewWordId, item.vocabularyId);
        assert.equal(slot.allowedKnownVocabularyIds.every((id) => poolIds.has(id)), true);
      }
    }
  }
});

test("authored CI intake accepts only slot-valid CI+1 sentences", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 25);
  const authorable = buildAuthorableCiCurationQueue(queue, 25);
  const batches = buildCiCurationBatches(authorable, path, 5, 1);
  const packets = buildCompactCiAuthoringPackets(batches, path);
  const packet = packets[0];
  assert.ok(packet);
  const item = packet.items[0];
  assert.ok(item);
  const slot = item.sentenceSlots[0];
  const requiredWord = packet.vocabularyPool.find((word) => word.vocabularyId === slot.requiredNewWordId);
  assert.ok(requiredWord);

  const valid = {
    id: "authored-valid-001",
    packetId: packet.id,
    sourceBatchId: packet.sourceBatchId,
    slotId: slot.id,
    targetId: item.targetId,
    requiredNewWordId: slot.requiredNewWordId,
    simplified: "我不在",
    pinyin: "wǒ bù zài",
    english: "I am not here.",
    vocabularyIds: ["wo", "you", slot.requiredNewWordId],
    reviewStatus: "authored" as const
  };

  const invalid = {
    ...valid,
    id: "authored-invalid-001",
    requiredNewWordId: "not-the-target",
    vocabularyIds: ["wo", "xiang", "not-the-target"]
  };

  const report = validateAuthoredCiSentences([valid, invalid], packets);
  assert.equal(report.sentenceCount, 2);
  assert.equal(report.acceptedCount, 1);
  assert.equal(report.rejectedCount, 1);
  assert.deepEqual(report.acceptedSentenceIds, [valid.id]);
  assert.deepEqual(report.rejectedSentenceIds, [invalid.id]);
  assert.equal(report.issues.some((issue) => issue.sentenceId === invalid.id && issue.severity === "error"), true);

  const promoted = promoteAuthoredCiSentencesToStream([valid], packets, path);
  assert.equal(promoted.length, 1);
  assert.equal(promoted[0].sentenceId, valid.id);
  assert.deepEqual(promoted[0].newWordIds, [slot.requiredNewWordId]);
  assert.equal(promoted[0].knownVocabularyIds.includes(slot.requiredNewWordId), false);
  assert.doesNotThrow(() => assertSequentialCiStream(promoted, path));
  assert.throws(() => promoteAuthoredCiSentencesToStream([invalid], packets, path), /Cannot promote invalid authored CI sentences/);
});

test("authored CI naturalness gate rejects fragment-like slot-valid lines", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 25);
  const authorable = buildAuthorableCiCurationQueue(queue, 25);
  const batches = buildCiCurationBatches(authorable, path, 5, 1);
  const packets = buildCompactCiAuthoringPackets(batches, path);
  const item = packets[0].items[0];
  assert.ok(item);
  const slot = item.sentenceSlots[0];
  const weak = {
    id: "authored-weak-001",
    packetId: packets[0].id,
    sourceBatchId: packets[0].sourceBatchId,
    slotId: slot.id,
    targetId: item.targetId,
    requiredNewWordId: slot.requiredNewWordId,
    simplified: "我有",
    pinyin: "wǒ yǒu",
    english: "I have some.",
    vocabularyIds: ["wo", "you", slot.requiredNewWordId],
    reviewStatus: "authored" as const
  };
  const report = validateAuthoredCiSentences([weak], packets);
  assert.equal(report.acceptedCount, 0);
  assert.equal(report.rejectedCount, 1);
  assert.equal(report.issues.some((item) => item.message.includes("too short") || item.message.includes("weak fragment")), true);
});

test("authored CI naturalness gate rejects known weak early patterns even when slot-valid", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 25);
  const authorable = buildAuthorableCiCurationQueue(queue, 25);
  const batches = buildCiCurationBatches(authorable, path, 5, 1);
  const packets = buildCompactCiAuthoringPackets(batches, path);
  const packet = packets[0];
  const item = packet.items[0];
  const slot = item.sentenceSlots[0];
  const cases = [
    ["æˆ‘åœ¨", "I am there."],
    ["ä»–æ¥", "He comes."],
    ["ä½ è¯´", "You say it."],
    ["æˆ‘æƒ³", "I want to."]
  ];

  for (const [simplified, english] of cases) {
    const report = validateAuthoredCiSentences([
      {
        id: `authored-weak-${simplified}`,
        packetId: packet.id,
        sourceBatchId: packet.sourceBatchId,
        slotId: slot.id,
        targetId: item.targetId,
        requiredNewWordId: slot.requiredNewWordId,
        simplified,
        pinyin: "slot-valid weak fragment",
        english,
        vocabularyIds: ["wo", "you", slot.requiredNewWordId],
        reviewStatus: "authored" as const
      }
    ], packets);

    assert.equal(report.acceptedCount, 0, simplified);
    assert.equal(report.rejectedCount, 1, simplified);
    assert.equal(report.issues.some((issue) => issue.message.includes("weak fragment") || issue.message.includes("vague")), true, simplified);
  }
});

test("authored CI naturalness gate rejects vague English renderings for otherwise slot-valid lines", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, stream);
  const queue = buildCiCurationQueue(targets, 25);
  const authorable = buildAuthorableCiCurationQueue(queue, 25);
  const batches = buildCiCurationBatches(authorable, path, 5, 1);
  const packets = buildCompactCiAuthoringPackets(batches, path);
  const packet = packets[0];
  const item = packet.items[0];
  const slot = item.sentenceSlots[0];
  const vague = {
    id: "authored-vague-001",
    packetId: packet.id,
    sourceBatchId: packet.sourceBatchId,
    slotId: slot.id,
    targetId: item.targetId,
    requiredNewWordId: slot.requiredNewWordId,
    simplified: "æˆ‘æœ‰é’±",
    pinyin: "wÇ’ yÇ’u qiÃ¡n",
    english: "I have some.",
    vocabularyIds: ["wo", "you", slot.requiredNewWordId],
    reviewStatus: "authored" as const
  };

  const report = validateAuthoredCiSentences([vague], packets);
  assert.equal(report.acceptedCount, 0);
  assert.equal(report.rejectedCount, 1);
  assert.equal(report.issues.some((issue) => issue.message.includes("vague") || issue.message.includes("fragment-like")), true);
  assert.throws(() => promoteAuthoredCiSentencesToStream([vague], packets, path), /Cannot promote invalid authored CI sentences/);
});

test("authored CI sentence intake is file-backed and schema checked", () => {
  const loaded = loadAuthoredCiSentences("source-lists/authored-ci-sentences.json");
  assert.deepEqual(loaded, authoredCiSentences);
  assert.equal(Array.isArray(loaded), true);
  assert.throws(() => loadAuthoredCiSentences("source-lists/hsk30.csv"), /Unexpected token|must contain a JSON array/);
});

test("CI pipeline contract clarifies each engine step in order", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const streamResult = buildSentenceStreamWithReport([...generateSentencesForKnownWordCount(1000), ...generateLockedSentences()], path);
  const targets = buildCiSentenceTargets(path, streamResult.stream);
  const queue = buildCiCurationQueue(targets, 500);
  const authorable = buildAuthorableCiCurationQueue(queue, 500);
  const batches = buildCiCurationBatches(authorable, path);
  const compactPackets = buildCompactCiAuthoringPackets(batches, path);
  const coverage = buildCiCoverageReport(targets);
  const srs = buildSrsSupportItems(streamResult.stream);
  const contract = buildCiPipelineContract({
    sourceListImportAudit: buildSourceListImportAudit({ hsk30SourceEntries: loadHsk30SourceEntries(), lexicon, acquisitionVocabPath: path }),
    acquisitionVocabPath: path,
    ciSentenceTargets: targets,
    ciCurationQueue: queue,
    authorableCiCurationQueue: authorable,
    ciCurationBatches: batches,
    compactCiAuthoringPackets: compactPackets,
    authoredCiValidationReport: {
      sentenceCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      issues: [],
      acceptedSentenceIds: [],
      rejectedSentenceIds: []
    },
    sentenceStream: streamResult.stream,
    sentenceStreamBuildReport: streamResult.report,
    ciCoverageReport: coverage,
    srsSupport: srs
  });

  assert.equal(contract.productGoal, "10k-source-backed-ci-plus-one-path");
  assert.equal(contract.primaryEngine, "ci-plus-one-sentence-stream");
  assert.equal(contract.srsRole, "support-retention-only");
  assert.deepEqual(contract.steps.map((step) => step.id), [
    "source-ingest",
    "acquisition-path",
    "ci-targets",
    "curation-queue",
    "authoring-packets",
    "authored-intake",
    "sentence-stream",
    "support-surfaces"
  ]);
  assert.equal(contract.steps.every((step, index) => step.order === index + 1), true);
  assert.equal(contract.steps.find((step) => step.id === "acquisition-path")?.currentCount, 10000);
  assert.equal(contract.steps.find((step) => step.id === "ci-targets")?.gate.includes("authorability-aware deficit reporting"), true);
  assert.equal(contract.steps.find((step) => step.id === "curation-queue")?.gate.includes("authorable queue keeps only ready items"), true);
  assert.equal(contract.steps.find((step) => step.id === "authoring-packets")?.inputs.includes("output/ci-authorable-curation-queue.json"), true);
  assert.equal(contract.steps.find((step) => step.id === "authoring-packets")?.gate.includes("ready authorable queue item"), true);
  assert.equal(contract.steps.find((step) => step.id === "authoring-packets")?.outputs.includes("output/ci-authoring-packets.compact.json"), true);
  assert.equal(contract.steps.find((step) => step.id === "authored-intake")?.outputs.includes("output/authored-ci-validation-report.json"), true);
  assert.equal(contract.steps.find((step) => step.id === "authored-intake")?.outputs.includes("output/promoted-authored-ci-stream.json"), true);
  assert.equal(contract.steps.find((step) => step.id === "sentence-stream")?.outputs.includes("output/blocked-ci-sentences.json"), true);
});

test("known-only sentence lines are not counted as acquisition CI", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream(generateSentencesForKnownWordCount(1000), path);
  assert.equal(stream.every(isAcquisitionCiSentence), true);
  assert.equal(isAcquisitionCiSentence({ ...stream[0], newWordIds: [] }), false);
});

test("language islands do not unlock before the practical and adult thresholds", () => {
  assert.equal(islandUnlocks.length >= 4, true);
  assert.equal(islandUnlocks.every((island) => island.unlockAtWordCount >= 1000), true);
  assert.equal(islandUnlocks.filter((island) => island.themeTags.includes("work") || island.themeTags.includes("health")).every((island) => island.unlockAtWordCount >= 2000), true);
});

test("SRS support is derived only after CI sentence stream exposure", () => {
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const stream = buildSentenceStream(generateSentencesForKnownWordCount(1000), path);
  const srsSupport = buildSrsSupportItems(stream);
  const streamIds = new Set(stream.map((item) => item.id));
  assert.equal(srsSupport.length, stream.length);
  assert.equal(srsSupport.every((item) => streamIds.has(item.sentenceStreamItemId)), true);
  assert.equal(srsSupport.every((item) => item.introducedAfterCi === true), true);
  assert.equal(srsSupport.every((item) => item.role === "support-retention"), true);
});

test("static 10k shadow curriculum creates a 1000-day rolling review path", () => {
  const vocab = buildPanMandarinVocab();
  const candidates = buildPanMandarinCiCandidates(vocab);
  const schedule = buildDailyShadowSchedule(candidates);
  const sessionPlan = buildShadowSessionPlan();
  const srsPlan = buildSrsDailyPlan(schedule);
  const path = buildAcquisitionVocabPath(lexicon, loadHsk30SourceEntries());
  const islands = buildPanMandarinIslandUnlocks(vocab, candidates);
  const stories = buildPanMandarinStoryQueues(islands, candidates, vocab);
  const premadeStories = buildPanMandarinPremadeStories(stories, candidates, vocab);
  const roadmap = buildCurriculumRoadmap(path, schedule, premadeStories, islands);
  const itemIds = new Set(schedule.items.map((item) => item.id));

  assert.equal(schedule.targetItemCount, 10000);
  assert.equal(schedule.newItemsPerDay, 10);
  assert.equal(schedule.totalDays, 1000);
  assert.equal(schedule.defaultCompletionYears, 2.7);
  assert.equal(schedule.items.length, 10000);
  assert.equal(schedule.days.length, 1000);
  assert.equal(schedule.days.every((day) => day.newCount === 10), true);
  assert.equal(schedule.items.every((item) => item.sequenceInCourse === item.targetCommunicationPathRank), true);
  assert.deepEqual(schedule.days[0].reviewDayNumbers, []);
  assert.deepEqual(schedule.days[0].sessionItemIds, schedule.days[0].newItemIds);
  assert.deepEqual(schedule.days[4].reviewDayNumbers, [1, 2, 3, 4]);
  assert.equal(schedule.days[4].sessionCount, 50);
  assert.deepEqual(schedule.days[5].reviewDayNumbers, [2, 3, 4, 5]);
  assert.equal(schedule.days[5].sessionCount, 50);
  assert.equal(schedule.days[5].sessionItemIds.some((id) => schedule.days[0].newItemIds.includes(id)), false);
  assert.equal(schedule.days.every((day) => day.sessionItemIds.every((id) => itemIds.has(id))), true);
  assert.equal(sessionPlan.autoAdvance, true);
  assert.equal(sessionPlan.audioMode, "browser-tts-fallback");
  assert.equal(sessionPlan.displayFields.includes("simplified"), true);
  assert.equal(srsPlan.days.length, 1000);
  assert.equal(srsPlan.days.every((day) => day.maxNewCards === 10 && day.introducedOnlyFromSeenShadowItems), true);
  assert.equal(srsPlan.days.every((day) => day.newCardItemIds.every((id) => itemIds.has(id))), true);
  assert.equal(srsPlan.vacationMode.pausesDuePressure, true);
  assert.equal(srsPlan.vacationMode.preservesCardState, true);
  assert.deepEqual(roadmap.stages.map((stage) => stage.id), path.stages.map((stage) => stage.id));
  assert.equal(roadmap.storyUnlocks.length, premadeStories.length);
  assert.equal(roadmap.islandUnlocks.length, islands.length);
  assert.equal(roadmap.honestPromise.includes("2.7 years"), true);
});

test("templates define required slots and constraints", () => {
  assert.equal(templates.length >= 30, true);
  for (const template of templates) {
    assert.ok(template.id);
    assert.ok(template.zhPattern);
    assert.equal(template.slots.length > 0, true);
    assert.equal(template.constraints.length > 0, true);
  }
});

test("learner-facing sentence generation is curated-only and pack-backed", () => {
  const sentences = generateSentences();
  assert.equal(sentences.every((sentence) => (sentence.unlockAtWordCount ?? 100) <= lexicon.length), true);
  assert.equal(sentences.every((sentence) => sentence.reviewStatus === "curated"), true);
  assert.equal(sentences.every((sentence) => sentence.qualityScore === 100), true);
  assert.equal(sentences.every((sentence) => sentence.packId !== undefined), true);
  assert.equal(sentences.every((sentence) => sentence.tierId === "100-tier"), true);
  assertNoDuplicates(sentences, (sentence) => sentence.simplified);
});

test("full generation keeps learner-facing, locked, draft, and review-only content separate", () => {
  const result = generateAll("output");
  const activeSentenceIds = new Set(result.sentences.map((sentence) => sentence.id));
  const activePackSentenceIds = new Set(result.curriculumPacks.flatMap((pack) => pack.sentences.map((sentence) => sentence.id)));
  const lockedSentenceIds = new Set(result.lockedSentences.map((sentence) => sentence.id));
  const draftSentenceIds = new Set(result.draftSentences.map((sentence) => sentence.id));
  const reviewOnlySentenceIds = new Set(result.sentenceStreamBuildReport.reviewOnlySentences.map((sentence) => sentence.sentenceId));
  const sentenceStreamSourceIds = new Set(result.sentenceStream.map((sentence) => sentence.sentenceId));

  assert.equal(result.sentences.length > 0, true);
  assert.equal(result.sentences.every((sentence) => sentence.reviewStatus === "curated"), true);
  assert.equal(result.sentences.every((sentence) => sentence.packId !== undefined && sentence.tierId !== undefined), true);
  assert.equal(result.sentences.every((sentence) => activePackSentenceIds.has(sentence.id)), true);
  assert.equal(result.curriculumPacks.every((pack) => pack.unlockAtWordCount <= lexicon.length), true);
  assert.equal(result.curriculumPacks.every((pack) => pack.sentences.every((sentence) => sentence.reviewStatus === "curated")), true);

  assert.equal(result.lockedPacks.length > 0, true);
  assert.equal(result.lockedPacks.every((pack) => pack.unlockAtWordCount > lexicon.length), true);
  assert.equal(result.lockedPacks.every((pack) => pack.sentences.every((sentence) => sentence.reviewStatus === "curated")), true);
  assert.equal([...lockedSentenceIds].some((id) => activeSentenceIds.has(id)), false);

  assert.equal(result.draftSentences.length, 200);
  assert.equal(result.draftSentences.every((sentence) => sentence.reviewStatus === "draft"), true);
  assert.equal(result.draftSentences.every((sentence) => sentence.sourceNote?.includes("not learner-facing")), true);
  assert.equal([...draftSentenceIds].some((id) => activeSentenceIds.has(id) || activePackSentenceIds.has(id)), false);

  assert.equal(result.sentenceStreamBuildReport.reviewOnlySentences.every((sentence) => sentence.disposition === "review-only"), true);
  assert.equal([...reviewOnlySentenceIds].some((id) => sentenceStreamSourceIds.has(id) || draftSentenceIds.has(id)), false);
});

test("curriculum content contract distinguishes active, locked, draft, review-only, and support surfaces", () => {
  const result = generateAll("output");
  const contract = result.curriculumContentContract;
  const surfaces = new Map(contract.surfaces.map((surface) => [surface.id, surface]));

  assert.equal(contract.id, "curriculum-content-contract-v1");
  assert.equal(contract.primaryLearnerFacingSurface, "curriculum-packs");
  assert.equal(contract.learnerFacingPolicy, "curated-only");
  assert.equal(contract.draftPolicy, "not-learner-facing");
  assert.equal(contract.reviewOnlyPolicy, "human-curation-required");
  assert.equal(surfaces.get("sentences")?.role, "learner-facing");
  assert.equal(surfaces.get("sentences")?.itemCount, result.sentences.length);
  assert.deepEqual(surfaces.get("sentences")?.allowedReviewStatuses, ["curated"]);
  assert.equal(surfaces.get("locked-packs")?.role, "locked-future");
  assert.equal(surfaces.get("locked-packs")?.itemCount, result.lockedPacks.length);
  assert.equal(surfaces.get("draft-sentences")?.role, "draft-review");
  assert.deepEqual(surfaces.get("draft-sentences")?.allowedReviewStatuses, ["draft"]);
  assert.equal(surfaces.get("review-only-sentences")?.role, "review-only");
  assert.equal(surfaces.get("pan-mandarin-content-review-queue")?.itemCount, result.panMandarinContentReviewQueue.length);
  assert.equal(surfaces.get("srs-support")?.role, "support");
  assert.equal(contract.surfaces.every((surface) => surface.outputPath.startsWith("output/") && surface.publicDataPath?.startsWith("public/data/")), true);
  assert.equal(existsSync("output/curriculum-content-contract.json"), true);
  assert.equal(existsSync("public/data/curriculum-content-contract.json"), true);
});

test("learner-facing sentences only reference lexicon vocabulary", () => {
  const known = new Set(lexicon.map((entry) => entry.id));
  for (const sentence of generateSentences()) {
    assert.equal(sentence.vocabularyIds.every((id) => known.has(id)), true, sentence.english);
  }
});

test("curated sentence bank remains lexicon-controlled and progression-tagged", () => {
  const known = new Set(lexicon.map((entry) => entry.id));
  assert.equal(curatedSentences.length >= 50, true);
  assert.equal(curatedSentences.every((sentence) => sentence.reviewStatus === "curated"), true);
  assert.equal(curatedSentences.some((sentence) => sentence.progressionLevel === 4), true);
  for (const sentence of curatedSentences) {
    assert.equal(sentence.vocabularyIds.every((id) => known.has(id)), true, sentence.english);
    assert.equal(sentence.qualityScore, 100);
    assert.equal(requiredWordCountForSentence(sentence), sentence.unlockAtWordCount);
  }
});

test("curriculum packs validate cleanly and stay staged by unlock threshold", () => {
  const known = new Set(lexicon.map((entry) => entry.id));
  assert.equal(curriculumPacks.length, 15);
  for (const pack of curriculumPacks) {
    assert.deepEqual(validateCurriculumPack(pack, known), [], pack.id);
  }

  const currentPacks = generateCurriculumPacks();
  const lockedPacks = generateLockedCurriculumPacks();
  assert.equal(currentPacks.length, 8);
  assert.equal(lockedPacks.length, 7);
  assert.equal(currentPacks.every((pack) => pack.tierId === "100-tier"), true);
  assert.equal(lockedPacks.every((pack) => pack.unlockAtWordCount > lexicon.length), true);
  assert.equal(generateLockedSentences().every((sentence) => (sentence.unlockAtWordCount ?? 0) > lexicon.length), true);
});

test("curriculum validation rejects weak CI reading math", () => {
  const known = new Set(lexicon.map((entry) => entry.id));
  const basePack = curriculumPacks[0];
  const baseReading = basePack.readings[0];
  const firstLine = baseReading.sentences[0];

  const badCoveragePack = {
    ...basePack,
    id: "test-bad-reading-coverage",
    readings: [{ ...baseReading, id: "test-reading-low-coverage", knownVocabularyCoverage: 0.9 }]
  };
  assert.deepEqual(validateCurriculumPack(badCoveragePack, known).filter((issue) => issue.includes("invalid CI+1 coverage")), ["Reading test-reading-low-coverage has invalid CI+1 coverage"]);

  const tooManyNewWordsPack = {
    ...basePack,
    id: "test-too-many-new-words",
    readings: [
      {
        ...baseReading,
        id: "test-reading-too-many-new",
        sentences: [{ ...firstLine, newWordIds: ["wo", "ni", "hao"] }, ...baseReading.sentences.slice(1)]
      }
    ]
  };
  assert.equal(validateCurriculumPack(tooManyNewWordsPack, known).some((issue) => issue.includes("too many new words")), true);

  const zeroNewWordPack = {
    ...basePack,
    id: "test-zero-new-word-reading",
    readings: [
      {
        ...baseReading,
        id: "test-reading-zero-new",
        ciPlusOneValid: true,
        sentences: baseReading.sentences.map((sentence) => ({ ...sentence, newWordIds: [] }))
      }
    ]
  };
  assert.equal(validateCurriculumPack(zeroNewWordPack, known).some((issue) => issue.includes("no controlled new word")), true);
});

test("curriculum validation rejects early adult themes even when pack tags are benign", () => {
  const known = new Set(lexicon.map((entry) => entry.id));
  const basePack = generateCurriculumPacks(300).find((pack) => pack.tierId === "300-tier");
  assert.ok(basePack);

  const hiddenWorkSentencePack = {
    ...basePack,
    id: "test-hidden-work-sentence",
    themeTags: ["daily-life", "time"] as IslandTag[],
    sentences: [{ ...basePack.sentences[0], id: "test-work-line", themeTags: ["work"] as IslandTag[] }]
  };
  assert.equal(validateCurriculumPack(hiddenWorkSentencePack, known).some((issue) => issue.includes("Forbidden sentence theme work")), true);

  const hiddenHealthReadingPack = {
    ...basePack,
    id: "test-hidden-health-reading",
    themeTags: ["daily-life", "time"] as IslandTag[],
    readings: [{ ...basePack.readings[0], id: "test-health-reading", islandTags: ["health"] as IslandTag[] }]
  };
  assert.equal(validateCurriculumPack(hiddenHealthReadingPack, known).some((issue) => issue.includes("Forbidden reading theme health")), true);
});

test("draft sentence generation remains review material only", () => {
  const activeSentenceIds = new Set(generateSentences().map((sentence) => sentence.id));
  const draftSentences = generateDraftSentences();

  assert.equal(draftSentences.length, 200);
  assert.equal(draftSentences.every((sentence) => sentence.reviewStatus === "draft"), true);
  assert.equal(draftSentences.every((sentence) => sentence.packId === undefined && sentence.tierId === undefined), true);
  assert.equal(draftSentences.every((sentence) => sentence.sourceNote?.includes("not learner-facing")), true);
  assert.equal(draftSentences.some((sentence) => activeSentenceIds.has(sentence.id)), false);
});

test("progression policy prevents adult themes before the right known-word tier", () => {
  assert.equal(progressionTiers[0].minKnownWords, 100);
  assert.equal(tierForKnownWordCount(157).id, "seed-100");
  assert.equal(tierForKnownWordCount(2000).id, "adult-2000");

  const packsAt300 = generateCurriculumPacks(300);
  const packsAt1000 = generateCurriculumPacks(1000);
  const sentencesAt300 = generateSentencesForKnownWordCount(300);
  const sentencesAt1000 = generateSentencesForKnownWordCount(1000);

  assert.equal(packsAt300.some((pack) => pack.tierId === "300-tier"), true);
  assert.equal(packsAt300.some((pack) => pack.themeTags.includes("work")), false);
  assert.equal(packsAt300.some((pack) => pack.themeTags.includes("health")), false);
  assert.equal(packsAt1000.some((pack) => pack.tierId === "1000-tier"), true);
  assert.equal(packsAt1000.some((pack) => pack.themeTags.includes("work")), false);
  assert.equal(packsAt1000.some((pack) => pack.themeTags.includes("health")), false);
  assert.equal(sentencesAt300.some((sentence) => sentence.themeTags?.includes("shopping")), true);
  assert.equal(sentencesAt300.some((sentence) => sentence.themeTags?.includes("work")), false);
  assert.equal(sentencesAt1000.some((sentence) => sentence.themeTags?.includes("transport")), true);
  assert.equal(sentencesAt1000.some((sentence) => sentence.themeTags?.includes("health")), false);
});

test("product policy keeps the 10k CI+1 sentence journey primary", () => {
  assert.equal(productPolicy.targetVocabularyCount, 10000);
  assert.equal(productPolicy.primaryAcquisitionMode, "ci-plus-one-sentence-stream");
  assert.equal(productPolicy.repetitionStyle, "glossika-style");
  assert.equal(productPolicy.srsRole, "support-retention");
  assert.equal(productPolicy.productSurfaces.find((surface) => surface.id === "sentence-stream")?.role, "primary-acquisition");
  assert.equal(productPolicy.productSurfaces.find((surface) => surface.id === "srs")?.role, "support-retention");
  assert.equal(productPolicy.journeyMilestones.some((milestone) => milestone.knownWordCount === 10000), true);
  assert.equal(productPolicy.nonGoals.includes("quiz-first learning loop"), true);
});

test("article unlocks require vocabulary coverage and stay gated by word count", () => {
  assert.equal(productPolicy.articleUnlocks.length >= 4, true);
  assert.equal(productPolicy.articleUnlocks.every((unlock) => unlock.minKnownWords >= 300), true);
  assert.equal(productPolicy.articleUnlocks.every((unlock) => unlock.minKnownVocabularyCoverage >= 0.95), true);
  assert.equal(productPolicy.articleUnlocks.every((unlock) => unlock.maxNewWordsPerSentence <= 2), true);
  assert.equal(productPolicy.articleUnlocks.some((unlock) => unlock.minKnownWords === 1000), true);
  assert.equal(productPolicy.articleUnlocks.some((unlock) => unlock.allowedComplexity === "multi-clause" && unlock.minKnownWords >= 3000), true);
});

test("tier policies match conservative curriculum constraints", () => {
  assert.equal(curriculumTierPolicies.length, 5);
  assert.equal(curriculumPolicyForTier("100-tier").forbiddenThemes.includes("work"), true);
  assert.equal(curriculumPolicyForTier("300-tier").forbiddenThemes.includes("health"), true);
  assert.equal(curriculumPolicyForTier("1000-tier").forbiddenThemes.includes("health"), true);
});

test("dialogue and reading counts now come from unlocked lesson packs", () => {
  assert.equal(generateDialogues().length, 8);
  assert.equal(generateReadings().length, 8);
});

test("reading passages meet known-vocabulary and CI+1 requirements", () => {
  const readings = generateReadings();
  for (const reading of readings) {
    assert.equal(reading.knownVocabularyCoverage >= 0.95, true, reading.id);
    assert.equal(reading.knownVocabularyCoverage <= 0.98, true, reading.id);
    assert.equal(reading.ciPlusOneValid, true, reading.id);
    assert.equal(validateCiPlusOne(reading.sentences), true, reading.id);
    assert.equal(readingCoverageFor(reading.sentences), reading.knownVocabularyCoverage);
    assert.equal(reading.sentences.every((sentence) => sentence.newWordIds.length <= 2), true, reading.id);
  }
});

test("lesson packs stay within tier structure and use known vocabulary", () => {
  const known = new Set(lexicon.map((entry) => entry.id));
  for (const pack of curriculumPacks) {
    assert.equal(pack.dialogues.length >= 1 && pack.dialogues.length <= 2, true, pack.id);
    assert.equal(pack.readings.length, 1, pack.id);
    assert.equal(pack.sentences.length >= 3, true, pack.id);
    assert.equal(pack.sentences.every((sentence) => sentence.vocabularyIds.every((id) => known.has(id))), true, pack.id);
    assert.equal(
      pack.dialogues.every((dialogue) => dialogue.turns.every((turn) => turn.vocabularyIds.every((id) => known.has(id)))),
      true,
      pack.id
    );
    assert.equal(
      pack.readings.every((reading) =>
        reading.sentences.every((sentence) => sentence.vocabularyIds.every((id) => known.has(id)) && sentence.newWordIds.every((id) => known.has(id)))
      ),
      true,
      pack.id
    );
  }
});

test("semantic compatibility rejects invalid combinations", () => {
  assert.equal(isValidCombination("verb-object", "kan", "shu"), true);
  assert.equal(isValidCombination("verb-object", "kan", "dianhua"), false);
  assert.equal(isValidCombination("verb-object", "kan", "dianying"), true);
  assert.equal(isValidCombination("verb-object", "he", "kafei"), true);
  assert.equal(isValidCombination("adjective-noun", "tianqi", "re"), true);
  assert.equal(isValidCombination("adjective-noun", "tianqi", "da_adj"), false);
  assert.equal(isValidCombination("subject-predicate", "wo", "lei"), true);
  assert.equal(isValidCombination("subject-predicate", "wo", "duo"), false);
});

test("English output is curated English, not word-by-word glosses", () => {
  const sentences = generateSentences();
  assert.ok(sentences.some((sentence) => sentence.english === "I am a teacher."));
  assert.ok(sentences.some((sentence) => sentence.english === "Have you eaten?"));
  assert.equal(sentences.some((sentence) => /I; me|he; him|to eat meal; rice/.test(sentence.english)), false);
});

test("final learner-facing output excludes known low-quality Mandarin", () => {
  const sentences = generateSentences();
  const text = sentences.map((sentence) => sentence.simplified).join("\n");
  assert.doesNotMatch(text, /天气很大|我很多|我会看电话|看电话|做工作|去家/);
});
