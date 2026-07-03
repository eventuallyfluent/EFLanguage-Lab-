import {
  AcquisitionVocabPath,
  CurriculumRoadmap,
  DailyShadowSchedule,
  DailyShadowScheduleDay,
  PanMandarinCiCandidate,
  PanMandarinIslandUnlock,
  PanMandarinPremadeStory,
  ShadowCurriculumItem,
  ShadowLineStatus,
  ShadowSessionPlan,
  SrsDailyPlan
} from "./models";

const newItemsPerDay = 10;
const targetItemCount = 10000;
const totalDays = 1000;
const rollingReviewWindowDays = 5;
const sessionTargetMinutes = 15;
const defaultCompletionYears = Number((totalDays / 365).toFixed(1));

export function buildDailyShadowSchedule(candidates: PanMandarinCiCandidate[]): DailyShadowSchedule {
  const items = candidates
    .slice()
    .sort((a, b) => a.targetCommunicationPathRank - b.targetCommunicationPathRank || a.id.localeCompare(b.id))
    .slice(0, targetItemCount)
    .map((candidate, index) => shadowItemFor(candidate, index + 1));
  const itemIdsByDay = new Map<number, string[]>();
  for (const item of items) {
    const existing = itemIdsByDay.get(item.day) ?? [];
    existing.push(item.id);
    itemIdsByDay.set(item.day, existing);
  }
  const days = Array.from({ length: totalDays }, (_, index) => shadowDayFor(index + 1, itemIdsByDay));

  return {
    id: "daily-shadow-schedule-v1",
    targetItemCount,
    newItemsPerDay,
    totalDays,
    defaultCompletionYears,
    rollingReviewWindowDays,
    sessionTargetMinutes,
    items,
    days
  };
}

export function buildShadowSessionPlan(): ShadowSessionPlan {
  return {
    id: "shadow-session-plan-v1",
    scheduleId: "daily-shadow-schedule-v1",
    displayFields: ["simplified", "pinyin", "english"],
    audioMode: "browser-tts-fallback",
    autoAdvance: true,
    listenPassesPerLine: 1,
    shadowPassesPerLine: 1,
    secondsPerListenPass: 3,
    secondsPerShadowPass: 6,
    defaultSessionMinutes: sessionTargetMinutes,
    controls: ["pause", "replay", "previous", "next", "mark-complete", "toggle-pinyin", "toggle-english"]
  };
}

export function buildSrsDailyPlan(schedule: DailyShadowSchedule): SrsDailyPlan {
  return {
    id: "srs-daily-plan-v1",
    maxNewCardsPerDay: 10,
    scheduler: "fsrs-compatible-local-v1",
    vacationMode: {
      pausesDuePressure: true,
      preservesCardState: true
    },
    days: schedule.days.map((day) => ({
      day: day.day,
      newCardItemIds: day.newItemIds.slice(0, 10),
      maxNewCards: 10,
      introducedOnlyFromSeenShadowItems: true
    }))
  };
}

export function buildCurriculumRoadmap(
  acquisitionPath: AcquisitionVocabPath,
  schedule: DailyShadowSchedule,
  stories: PanMandarinPremadeStory[],
  islands: PanMandarinIslandUnlock[]
): CurriculumRoadmap {
  return {
    id: "curriculum-roadmap-v1",
    targetVocabularyCount: acquisitionPath.targetVocabularyCount,
    newItemsPerDay,
    totalShadowDays: schedule.totalDays,
    defaultCompletionYears,
    stages: acquisitionPath.stages,
    storyUnlocks: stories
      .slice()
      .sort((a, b) => a.unlockAtWordCount - b.unlockAtWordCount || a.id.localeCompare(b.id))
      .map((story) => ({
        storyId: story.id,
        title: story.title,
        unlockAtWordCount: story.unlockAtWordCount,
        unlockDay: dayForUnlock(story.unlockAtWordCount),
        selectedTopicId: story.selectedTopicId
      })),
    islandUnlocks: islands
      .slice()
      .sort((a, b) => a.unlockAtWordCount - b.unlockAtWordCount || a.id.localeCompare(b.id))
      .map((island) => ({
        islandId: island.id,
        label: island.label,
        unlockAtWordCount: island.unlockAtWordCount,
        unlockDay: dayForUnlock(island.unlockAtWordCount)
      })),
    honestPromise: "A 10,000-item Mandarin shadowing path at 10 new items per day takes about 2.7 years by default."
  };
}

function shadowItemFor(candidate: PanMandarinCiCandidate, sequenceInCourse: number): ShadowCurriculumItem {
  const day = Math.ceil(sequenceInCourse / newItemsPerDay);
  const simplified = candidate.simplified ?? candidate.target.simplified;
  const pinyin = candidate.pinyin ?? candidate.target.pinyin;
  const english = candidate.english ?? candidate.target.gloss;
  const displayMode = candidate.simplified ? "sentence" : "target-placeholder";

  return {
    id: `shadow-${String(sequenceInCourse).padStart(5, "0")}`,
    day,
    sequenceInCourse,
    conceptId: candidate.conceptId,
    targetCommunicationPathRank: candidate.targetCommunicationPathRank,
    simplified,
    traditional: candidate.traditional ?? candidate.target.traditional,
    pinyin,
    english,
    displayMode,
    lineStatus: lineStatusFor(candidate),
    sourceCandidateId: candidate.id,
    naturalnessDisposition: candidate.naturalnessDisposition,
    reviewStatus: "review-only"
  };
}

function shadowDayFor(day: number, itemIdsByDay: Map<number, string[]>): DailyShadowScheduleDay {
  const activeWindowStartDay = Math.max(1, day - rollingReviewWindowDays + 1);
  const activeWindowEndDay = day;
  const reviewDayNumbers = Array.from({ length: day - activeWindowStartDay }, (_, index) => activeWindowStartDay + index);
  const newItemIds = itemIdsByDay.get(day) ?? [];
  const reviewItemIds = reviewDayNumbers.flatMap((reviewDay) => itemIdsByDay.get(reviewDay) ?? []);
  const sessionItemIds = [...reviewItemIds, ...newItemIds];

  return {
    day,
    newItemIds,
    reviewDayNumbers,
    reviewItemIds,
    sessionItemIds,
    newCount: newItemIds.length,
    reviewCount: reviewItemIds.length,
    sessionCount: sessionItemIds.length,
    activeWindowStartDay,
    activeWindowEndDay,
    estimatedMinutes: sessionTargetMinutes
  };
}

function lineStatusFor(candidate: PanMandarinCiCandidate): ShadowLineStatus {
  if (candidate.naturalnessDisposition === "accepted-review") return "accepted-review";
  if (candidate.naturalnessDisposition === "needs-human-review") return "needs-human-review";
  return "blocked";
}

function dayForUnlock(unlockAtWordCount: number): number {
  return Math.max(1, Math.ceil(unlockAtWordCount / newItemsPerDay));
}
