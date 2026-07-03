import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compatibleAdjectivesForNoun, compatibleObjectsForVerb, isValidCombination } from "./compatibility";
import { curriculumPacks } from "./data/curriculumContent";
import { curatedSentences } from "./data/curatedSentences";
import { authoredCiSentences } from "./data/authoredCiSentences";
import { lexicon, lexiconBuildReport } from "./data/lexicon";
import { flattenPackSentences, validateCurriculumPack } from "./curriculum";
import { article, enAdjective, enNoun, enSubject, enTime, enVerb } from "./english";
import {
  CurriculumPack,
  CurriculumContentContract,
  Dialogue,
  DialogueTurn,
  GeneratedSentence,
  AuthoredCiSentence,
  LexiconEntry,
  ReadingPassage,
  ReadingSentence,
  SentenceTemplate
} from "./models";
import { templates } from "./templates";
import { difficultyFor, readingCoverageFor, sentenceSignature, validateCiPlusOne } from "./quality";
import { isSentenceUnlocked, progressionTiers } from "./progression";
import { productPolicy } from "./productPolicy";
import { vocabSourceRegistry } from "./data/sourceRegistry";
import { assertSequentialCiStream, buildAcquisitionVocabPath, buildArticleUnlocks, buildSentenceStreamWithReport, buildSrsSupportItems, islandUnlocks } from "./pathEngine";
import { loadHsk30SourceEntries } from "./data/hsk30Source";
import { buildAuthorableCiCurationQueue, buildCiAuthoringPackets, buildCiCoverageReport, buildCiCurationBatches, buildCiCurationQueue, buildCiPath, buildCiSentenceTargets, buildCompactCiAuthoringPackets } from "./ciEngine";
import { buildSourceListImportAudit } from "./data/sourceListAudit";
import { buildCiPipelineContract } from "./ciPipeline";
import { promoteAuthoredCiSentencesToStream, validateAuthoredCiSentences } from "./ciAuthoringIntake";
import { buildPanMandarinSourceAudit } from "./data/panMandarinSources";
import { buildPanMandarinVocab, panMandarinVocabToCsv } from "./data/panMandarinVocab";
import { buildPanMandarinCiCandidates, buildPanMandarinCiCoverageReport } from "./data/panMandarinCi";
import { panMandarinGrammarPoints } from "./data/panMandarinGrammar";
import { buildPanMandarinContentCoverageReport, buildPanMandarinContentReviewQueue, buildPanMandarinContentReviewReport, buildPanMandarinIslandUnlocks, buildPanMandarinPremadeIslands, buildPanMandarinPremadeStories, buildPanMandarinStoryQueues, buildPanMandarinStoryTopicPlan } from "./data/panMandarinContentQueues";
import { buildCurriculumRoadmap, buildDailyShadowSchedule, buildShadowSessionPlan, buildSrsDailyPlan } from "./shadowCurriculum";

const byId = new Map(lexicon.map((entry) => [entry.id, entry]));

const subjects = ids("wo", "ni", "ta_he", "ta_she", "women");
const times = ids("jin_tian", "zuo_tian", "ming_tian", "mei_tian", "xianzai", "zaoshang", "wanshang", "xianzai2");
const locations = ids("jia", "xuexiao", "gongsi", "fandian", "yiyuan", "shangdian", "jichang", "chezhan", "fangjian");
const goLocations = ids("xuexiao", "gongsi", "fandian", "yiyuan", "shangdian", "jichang", "chezhan");
const identityNouns = ids("laoshi", "xuesheng");
const preferenceObjects = ids("zhongwen", "hanyu", "shu", "shui", "cha", "kafei", "fan", "mianbao", "shuiguo", "cai", "pengyou", "dianying", "dianshi");

const noObjectVerbIds = ["gongzuo_v", "shuijiao", "qichuang", "xiuxi", "yundong", "shangban", "xiaban", "zou"];
const abilityVerbIds = new Set(["ting", "shuo", "xue", "du", "xie"]);
const completedVerbIds = new Set(["chi", "he", "kan", "ting", "xue", "du", "xie", "mai_buy", "zuo", "da", "bang"]);
const highUseTemplateIds = new Set(["action-01", "time-01", "time-03", "preference-01", "question-01", "description-01", "location-01", "location-02"]);

interface VerbObjectPair {
  verb: LexiconEntry;
  object?: LexiconEntry;
}

interface BuiltSentence {
  template: SentenceTemplate;
  simplified: string;
  pinyin: string;
  english: string;
  vocabulary: LexiconEntry[];
  qualityScore: number;
  variations: string[];
}

export function generateAll(outputDir = "output") {
  const activePacks = generateCurriculumPacks();
  const lockedPacks = generateLockedCurriculumPacks();
  const sentences = flattenPackSentences(activePacks);
  const lockedSentences = flattenPackSentences(lockedPacks);
  const draftSentences = generateDraftSentences(200);
  const dialogues = activePacks.flatMap((pack) => pack.dialogues);
  const readings = activePacks.flatMap((pack) => pack.readings);
  const hsk30SourceEntries = loadHsk30SourceEntries();
  const acquisitionVocabPath = buildAcquisitionVocabPath(lexicon, hsk30SourceEntries);
  const allCuratedSentences = flattenPackSentences([...activePacks, ...lockedPacks]);
  const sentenceStreamResult = buildSentenceStreamWithReport(allCuratedSentences, acquisitionVocabPath);
  const curatedSentenceStream = sentenceStreamResult.stream;
  const sentenceStreamBuildReport = sentenceStreamResult.report;
  const sourceListImportAudit = buildSourceListImportAudit({ hsk30SourceEntries, lexicon, acquisitionVocabPath });
  const panMandarinSourceAudit = buildPanMandarinSourceAudit();
  const panMandarinVocab = buildPanMandarinVocab();
  const panMandarinCiCandidates = buildPanMandarinCiCandidates(panMandarinVocab);
  const panMandarinCiCoverageReport = buildPanMandarinCiCoverageReport(panMandarinVocab, panMandarinCiCandidates);
  const panMandarinIslandUnlocks = buildPanMandarinIslandUnlocks(panMandarinVocab, panMandarinCiCandidates);
  const panMandarinStoryTopicPlan = buildPanMandarinStoryTopicPlan(panMandarinVocab);
  const panMandarinStoryQueues = buildPanMandarinStoryQueues(panMandarinIslandUnlocks, panMandarinCiCandidates, panMandarinVocab);
  const panMandarinPremadeIslands = buildPanMandarinPremadeIslands(panMandarinIslandUnlocks, panMandarinStoryQueues, panMandarinCiCandidates);
  const panMandarinPremadeStories = buildPanMandarinPremadeStories(panMandarinStoryQueues, panMandarinCiCandidates, panMandarinVocab);
  const panMandarinContentCoverageReport = buildPanMandarinContentCoverageReport(panMandarinIslandUnlocks, panMandarinStoryQueues, panMandarinPremadeIslands, panMandarinPremadeStories);
  const panMandarinContentReviewQueue = buildPanMandarinContentReviewQueue(panMandarinPremadeIslands, panMandarinPremadeStories);
  const panMandarinContentReviewReport = buildPanMandarinContentReviewReport(panMandarinContentReviewQueue);
  const dailyShadowSchedule = buildDailyShadowSchedule(panMandarinCiCandidates);
  const shadowSessionPlan = buildShadowSessionPlan();
  const srsDailyPlan = buildSrsDailyPlan(dailyShadowSchedule);
  const curriculumRoadmap = buildCurriculumRoadmap(acquisitionVocabPath, dailyShadowSchedule, panMandarinPremadeStories, panMandarinIslandUnlocks);
  const ciPath = buildCiPath();
  const initialCiSentenceTargets = buildCiSentenceTargets(acquisitionVocabPath, curatedSentenceStream);
  const initialCiCurationQueue = buildCiCurationQueue(initialCiSentenceTargets);
  const initialAuthorableCiCurationQueue = buildAuthorableCiCurationQueue(initialCiCurationQueue);
  const initialCiCurationBatches = buildCiCurationBatches(initialAuthorableCiCurationQueue, acquisitionVocabPath);
  const compactCiAuthoringPackets = buildCompactCiAuthoringPackets(initialCiCurationBatches, acquisitionVocabPath);
  const authoredCiValidationReport = validateAuthoredCiSentences(authoredCiSentences, compactCiAuthoringPackets);
  const promotedAuthoredCiStream = promoteAuthoredCiSentencesToStream(authoredCiSentences.filter((sentence) => authoredCiValidationReport.acceptedSentenceIds.includes(sentence.id)), compactCiAuthoringPackets, acquisitionVocabPath);
  const sentenceStream = [...curatedSentenceStream, ...promotedAuthoredCiStream].sort((a, b) => a.knownWordThreshold - b.knownWordThreshold || a.id.localeCompare(b.id));
  assertSequentialCiStream(sentenceStream, acquisitionVocabPath);
  const ciSentenceTargets = buildCiSentenceTargets(acquisitionVocabPath, sentenceStream);
  const ciCurationQueue = buildCiCurationQueue(ciSentenceTargets);
  const authorableCiCurationQueue = buildAuthorableCiCurationQueue(ciCurationQueue);
  const ciCurationBatches = buildCiCurationBatches(authorableCiCurationQueue, acquisitionVocabPath);
  const ciAuthoringPackets = buildCiAuthoringPackets(ciCurationBatches, acquisitionVocabPath);
  const finalCompactCiAuthoringPackets = buildCompactCiAuthoringPackets(ciCurationBatches, acquisitionVocabPath);
  const ciCoverageReport = buildCiCoverageReport(ciSentenceTargets);
  const srsSupport = buildSrsSupportItems(sentenceStream);
  const articleUnlocks = buildArticleUnlocks();
  const ciPipelineContract = buildCiPipelineContract({
    sourceListImportAudit,
    acquisitionVocabPath,
    ciSentenceTargets,
    ciCurationQueue,
    authorableCiCurationQueue,
    ciCurationBatches,
    compactCiAuthoringPackets: finalCompactCiAuthoringPackets,
    authoredCiValidationReport,
    sentenceStream,
    sentenceStreamBuildReport,
    ciCoverageReport,
    srsSupport
  });
  const curriculumContentContract = buildCurriculumContentContract({
    sentences,
    lockedSentences,
    draftSentences,
    curriculumPacks: activePacks,
    lockedPacks,
    readings,
    sentenceStream,
    reviewOnlySentences: sentenceStreamBuildReport.reviewOnlySentences,
    panMandarinContentReviewQueue,
    srsSupport
  });

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "sentences.json"), JSON.stringify(sentences, null, 2), "utf8");
  writeFileSync(join(outputDir, "locked-sentences.json"), JSON.stringify(lockedSentences, null, 2), "utf8");
  writeFileSync(join(outputDir, "curriculum-packs.json"), JSON.stringify(activePacks, null, 2), "utf8");
  writeFileSync(join(outputDir, "locked-packs.json"), JSON.stringify(lockedPacks, null, 2), "utf8");
  writeFileSync(join(outputDir, "draft-sentences.json"), JSON.stringify(draftSentences, null, 2), "utf8");
  writeFileSync(join(outputDir, "dialogues.json"), JSON.stringify(dialogues, null, 2), "utf8");
  writeFileSync(join(outputDir, "readings.json"), JSON.stringify(readings, null, 2), "utf8");
  writeFileSync(join(outputDir, "lexicon.json"), JSON.stringify(lexicon, null, 2), "utf8");
  writeFileSync(join(outputDir, "lexicon-build-report.json"), JSON.stringify(lexiconBuildReport, null, 2), "utf8");
  writeFileSync(join(outputDir, "progression-policy.json"), JSON.stringify(progressionTiers, null, 2), "utf8");
  writeFileSync(join(outputDir, "product-policy.json"), JSON.stringify(productPolicy, null, 2), "utf8");
  writeFileSync(join(outputDir, "source-registry.json"), JSON.stringify(vocabSourceRegistry, null, 2), "utf8");
  writeFileSync(join(outputDir, "vocab-source-audit.json"), JSON.stringify(lexiconBuildReport, null, 2), "utf8");
  writeFileSync(join(outputDir, "source-list-import-audit.json"), JSON.stringify(sourceListImportAudit, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-source-audit.json"), JSON.stringify(panMandarinSourceAudit, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-vocab.json"), JSON.stringify(panMandarinVocab, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-vocab.csv"), panMandarinVocabToCsv(panMandarinVocab), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-ci-candidates.json"), JSON.stringify(panMandarinCiCandidates, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-ci-coverage-report.json"), JSON.stringify(panMandarinCiCoverageReport, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-grammar-tags.json"), JSON.stringify(panMandarinGrammarPoints, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-island-unlocks.json"), JSON.stringify(panMandarinIslandUnlocks, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-story-topic-plan.json"), JSON.stringify(panMandarinStoryTopicPlan, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-story-queues.json"), JSON.stringify(panMandarinStoryQueues, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-premade-islands.json"), JSON.stringify(panMandarinPremadeIslands, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-premade-stories.json"), JSON.stringify(panMandarinPremadeStories, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-content-coverage-report.json"), JSON.stringify(panMandarinContentCoverageReport, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-content-review-queue.json"), JSON.stringify(panMandarinContentReviewQueue, null, 2), "utf8");
  writeFileSync(join(outputDir, "pan-mandarin-content-review-report.json"), JSON.stringify(panMandarinContentReviewReport, null, 2), "utf8");
  writeFileSync(join(outputDir, "daily-shadow-schedule.json"), JSON.stringify(dailyShadowSchedule, null, 2), "utf8");
  writeFileSync(join(outputDir, "shadow-session-plan.json"), JSON.stringify(shadowSessionPlan, null, 2), "utf8");
  writeFileSync(join(outputDir, "srs-daily-plan.json"), JSON.stringify(srsDailyPlan, null, 2), "utf8");
  writeFileSync(join(outputDir, "curriculum-roadmap.json"), JSON.stringify(curriculumRoadmap, null, 2), "utf8");
  writeFileSync(join(outputDir, "acquisition-vocab-path.json"), JSON.stringify(acquisitionVocabPath, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-path.json"), JSON.stringify(ciPath, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-sentence-targets.json"), JSON.stringify(ciSentenceTargets, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-curation-queue.json"), JSON.stringify(ciCurationQueue, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-authorable-curation-queue.json"), JSON.stringify(authorableCiCurationQueue, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-curation-batches.json"), JSON.stringify(ciCurationBatches, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-authoring-packets.json"), JSON.stringify(ciAuthoringPackets, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-authoring-packets.compact.json"), JSON.stringify(finalCompactCiAuthoringPackets, null, 2), "utf8");
  writeFileSync(join(outputDir, "authored-ci-sentences.json"), JSON.stringify(authoredCiSentences, null, 2), "utf8");
  writeFileSync(join(outputDir, "authored-ci-validation-report.json"), JSON.stringify(authoredCiValidationReport, null, 2), "utf8");
  writeFileSync(join(outputDir, "promoted-authored-ci-stream.json"), JSON.stringify(promotedAuthoredCiStream, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-pipeline-contract.json"), JSON.stringify(ciPipelineContract, null, 2), "utf8");
  writeFileSync(join(outputDir, "curriculum-content-contract.json"), JSON.stringify(curriculumContentContract, null, 2), "utf8");
  writeFileSync(join(outputDir, "ci-coverage-report.json"), JSON.stringify(ciCoverageReport, null, 2), "utf8");
  writeFileSync(join(outputDir, "sentence-stream.json"), JSON.stringify(sentenceStream, null, 2), "utf8");
  writeFileSync(join(outputDir, "sentence-stream-build-report.json"), JSON.stringify(sentenceStreamBuildReport, null, 2), "utf8");
  writeFileSync(join(outputDir, "review-only-sentences.json"), JSON.stringify(sentenceStreamBuildReport.reviewOnlySentences, null, 2), "utf8");
  writeFileSync(join(outputDir, "blocked-ci-sentences.json"), JSON.stringify(sentenceStreamBuildReport.blockedSentences, null, 2), "utf8");
  writeFileSync(join(outputDir, "island-unlocks.json"), JSON.stringify(islandUnlocks, null, 2), "utf8");
  writeFileSync(join(outputDir, "article-unlocks.json"), JSON.stringify(articleUnlocks, null, 2), "utf8");
  writeFileSync(join(outputDir, "srs-support.json"), JSON.stringify(srsSupport, null, 2), "utf8");
  if (outputDir === "output") {
    writeWebData({ sentences, lockedSentences, draftSentences, dialogues, readings, curriculumPacks: activePacks, lockedPacks, acquisitionVocabPath, sourceListImportAudit, panMandarinSourceAudit, panMandarinVocab, panMandarinCiCandidates, panMandarinCiCoverageReport, panMandarinIslandUnlocks, panMandarinStoryTopicPlan, panMandarinStoryQueues, panMandarinPremadeIslands, panMandarinPremadeStories, panMandarinContentCoverageReport, panMandarinContentReviewQueue, panMandarinContentReviewReport, dailyShadowSchedule, shadowSessionPlan, srsDailyPlan, curriculumRoadmap, ciPath, ciSentenceTargets, ciCurationQueue, authorableCiCurationQueue, ciCurationBatches, ciAuthoringPackets, compactCiAuthoringPackets: finalCompactCiAuthoringPackets, authoredCiSentences, authoredCiValidationReport, promotedAuthoredCiStream, ciPipelineContract, curriculumContentContract, ciCoverageReport, sentenceStream, sentenceStreamBuildReport, srsSupport, articleUnlocks });
  }

  return { sentences, lockedSentences, draftSentences, dialogues, readings, curriculumPacks: activePacks, lockedPacks, acquisitionVocabPath, sourceListImportAudit, panMandarinSourceAudit, panMandarinVocab, panMandarinCiCandidates, panMandarinCiCoverageReport, panMandarinIslandUnlocks, panMandarinStoryTopicPlan, panMandarinStoryQueues, panMandarinPremadeIslands, panMandarinPremadeStories, panMandarinContentCoverageReport, panMandarinContentReviewQueue, panMandarinContentReviewReport, dailyShadowSchedule, shadowSessionPlan, srsDailyPlan, curriculumRoadmap, ciPath, ciSentenceTargets, ciCurationQueue, authorableCiCurationQueue, ciCurationBatches, ciAuthoringPackets, compactCiAuthoringPackets: finalCompactCiAuthoringPackets, authoredCiSentences, authoredCiValidationReport, promotedAuthoredCiStream, ciPipelineContract, curriculumContentContract, ciCoverageReport, sentenceStream, sentenceStreamBuildReport, srsSupport, articleUnlocks };
}

export function generateSentences(targetCount = curatedSentences.length): GeneratedSentence[] {
  return generateSentencesForKnownWordCount(lexicon.length, targetCount);
}

export function generateSentencesForKnownWordCount(knownWordCount: number, targetCount = curatedSentences.length): GeneratedSentence[] {
  return flattenPackSentences(generateCurriculumPacks(knownWordCount)).slice(0, targetCount);
}

export function generateLockedSentences(): GeneratedSentence[] {
  return flattenPackSentences(generateLockedCurriculumPacks());
}

export function generateCurriculumPacks(knownWordCount = lexicon.length): CurriculumPack[] {
  validateAllCurriculumPacks();
  return curriculumPacks.filter((pack) => pack.unlockAtWordCount <= knownWordCount);
}

export function generateLockedCurriculumPacks(knownWordCount = lexicon.length): CurriculumPack[] {
  validateAllCurriculumPacks();
  return curriculumPacks.filter((pack) => pack.unlockAtWordCount > knownWordCount);
}

export function generateDraftSentences(targetCount = 200): GeneratedSentence[] {
  const candidateGroups = templates.map((template) => buildCandidatesForTemplate(template));
  const candidates: BuiltSentence[] = [];
  const maxGroupLength = Math.max(...candidateGroups.map((group) => group.length));

  for (let index = 0; index < maxGroupLength; index += 1) {
    for (const group of candidateGroups) {
      const candidate = group[index];
      if (candidate) candidates.push(candidate);
    }
  }

  const seenText = new Set<string>();
  const seenSignatures = new Set<string>();
  const accepted = candidates
    .filter((candidate) => {
      if (!candidate.simplified || candidate.qualityScore < 72) return false;
      if (!isValidSentence(candidate)) return false;
      const signature = sentenceSignature(candidate.simplified);
      if (seenText.has(candidate.simplified) || seenSignatures.has(signature)) return false;
      seenText.add(candidate.simplified);
      seenSignatures.add(signature);
      return true;
    })
    .slice(0, targetCount);

  return accepted.map((candidate, index) => ({
    id: `sent-${String(index + 1).padStart(3, "0")}`,
    templateId: candidate.template.id,
    simplified: candidate.simplified,
    pinyin: candidate.pinyin,
    english: candidate.english,
    vocabularyIds: uniqueIds(candidate.vocabulary),
    difficulty: difficultyFor(candidate.vocabulary),
    qualityScore: candidate.qualityScore,
    reviewStatus: "draft",
    sourceNote: "Template-generated candidate; not learner-facing until curated or validated",
    variations: candidate.variations
  }));
}

export function generateDialogues(): Dialogue[] {
  return generateCurriculumPacks().flatMap((pack) => pack.dialogues);
}

export function generateReadings(): ReadingPassage[] {
  const readings = generateCurriculumPacks().flatMap((pack) => pack.readings);
  for (const reading of readings) {
    if (!reading.ciPlusOneValid) {
      throw new Error(`Reading failed CI+1 validation: ${reading.id}`);
    }
  }
  return readings;
}

function buildCandidatesForTemplate(template: SentenceTemplate): BuiltSentence[] {
  const out: BuiltSentence[] = [];
  const pairs = verbObjectPairs();

  switch (template.id) {
    case "identity-01":
      for (const subject of subjects) for (const noun of identityNouns) out.push(identitySentence(template, subject, noun));
      break;
    case "identity-02":
      for (const [subject, noun] of [[by("ta_he"), by("baba")], [by("ta_she"), by("mama")], [by("wo"), by("xuesheng")], [by("ni"), by("laoshi")]] as [LexiconEntry, LexiconEntry][]) out.push(identitySentence(template, subject, noun));
      break;
    case "identity-03":
      for (const subject of subjects) for (const noun of ids("shu", "diannao", "dianhua", "pengyou")) out.push(possessionSentence(template, subject, noun));
      break;
    case "time-03":
      for (const time of ids("jin_tian", "xianzai", "zaoshang", "wanshang")) for (const subject of subjects) for (const location of locations) out.push(locationSentence(template, subject, location, time, "at"));
      break;
    case "preference-01":
    case "preference-02":
    case "question-02":
      for (const subject of subjectOrderFor(template.id)) for (const object of preferenceObjects) out.push(preferenceSentence(template, subject, object));
      break;
    case "ability-03":
    case "location-01":
    case "location-02":
    case "location-03":
    case "location-04":
      for (const subject of subjects) for (const location of template.id === "location-01" ? locations : goLocations) out.push(locationSentence(template, subject, location));
      break;
    case "question-03":
      for (const subject of subjects) out.push(sentence(template, [subject, by("zai"), by("nali")], `${subject.simplified}在哪里`, `${subject.pinyin} zài nǎ lǐ`, `${whereQuestion(subject.id)}?`, 88, ["question", "location"]));
      break;
    case "question-04":
      for (const subject of subjects.slice(1, 4)) out.push(sentence(template, [subject, by("shi"), by("shei")], `${subject.simplified}是谁`, `${subject.pinyin} shì shéi`, `${whoQuestion(subject.id)}?`, 82, ["question", "identity"]));
      break;
    case "description-01":
      for (const subject of subjects) for (const adjective of ids("hao", "mang", "lei", "gao")) {
        if (isValidCombination("subject-predicate", subject, adjective)) out.push(subjectDescriptionSentence(template, subject, adjective, false));
      }
      break;
    case "description-02":
    case "description-03":
      for (const noun of ids("tianqi", "xuexiao", "gongsi", "shu", "fan", "shui", "cha", "qian", "che")) {
        for (const adjectiveId of compatibleAdjectivesForNoun(noun.id)) {
          const adjective = by(adjectiveId);
          out.push(nounDescriptionSentence(template, noun, adjective));
        }
      }
      break;
    default:
      for (const subject of subjectOrderFor(template.id)) for (const pair of pairs) {
        if (template.category === "ability" && !abilityVerbIds.has(pair.verb.id)) continue;
        if (template.category === "completion" && !completedVerbIds.has(pair.verb.id)) continue;
        out.push(verbObjectSentence(template, subject, pair));
      }
  }

  return out;
}

function verbObjectPairs(): VerbObjectPair[] {
  const out: VerbObjectPair[] = [];
  for (const verb of ids("chi", "he", "kan", "ting", "shuo", "xue", "du", "xie", "mai_buy", "zuo", "da", "deng", "bang", "ai", "hui_return", "zhu", "kai", "zuo_sit")) {
    for (const objectId of compatibleObjectsForVerb(verb.id)) out.push({ verb, object: by(objectId) });
  }
  for (const verbId of noObjectVerbIds) out.push({ verb: by(verbId) });
  return out;
}

function subjectOrderFor(templateId: string): LexiconEntry[] {
  if (templateId === "question-01" || templateId === "question-02") return ids("ni", "ta_he", "ta_she", "wo", "women");
  return subjects;
}

function identitySentence(template: SentenceTemplate, subject: LexiconEntry, noun: LexiconEntry): BuiltSentence {
  return sentence(template, [subject, by("shi"), noun], `${subject.simplified}是${noun.simplified}`, `${subject.pinyin} shì ${noun.pinyin}`, `${capitalize(enSubject(subject.id))} ${beVerb(subject.id)} ${article(enNoun(noun.id))}.`, 84, ["identity"]);
}

function possessionSentence(template: SentenceTemplate, subject: LexiconEntry, noun: LexiconEntry): BuiltSentence {
  return sentence(template, [subject, by("de"), noun], `${subject.simplified}的${noun.simplified}`, `${subject.pinyin} de ${noun.pinyin}`, `${possessive(subject.id)} ${enNoun(noun.id)}.`, 76, ["possession"]);
}

function preferenceSentence(template: SentenceTemplate, subject: LexiconEntry, object: LexiconEntry): BuiltSentence {
  const neg = template.id === "preference-02";
  const question = template.id === "question-02";
  const zh = `${subject.simplified}${neg ? "不" : ""}喜欢${object.simplified}${question ? "吗" : ""}`;
  const py = `${subject.pinyin} ${neg ? "bù " : ""}xǐ huan ${object.pinyin}${question ? " ma" : ""}`;
  const en = question
    ? `${questionAux(subject.id)} ${enSubject(subject.id)} like ${enNoun(object.id)}?`
    : `${capitalize(enSubject(subject.id))} ${neg ? negativeLike(subject.id) : likeVerb(subject.id)} ${enNoun(object.id)}.`;
  return sentence(template, [subject, by("xihuan"), object, ...(neg ? [by("bu")] : []), ...(question ? [by("ma")] : [])], zh, py, en, question ? 88 : 86, [question ? "question" : "preference", ...(neg ? ["negation"] : [])]);
}

function locationSentence(template: SentenceTemplate, subject: LexiconEntry, location: LexiconEntry, forcedTime?: LexiconEntry, mode?: "at"): BuiltSentence {
  const time = forcedTime ?? times[(subject.id.length + location.id.length) % times.length];
  if (template.id === "ability-03") return sentence(template, [subject, by("neng"), by("qu"), location], `${subject.simplified}能去${location.simplified}`, `${subject.pinyin} néng qù ${location.pinyin}`, `${capitalize(enSubject(subject.id))} can go to ${place(location.id)}.`, 78, ["ability", "location"]);
  if (template.id === "location-01") return sentence(template, [subject, by("zai"), location], `${subject.simplified}在${location.simplified}`, `${subject.pinyin} zài ${location.pinyin}`, `${capitalize(enSubject(subject.id))} ${beVerb(subject.id)} at ${place(location.id)}.`, 88, ["location"]);
  if (template.id === "location-02") return sentence(template, [subject, by("qu"), location], `${subject.simplified}去${location.simplified}`, `${subject.pinyin} qù ${location.pinyin}`, `${capitalize(enSubject(subject.id))} ${goVerb(subject.id)} to ${place(location.id)}.`, 84, ["location"]);
  if (template.id === "location-03") return sentence(template, [subject, by("bu"), by("qu"), location], `${subject.simplified}不去${location.simplified}`, `${subject.pinyin} bù qù ${location.pinyin}`, `${capitalize(enSubject(subject.id))} ${negativeGo(subject.id)} to ${place(location.id)}.`, 78, ["negation", "location"]);
  if (template.id === "location-04" || mode === "at") {
    const at = mode === "at";
    return sentence(
      template,
      [time, subject, at ? by("zai") : by("qu"), location],
      `${time.simplified}${subject.simplified}${at ? "在" : "去"}${location.simplified}`,
      `${time.pinyin} ${subject.pinyin} ${at ? "zài" : "qù"} ${location.pinyin}`,
      `${capitalize(enTime(time.id))}, ${enSubject(subject.id)} ${time.id === "zuo_tian" && !at ? "went to" : at ? `${beVerb(subject.id)} at` : `${goVerb(subject.id)} to`} ${place(location.id)}.`,
      at ? 90 : 86,
      ["time", "location"]
    );
  }
  throw new Error(`Unsupported location template: ${template.id}`);
}

function subjectDescriptionSentence(template: SentenceTemplate, subject: LexiconEntry, adjective: LexiconEntry, too: boolean): BuiltSentence {
  return sentence(template, [subject, too ? by("tai") : by("hen"), adjective], `${subject.simplified}${too ? "太" : "很"}${adjective.simplified}${too ? "了" : ""}`, `${subject.pinyin} ${too ? "tài" : "hěn"} ${adjective.pinyin}${too ? " le" : ""}`, `${capitalize(enSubject(subject.id))} ${beVerb(subject.id)} ${too ? "too " : ""}${enAdjective(adjective.id)}.`, 84, ["description"]);
}

function nounDescriptionSentence(template: SentenceTemplate, noun: LexiconEntry, adjective: LexiconEntry): BuiltSentence {
  const too = template.id === "description-03";
  const score = ["tianqi", "qian", "che"].includes(noun.id) ? 86 : 76;
  return sentence(template, [noun, too ? by("tai") : by("hen"), adjective, ...(too ? [by("le")] : [])], `${noun.simplified}${too ? "太" : "很"}${adjective.simplified}${too ? "了" : ""}`, `${noun.pinyin} ${too ? "tài" : "hěn"} ${adjective.pinyin}${too ? " le" : ""}`, `${capitalize(enNoun(noun.id))} is ${too ? "too " : ""}${enAdjective(adjective.id)}.`, too ? score - 6 : score, ["description", ...(too ? ["degree"] : [])]);
}

function verbObjectSentence(template: SentenceTemplate, subject: LexiconEntry, pair: VerbObjectPair): BuiltSentence {
  const objectText = pair.object?.simplified ?? "";
  const objectPinyin = pair.object ? ` ${pair.object.pinyin}` : "";
  const objectEnglish = pair.object ? ` ${enNoun(pair.object.id)}` : "";
  const vocab = [subject, pair.verb, ...(pair.object ? [pair.object] : [])];
  const baseZh = `${subject.simplified}${pair.verb.simplified}${objectText}`;
  const basePy = `${subject.pinyin} ${pair.verb.pinyin}${objectPinyin}`;
  const baseEn = `${capitalize(enSubject(subject.id))} ${presentVerb(subject.id, pair.verb.id)}${objectEnglish}.`;

  if (template.id === "action-01") return sentence(template, vocab, baseZh, basePy, baseEn, 88, []);
  if (template.id === "action-02") return sentence(template, [...vocab, by("bu")], `${subject.simplified}不${pair.verb.simplified}${objectText}`, `${subject.pinyin} bù ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} ${negativeVerb(subject.id, pair.verb.id)}${objectEnglish}.`, 78, ["negation"]);
  if (template.id === "action-03") return sentence(template, [...vocab, by("ye")], `${subject.simplified}也${pair.verb.simplified}${objectText}`, `${subject.pinyin} yě ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} also ${presentVerb(subject.id, pair.verb.id)}${objectEnglish}.`, 75, ["also"]);
  if (template.id === "time-01") {
    const time = times[(vocab.length + subject.id.length) % times.length];
    return sentence(template, [...vocab, time], `${time.simplified}${baseZh}`, `${time.pinyin} ${basePy}`, `${capitalize(enTime(time.id))}, ${enSubject(subject.id)} ${presentVerb(subject.id, pair.verb.id)}${objectEnglish}.`, 90, ["time"]);
  }
  if (template.id === "time-02") {
    const time = times[(vocab.length + pair.verb.id.length) % times.length];
    return sentence(template, [...vocab, time], `${subject.simplified}${time.simplified}${pair.verb.simplified}${objectText}`, `${subject.pinyin} ${time.pinyin} ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} ${presentVerb(subject.id, pair.verb.id)}${objectEnglish} ${enTime(time.id)}.`, 78, ["time"]);
  }
  if (template.id === "preference-03") return sentence(template, [...vocab, by("xiang")], `${subject.simplified}想${pair.verb.simplified}${objectText}`, `${subject.pinyin} xiǎng ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} ${wantVerb(subject.id)} to ${enVerb(pair.verb.id)}${objectEnglish}.`, 88, ["modal"]);
  if (template.id === "ability-01") return sentence(template, [...vocab, by("hui")], `${subject.simplified}会${pair.verb.simplified}${objectText}`, `${subject.pinyin} huì ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} can ${enVerb(pair.verb.id)}${objectEnglish}.`, 82, ["ability"]);
  if (template.id === "ability-02") return sentence(template, [...vocab, by("bu"), by("hui")], `${subject.simplified}不会${pair.verb.simplified}${objectText}`, `${subject.pinyin} bù huì ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} cannot ${enVerb(pair.verb.id)}${objectEnglish}.`, 78, ["ability", "negation"]);
  if (template.id === "question-01") return sentence(template, [...vocab, by("ma")], `${baseZh}吗`, `${basePy} ma`, `${questionAux(subject.id)} ${enSubject(subject.id)} ${enVerb(pair.verb.id)}${objectEnglish}?`, 88, ["question"]);
  if (template.id === "completion-01") return sentence(template, [...vocab, by("le")], `${baseZh}了`, `${basePy} le`, `${capitalize(enSubject(subject.id))} ${pastVerb(pair.verb.id)}${objectEnglish}.`, 76, ["completion"]);
  if (template.id === "completion-02") return sentence(template, [...vocab, by("mei_you")], `${subject.simplified}没有${pair.verb.simplified}${objectText}`, `${subject.pinyin} méi yǒu ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} did not ${enVerb(pair.verb.id)}${objectEnglish}.`, 76, ["completion", "negation"]);
  if (template.id === "repetition-01") return sentence(template, [...vocab, by("mei_tian")], `${subject.simplified}每天${pair.verb.simplified}${objectText}`, `${subject.pinyin} měi tiān ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} ${presentVerb(subject.id, pair.verb.id)}${objectEnglish} every day.`, 86, ["time", "repetition"]);
  if (template.id === "repetition-02") return sentence(template, [...vocab, by("mei_tian"), by("dou")], `${subject.simplified}每天都${pair.verb.simplified}${objectText}`, `${subject.pinyin} měi tiān dōu ${pair.verb.pinyin}${objectPinyin}`, `${capitalize(enSubject(subject.id))} ${presentVerb(subject.id, pair.verb.id)}${objectEnglish} every day.`, 72, ["time", "repetition"]);

  return sentence(template, vocab, baseZh, basePy, baseEn, 60, []);
}

function isValidSentence(candidate: BuiltSentence): boolean {
  const ids = new Set(candidate.vocabulary.map((entry) => entry.id));
  const text = candidate.simplified;

  if (/天气很(大|多|少|高)|我很(多|少|大|小|快|慢)|我会看电话|看电话|做工作|去家/.test(text)) return false;
  if (candidate.template.category === "description") {
    const noun = candidate.vocabulary.find((entry) => entry.partOfSpeech === "noun");
    const adjective = candidate.vocabulary.find((entry) => entry.partOfSpeech === "adjective");
    const subject = candidate.vocabulary.find((entry) => entry.partOfSpeech === "pronoun");
    if (subject && adjective && !isValidCombination("subject-predicate", subject, adjective)) return false;
    if (noun && adjective && !isValidCombination("adjective-noun", noun, adjective)) return false;
  }

  const verb = candidate.vocabulary.find((entry) => entry.partOfSpeech === "verb" && !["shi", "hui", "neng", "xiang"].includes(entry.id));
  const object = candidate.vocabulary.find((entry) => entry.partOfSpeech === "noun" && !ids.has("zai"));
  if (verb && object && !noObjectVerbIds.includes(verb.id) && !isValidCombination("verb-object", verb, object)) return false;
  if (highUseTemplateIds.has(candidate.template.id)) return candidate.qualityScore >= 80;
  return true;
}

function sentence(template: SentenceTemplate, vocabulary: LexiconEntry[], simplified: string, pinyin: string, english: string, qualityScore: number, variations: string[]): BuiltSentence {
  return { template, simplified, pinyin, english, vocabulary, qualityScore, variations };
}

function turns(input: [DialogueTurn["speaker"], string, string, string, string[], string[]?][]): DialogueTurn[] {
  return input.map(([speaker, simplified, pinyin, english, vocabularyIds, newWordIds]) => ({
    speaker,
    simplified,
    pinyin,
    english,
    vocabularyIds: [...vocabularyIds, ...(newWordIds ?? [])]
  }));
}

function readingSentences(input: [string, string, string, string[], string[]][]): ReadingSentence[] {
  return input.map(([simplified, pinyin, english, vocabularyIds, newWordIds]) => ({ simplified, pinyin, english, vocabularyIds, newWordIds }));
}

function dialogueCoverage(turns: DialogueTurn[]): number {
  const known = new Set(lexicon.map((entry) => entry.id));
  const ids = turns.flatMap((turn) => turn.vocabularyIds);
  return Number((ids.filter((id) => known.has(id)).length / ids.length).toFixed(4));
}

function validateAllCurriculumPacks(): void {
  const knownLexiconIds = new Set(lexicon.map((entry) => entry.id));
  const issues = curriculumPacks.flatMap((pack) => validateCurriculumPack(pack, knownLexiconIds));
  if (issues.length > 0) {
    throw new Error(`Curriculum validation failed:\n${issues.join("\n")}`);
  }
}

function buildCurriculumContentContract(input: {
  sentences: GeneratedSentence[];
  lockedSentences: GeneratedSentence[];
  draftSentences: GeneratedSentence[];
  curriculumPacks: CurriculumPack[];
  lockedPacks: CurriculumPack[];
  readings: ReadingPassage[];
  sentenceStream: ReturnType<typeof buildSentenceStreamWithReport>["stream"];
  reviewOnlySentences: ReturnType<typeof buildSentenceStreamWithReport>["report"]["reviewOnlySentences"];
  panMandarinContentReviewQueue: ReturnType<typeof buildPanMandarinContentReviewQueue>;
  srsSupport: ReturnType<typeof buildSrsSupportItems>;
}): CurriculumContentContract {
  return {
    id: "curriculum-content-contract-v1",
    primaryLearnerFacingSurface: "curriculum-packs",
    learnerFacingPolicy: "curated-only",
    draftPolicy: "not-learner-facing",
    reviewOnlyPolicy: "human-curation-required",
    surfaces: [
      surface("sentences", "learner-facing", "output/sentences.json", "public/data/sentences.json", input.sentences.length, ["curated"], "flattened from active curated curriculum packs"),
      surface("curriculum-packs", "learner-facing", "output/curriculum-packs.json", "public/data/curriculum-packs.json", input.curriculumPacks.length, ["curated"], "active packs only; all pack content must validate against curriculum policy"),
      surface("readings", "learner-facing", "output/readings.json", "public/data/readings.json", input.readings.length, ["curated"], "active pack readings only; CI+1 coverage and tier complexity required"),
      surface("locked-sentences", "locked-future", "output/locked-sentences.json", "public/data/locked-sentences.json", input.lockedSentences.length, ["curated"], "future curated pack material; not active until unlock threshold is reached"),
      surface("locked-packs", "locked-future", "output/locked-packs.json", "public/data/locked-packs.json", input.lockedPacks.length, ["curated"], "future packs; not active until unlock threshold is reached"),
      surface("draft-sentences", "draft-review", "output/draft-sentences.json", "public/data/draft-sentences.json", input.draftSentences.length, ["draft"], "template candidates; never learner-facing without curation"),
      surface("sentence-stream", "learner-facing", "output/sentence-stream.json", "public/data/sentence-stream.json", input.sentenceStream.length, ["curated"], "primary CI+1 stream after curated/authored validation"),
      surface("review-only-sentences", "review-only", "output/review-only-sentences.json", "public/data/review-only-sentences.json", input.reviewOnlySentences.length, ["review-only"], "known-only or non-acquisition candidates; not learner-facing CI"),
      surface("pan-mandarin-content-review-queue", "review-only", "output/pan-mandarin-content-review-queue.json", "public/data/pan-mandarin-content-review-queue.json", input.panMandarinContentReviewQueue.length, ["review-only"], "pan-Mandarin island/story material requires human curation before promotion"),
      surface("srs-support", "support", "output/srs-support.json", "public/data/srs-support.json", input.srsSupport.length, ["curated"], "retention support derived only after CI stream exposure")
    ]
  };
}

function surface(
  id: string,
  role: CurriculumContentContract["surfaces"][number]["role"],
  outputPath: string,
  publicDataPath: string,
  itemCount: number,
  allowedReviewStatuses: string[],
  promotionGate: string
): CurriculumContentContract["surfaces"][number] {
  return { id, role, outputPath, publicDataPath, itemCount, allowedReviewStatuses, promotionGate };
}

function writeWebData(result: {
  sentences: GeneratedSentence[];
  lockedSentences: GeneratedSentence[];
  draftSentences: GeneratedSentence[];
  dialogues: Dialogue[];
  readings: ReadingPassage[];
  curriculumPacks: CurriculumPack[];
  lockedPacks: CurriculumPack[];
  acquisitionVocabPath: ReturnType<typeof buildAcquisitionVocabPath>;
  sourceListImportAudit: ReturnType<typeof buildSourceListImportAudit>;
  panMandarinSourceAudit: ReturnType<typeof buildPanMandarinSourceAudit>;
  panMandarinVocab: ReturnType<typeof buildPanMandarinVocab>;
  panMandarinCiCandidates: ReturnType<typeof buildPanMandarinCiCandidates>;
  panMandarinCiCoverageReport: ReturnType<typeof buildPanMandarinCiCoverageReport>;
  panMandarinIslandUnlocks: ReturnType<typeof buildPanMandarinIslandUnlocks>;
  panMandarinStoryTopicPlan: ReturnType<typeof buildPanMandarinStoryTopicPlan>;
  panMandarinStoryQueues: ReturnType<typeof buildPanMandarinStoryQueues>;
  panMandarinPremadeIslands: ReturnType<typeof buildPanMandarinPremadeIslands>;
  panMandarinPremadeStories: ReturnType<typeof buildPanMandarinPremadeStories>;
  panMandarinContentCoverageReport: ReturnType<typeof buildPanMandarinContentCoverageReport>;
  panMandarinContentReviewQueue: ReturnType<typeof buildPanMandarinContentReviewQueue>;
  panMandarinContentReviewReport: ReturnType<typeof buildPanMandarinContentReviewReport>;
  dailyShadowSchedule: ReturnType<typeof buildDailyShadowSchedule>;
  shadowSessionPlan: ReturnType<typeof buildShadowSessionPlan>;
  srsDailyPlan: ReturnType<typeof buildSrsDailyPlan>;
  curriculumRoadmap: ReturnType<typeof buildCurriculumRoadmap>;
  ciPath: ReturnType<typeof buildCiPath>;
  ciSentenceTargets: ReturnType<typeof buildCiSentenceTargets>;
  ciCurationQueue: ReturnType<typeof buildCiCurationQueue>;
  authorableCiCurationQueue: ReturnType<typeof buildAuthorableCiCurationQueue>;
  ciCurationBatches: ReturnType<typeof buildCiCurationBatches>;
  ciAuthoringPackets: ReturnType<typeof buildCiAuthoringPackets>;
  compactCiAuthoringPackets: ReturnType<typeof buildCompactCiAuthoringPackets>;
  authoredCiSentences: AuthoredCiSentence[];
  authoredCiValidationReport: ReturnType<typeof validateAuthoredCiSentences>;
  promotedAuthoredCiStream: ReturnType<typeof promoteAuthoredCiSentencesToStream>;
  ciPipelineContract: ReturnType<typeof buildCiPipelineContract>;
  curriculumContentContract: CurriculumContentContract;
  ciCoverageReport: ReturnType<typeof buildCiCoverageReport>;
  sentenceStream: ReturnType<typeof buildSentenceStreamWithReport>["stream"];
  sentenceStreamBuildReport: ReturnType<typeof buildSentenceStreamWithReport>["report"];
  srsSupport: ReturnType<typeof buildSrsSupportItems>;
  articleUnlocks: ReturnType<typeof buildArticleUnlocks>;
}): void {
  const dataDir = join("public", "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, "sentences.json"), JSON.stringify(result.sentences, null, 2), "utf8");
  writeFileSync(join(dataDir, "locked-sentences.json"), JSON.stringify(result.lockedSentences, null, 2), "utf8");
  writeFileSync(join(dataDir, "curriculum-packs.json"), JSON.stringify(result.curriculumPacks, null, 2), "utf8");
  writeFileSync(join(dataDir, "locked-packs.json"), JSON.stringify(result.lockedPacks, null, 2), "utf8");
  writeFileSync(join(dataDir, "draft-sentences.json"), JSON.stringify(result.draftSentences, null, 2), "utf8");
  writeFileSync(join(dataDir, "dialogues.json"), JSON.stringify(result.dialogues, null, 2), "utf8");
  writeFileSync(join(dataDir, "readings.json"), JSON.stringify(result.readings, null, 2), "utf8");
  writeFileSync(join(dataDir, "progression-policy.json"), JSON.stringify(progressionTiers, null, 2), "utf8");
  writeFileSync(join(dataDir, "product-policy.json"), JSON.stringify(productPolicy, null, 2), "utf8");
  writeFileSync(join(dataDir, "source-registry.json"), JSON.stringify(vocabSourceRegistry, null, 2), "utf8");
  writeFileSync(join(dataDir, "vocab-source-audit.json"), JSON.stringify(lexiconBuildReport, null, 2), "utf8");
  writeFileSync(join(dataDir, "source-list-import-audit.json"), JSON.stringify(result.sourceListImportAudit, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-source-audit.json"), JSON.stringify(result.panMandarinSourceAudit, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-vocab.json"), JSON.stringify(result.panMandarinVocab, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-ci-candidates.json"), JSON.stringify(result.panMandarinCiCandidates, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-ci-coverage-report.json"), JSON.stringify(result.panMandarinCiCoverageReport, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-grammar-tags.json"), JSON.stringify(panMandarinGrammarPoints, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-island-unlocks.json"), JSON.stringify(result.panMandarinIslandUnlocks, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-story-topic-plan.json"), JSON.stringify(result.panMandarinStoryTopicPlan, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-story-queues.json"), JSON.stringify(result.panMandarinStoryQueues, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-premade-islands.json"), JSON.stringify(result.panMandarinPremadeIslands, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-premade-stories.json"), JSON.stringify(result.panMandarinPremadeStories, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-content-coverage-report.json"), JSON.stringify(result.panMandarinContentCoverageReport, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-content-review-queue.json"), JSON.stringify(result.panMandarinContentReviewQueue, null, 2), "utf8");
  writeFileSync(join(dataDir, "pan-mandarin-content-review-report.json"), JSON.stringify(result.panMandarinContentReviewReport, null, 2), "utf8");
  writeFileSync(join(dataDir, "daily-shadow-schedule.json"), JSON.stringify(result.dailyShadowSchedule, null, 2), "utf8");
  writeFileSync(join(dataDir, "shadow-session-plan.json"), JSON.stringify(result.shadowSessionPlan, null, 2), "utf8");
  writeFileSync(join(dataDir, "srs-daily-plan.json"), JSON.stringify(result.srsDailyPlan, null, 2), "utf8");
  writeFileSync(join(dataDir, "curriculum-roadmap.json"), JSON.stringify(result.curriculumRoadmap, null, 2), "utf8");
  writeFileSync(join(dataDir, "acquisition-vocab-path.json"), JSON.stringify(result.acquisitionVocabPath, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-path.json"), JSON.stringify(result.ciPath, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-sentence-targets.json"), JSON.stringify(result.ciSentenceTargets, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-curation-queue.json"), JSON.stringify(result.ciCurationQueue, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-authorable-curation-queue.json"), JSON.stringify(result.authorableCiCurationQueue, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-curation-batches.json"), JSON.stringify(result.ciCurationBatches, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-authoring-packets.json"), JSON.stringify(result.ciAuthoringPackets, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-authoring-packets.compact.json"), JSON.stringify(result.compactCiAuthoringPackets, null, 2), "utf8");
  writeFileSync(join(dataDir, "authored-ci-sentences.json"), JSON.stringify(result.authoredCiSentences, null, 2), "utf8");
  writeFileSync(join(dataDir, "authored-ci-validation-report.json"), JSON.stringify(result.authoredCiValidationReport, null, 2), "utf8");
  writeFileSync(join(dataDir, "promoted-authored-ci-stream.json"), JSON.stringify(result.promotedAuthoredCiStream, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-pipeline-contract.json"), JSON.stringify(result.ciPipelineContract, null, 2), "utf8");
  writeFileSync(join(dataDir, "curriculum-content-contract.json"), JSON.stringify(result.curriculumContentContract, null, 2), "utf8");
  writeFileSync(join(dataDir, "ci-coverage-report.json"), JSON.stringify(result.ciCoverageReport, null, 2), "utf8");
  writeFileSync(join(dataDir, "sentence-stream.json"), JSON.stringify(result.sentenceStream, null, 2), "utf8");
  writeFileSync(join(dataDir, "sentence-stream-build-report.json"), JSON.stringify(result.sentenceStreamBuildReport, null, 2), "utf8");
  writeFileSync(join(dataDir, "review-only-sentences.json"), JSON.stringify(result.sentenceStreamBuildReport.reviewOnlySentences, null, 2), "utf8");
  writeFileSync(join(dataDir, "blocked-ci-sentences.json"), JSON.stringify(result.sentenceStreamBuildReport.blockedSentences, null, 2), "utf8");
  writeFileSync(join(dataDir, "island-unlocks.json"), JSON.stringify(islandUnlocks, null, 2), "utf8");
  writeFileSync(join(dataDir, "article-unlocks.json"), JSON.stringify(result.articleUnlocks, null, 2), "utf8");
  writeFileSync(join(dataDir, "srs-support.json"), JSON.stringify(result.srsSupport, null, 2), "utf8");
  writeFileSync(join(dataDir, "lexicon.json"), JSON.stringify(lexicon, null, 2), "utf8");
}

function ids(...entryIds: string[]): LexiconEntry[] {
  return entryIds.map(by);
}

function by(id: string): LexiconEntry {
  const entry = byId.get(id);
  if (!entry) throw new Error(`Missing lexicon entry: ${id}`);
  return entry;
}

function uniqueIds(vocabulary: LexiconEntry[]): string[] {
  return Array.from(new Set(vocabulary.map((entry) => entry.id)));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function beVerb(subjectId: string): string {
  return subjectId === "wo" ? "am" : subjectId === "women" ? "are" : subjectId === "ni" ? "are" : "is";
}

function likeVerb(subjectId: string): string {
  return ["ta_he", "ta_she"].includes(subjectId) ? "likes" : "like";
}

function negativeLike(subjectId: string): string {
  return ["ta_he", "ta_she"].includes(subjectId) ? "does not like" : "do not like";
}

function wantVerb(subjectId: string): string {
  return ["ta_he", "ta_she"].includes(subjectId) ? "wants" : "want";
}

function goVerb(subjectId: string): string {
  return ["ta_he", "ta_she"].includes(subjectId) ? "goes" : "go";
}

function negativeGo(subjectId: string): string {
  return ["ta_he", "ta_she"].includes(subjectId) ? "does not go" : "do not go";
}

function presentVerb(subjectId: string, verbId: string): string {
  const verb = enVerb(verbId);
  if (!["ta_he", "ta_she"].includes(subjectId)) return verb;
  if (verb === "study") return "studies";
  if (verb === "make") return "makes";
  if (verb === "go") return "goes";
  return `${verb}s`;
}

function negativeVerb(subjectId: string, verbId: string): string {
  return `${["ta_he", "ta_she"].includes(subjectId) ? "does not" : "do not"} ${enVerb(verbId)}`;
}

function pastVerb(verbId: string): string {
  const irregular = new Map([
    ["chi", "ate"],
    ["he", "drank"],
    ["kan", "read"],
    ["mai_buy", "bought"],
    ["zuo", "made"],
    ["da", "made"],
    ["xie", "wrote"]
  ]);
  return irregular.get(verbId) ?? `${enVerb(verbId)}ed`;
}

function questionAux(subjectId: string): string {
  return ["ta_he", "ta_she"].includes(subjectId) ? "Does" : "Do";
}

function possessive(subjectId: string): string {
  return new Map([
    ["wo", "my"],
    ["ni", "your"],
    ["ta_he", "his"],
    ["ta_she", "her"],
    ["women", "our"]
  ]).get(subjectId) ?? "their";
}

function place(locationId: string): string {
  if (locationId === "jia") return "home";
  if (locationId === "xuexiao") return "school";
  return `the ${enNoun(locationId)}`;
}

function whereQuestion(subjectId: string): string {
  if (subjectId === "wo") return "Where am I";
  if (subjectId === "ni" || subjectId === "women") return `Where are ${enSubject(subjectId)}`;
  return `Where is ${enSubject(subjectId)}`;
}

function whoQuestion(subjectId: string): string {
  if (subjectId === "ni") return "Who are you";
  return `Who is ${enSubject(subjectId)}`;
}
