import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Captions,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Gauge,
  Layers3,
  Library,
  Lock,
  Mic2,
  MapPinned,
  Play,
  PlusCircle,
  Repeat2,
  Search,
  Settings2,
  Unlock,
  Volume2
} from "lucide-react";

type View = "dashboard" | "stream" | "authoring" | "input" | "shadowing" | "articles" | "srs" | "journey" | "settings";
type Complexity = "single-clause" | "paired-clause" | "multi-clause";

interface Sentence {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
  vocabularyIds: string[];
  difficulty: string;
  themeTags?: string[];
  unlockAtWordCount?: number;
  tierId?: string;
  packId?: string;
  complexity?: Complexity;
}

interface DialogueTurn {
  speaker: "A" | "B";
  simplified: string;
  pinyin: string;
  english: string;
  vocabularyIds: string[];
}

interface Dialogue {
  id: string;
  title: string;
  turns: DialogueTurn[];
}

interface ReadingLine {
  simplified: string;
  pinyin: string;
  english: string;
  vocabularyIds: string[];
  newWordIds: string[];
}

interface Reading {
  id: string;
  title: string;
  sentences: ReadingLine[];
  knownVocabularyCoverage: number;
  ciPlusOneValid: boolean;
}

interface Pack {
  id: string;
  tierId: string;
  title: string;
  summary: string;
  unlockAtWordCount: number;
  themeTags: string[];
  sentences: Sentence[];
  dialogues: Dialogue[];
  readings: Reading[];
}

interface LexiconEntry {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
  hskLevel: number;
}

interface AppData {
  packs: Pack[];
  lockedPacks: Pack[];
  lexicon: LexiconEntry[];
  productPolicy: ProductPolicy;
  acquisitionPath: AcquisitionVocabPath;
  articleUnlocks: ArticleUnlockPolicy[];
  sentenceStream: SentenceStreamItem[];
  sentenceStreamReport: SentenceStreamBuildReport;
  ciCoverageReport: CiCoverageReport;
  ciCurationQueue: CiCurationQueueItem[];
  authorableCiCurationQueue: CiCurationQueueItem[];
  ciAuthoringPackets: CompactCiAuthoringPacket[];
  ciPipelineContract: CiPipelineContract;
  sourceListImportAudit: SourceListImportAudit;
  authoredCiValidationReport: AuthoredCiValidationReport;
  dailyShadowSchedule: DailyShadowSchedule;
  shadowSessionPlan: ShadowSessionPlan;
  srsDailyPlan: SrsDailyPlan;
  curriculumRoadmap: CurriculumRoadmap;
}

interface AcquisitionPathStage {
  id: string;
  minKnownWords: number;
  label: string;
  rankingBias: string;
}

interface AcquisitionVocabPath {
  targetVocabularyCount: number;
  currentCandidateCount: number;
  stages: AcquisitionPathStage[];
}

interface SentenceStreamItem {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
  knownWordThreshold: number;
  knownVocabularyIds: string[];
  newWordIds: string[];
  vocabularyIds: string[];
  qualityScore: number;
}

type ShadowLineStatus = "accepted-review" | "needs-human-review" | "blocked";

interface ShadowCurriculumItem {
  id: string;
  day: number;
  sequenceInCourse: number;
  conceptId: string;
  targetCommunicationPathRank: number;
  simplified: string;
  traditional?: string;
  pinyin?: string;
  english: string;
  displayMode: "sentence" | "target-placeholder";
  lineStatus: ShadowLineStatus;
  sourceCandidateId: string;
  naturalnessDisposition?: string;
  reviewStatus: "review-only";
}

interface DailyShadowScheduleDay {
  day: number;
  newItemIds: string[];
  reviewDayNumbers: number[];
  reviewItemIds: string[];
  sessionItemIds: string[];
  newCount: number;
  reviewCount: number;
  sessionCount: number;
  activeWindowStartDay: number;
  activeWindowEndDay: number;
  estimatedMinutes: number;
}

interface DailyShadowSchedule {
  id: "daily-shadow-schedule-v1";
  targetItemCount: number;
  newItemsPerDay: number;
  totalDays: number;
  defaultCompletionYears: number;
  rollingReviewWindowDays: number;
  sessionTargetMinutes: number;
  items: ShadowCurriculumItem[];
  days: DailyShadowScheduleDay[];
}

interface ShadowSessionPlan {
  id: "shadow-session-plan-v1";
  audioMode: "browser-tts-fallback";
  autoAdvance: true;
  listenPassesPerLine: number;
  shadowPassesPerLine: number;
  secondsPerListenPass: number;
  secondsPerShadowPass: number;
  defaultSessionMinutes: number;
  controls: string[];
}

interface SrsDailyPlanDay {
  day: number;
  newCardItemIds: string[];
  maxNewCards: number;
  introducedOnlyFromSeenShadowItems: true;
}

interface SrsDailyPlan {
  id: "srs-daily-plan-v1";
  maxNewCardsPerDay: number;
  scheduler: "fsrs-compatible-local-v1";
  vacationMode: {
    pausesDuePressure: true;
    preservesCardState: true;
  };
  days: SrsDailyPlanDay[];
}

interface CurriculumRoadmap {
  id: "curriculum-roadmap-v1";
  targetVocabularyCount: number;
  newItemsPerDay: number;
  totalShadowDays: number;
  defaultCompletionYears: number;
  stages: AcquisitionPathStage[];
  storyUnlocks: Array<{ storyId: string; title: string; unlockAtWordCount: number; unlockDay: number; selectedTopicId?: string }>;
  islandUnlocks: Array<{ islandId: string; label: string; unlockAtWordCount: number; unlockDay: number }>;
  honestPromise: string;
}

interface SentenceStreamBuildReport {
  candidateSentenceCount: number;
  acquisitionItemCount: number;
  reviewOnlyCount: number;
  blockedCount: number;
}

interface CiCoverageReport {
  targetVocabularyCount: number;
  targetCount: number;
  targetsWithCuratedSeed: number;
  targetsNeedingCuration: number;
  totalExposureDeficit: number;
}

interface CiCurationQueueItem {
  id: string;
  vocabularyId: string;
  wordIndex: number;
  simplified: string;
  pinyin?: string;
  knownWordThreshold: number;
  exposureDeficit: number;
  priority: "now" | "next" | "later";
  stageId: string;
}

interface CompactCiAuthoringSlot {
  id: string;
  slotIndex: number;
  mode: "bootstrap-seed" | "ci-plus-one";
  functionHint: string;
  requiredNewWordId: string;
  allowedKnownVocabularyIds: string[];
  acceptanceCriteria: string[];
}

interface CompactCiAuthoringPacketItem {
  targetId: string;
  vocabularyId: string;
  wordIndex: number;
  stageId: string;
  sentenceSlots: CompactCiAuthoringSlot[];
}

interface CompactCiAuthoringVocabularyItem {
  vocabularyId: string;
  wordIndex: number;
  simplified: string;
  pinyin?: string;
  hskLevel: number;
  partOfSpeech: string;
}

interface CompactCiAuthoringPacket {
  id: string;
  sourceBatchId: string;
  sequence: number;
  stageId: string;
  targetWordStart: number;
  targetWordEnd: number;
  vocabularyPool: CompactCiAuthoringVocabularyItem[];
  items: CompactCiAuthoringPacketItem[];
}

interface CiPipelineStep {
  id: string;
  order: number;
  name: string;
  purpose: string;
  currentCount?: number;
  status: "implemented" | "partial" | "pending-source";
}

interface CiPipelineContract {
  productGoal: string;
  primaryEngine: string;
  srsRole: string;
  steps: CiPipelineStep[];
}

interface SourceListImportStatus {
  source: string;
  importMode: "file" | "fixture" | "missing";
  importedEntryCount: number;
  notes: string;
}

interface SourceListImportAudit {
  sourceLists: SourceListImportStatus[];
  warnings: string[];
}

interface AuthoredCiValidationReport {
  sentenceCount: number;
  acceptedCount: number;
  rejectedCount: number;
}

interface JourneyMilestone {
  knownWordCount: number;
  label: string;
  acquisitionFocus: string;
  unlockedContent: string[];
}

interface ArticleUnlockPolicy {
  id: string;
  minKnownWords: number;
  minKnownVocabularyCoverage: number;
  maxNewWordsPerSentence: 1 | 2;
  allowedComplexity: Complexity;
  description: string;
}

interface ProductPolicy {
  targetVocabularyCount: number;
  primaryAcquisitionMode: "ci-plus-one-sentence-stream";
  repetitionStyle: "glossika-style";
  srsRole: "support-retention";
  journeyMilestones: JourneyMilestone[];
  articleUnlocks: ArticleUnlockPolicy[];
}

interface LearnerState {
  knownWordCount: number;
  currentDay: number;
  completedShadowDays: number[];
  completedShadowSentenceIds: string[];
  shadowDisplaySettings: {
    showPinyin: boolean;
    showEnglish: boolean;
    autoAdvance: boolean;
  };
  completedPackIds: string[];
  shadowedLineKeys: string[];
  srsCards: Record<string, SrsCardState>;
  vacationMode: boolean;
  lastSessionAt?: string;
  showPinyin: boolean;
  showEnglish: boolean;
}

interface SrsCardState {
  lineKey: string;
  intervalDays: number;
  ease: number;
  dueAt: string;
  reps: number;
  lapses: number;
  lastReviewedAt?: string;
}

interface LineSource {
  lineKey: string;
  source: "reading" | "dialogue" | "sentence";
  packId: string;
  packTitle: string;
  simplified: string;
  pinyin: string;
  english: string;
  vocabularyIds: string[];
}

const defaultState: LearnerState = {
  knownWordCount: 157,
  currentDay: 1,
  completedShadowDays: [],
  completedShadowSentenceIds: [],
  shadowDisplaySettings: {
    showPinyin: true,
    showEnglish: true,
    autoAdvance: true
  },
  completedPackIds: [],
  shadowedLineKeys: [],
  srsCards: {},
  vacationMode: false,
  showPinyin: true,
  showEnglish: true
};

const stateKey = "efm-ci-shadowing-state-v1";

export function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [state, setState] = usePersistentState();
  const [view, setView] = useState<View>("dashboard");
  const [query, setQuery] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState(0);
  const [activeShadowIndex, setActiveShadowIndex] = useState(0);
  const [shadowMode, setShadowMode] = useState<"reading" | "dialogue">("reading");

  useEffect(() => {
    void loadAppData().then(setData);
  }, []);

  const allPacks = useMemo(() => {
    if (!data) return [];
    return [...data.packs, ...data.lockedPacks].sort((a, b) => a.unlockAtWordCount - b.unlockAtWordCount || a.title.localeCompare(b.title));
  }, [data]);

  const unlockedPacks = useMemo(
    () => allPacks.filter((pack) => pack.unlockAtWordCount <= state.knownWordCount),
    [allPacks, state.knownWordCount]
  );

  const visiblePacks = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return allPacks;
    return allPacks.filter((pack) => {
      const haystack = [pack.title, pack.summary, pack.tierId, ...pack.themeTags].join(" ").toLowerCase();
      return haystack.includes(cleanQuery);
    });
  }, [allPacks, query]);

  const selectedPack = useMemo(() => {
    const fallback = unlockedPacks[0] ?? allPacks[0] ?? null;
    return allPacks.find((pack) => pack.id === selectedPackId) ?? fallback;
  }, [allPacks, selectedPackId, unlockedPacks]);

  const knownLexicon = useMemo(() => data?.lexicon.slice(0, state.knownWordCount) ?? [], [data, state.knownWordCount]);
  const lineSources = useMemo(() => buildLineSources(allPacks), [allPacks]);
  const shadowLineSources = useMemo(() => data ? buildShadowLineSources(data.dailyShadowSchedule, state.completedShadowSentenceIds) : [], [data, state.completedShadowSentenceIds]);
  const allSrsLineSources = useMemo(() => [...shadowLineSources, ...lineSources], [lineSources, shadowLineSources]);
  const dueSrsLines = useMemo(() => getDueSrsLines(state, allSrsLineSources), [allSrsLineSources, state]);
  const selectedUnlocked = selectedPack ? selectedPack.unlockAtWordCount <= state.knownWordCount : false;
  const selectedReading = selectedPack?.readings[0] ?? null;
  const currentShadowDay = data?.dailyShadowSchedule.days[Math.max(0, Math.min(state.currentDay, data.dailyShadowSchedule.totalDays) - 1)] ?? null;
  const shadowItemsById = useMemo(() => new Map(data?.dailyShadowSchedule.items.map((item) => [item.id, item]) ?? []), [data]);
  const todaysShadowItems = useMemo(
    () => currentShadowDay?.sessionItemIds.map((id) => shadowItemsById.get(id)).filter((item): item is ShadowCurriculumItem => Boolean(item)) ?? [],
    [currentShadowDay, shadowItemsById]
  );

  if (!data || !selectedPack) {
    return (
      <main className="loading-screen">
        <BookOpen aria-hidden="true" />
        <span>Loading curriculum</span>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Sidebar view={view} onViewChange={setView} />

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Eventually Fluent Mandarin</h1>
            <p>Day {state.currentDay.toLocaleString()} / {data.dailyShadowSchedule.totalDays.toLocaleString()} · {data.dailyShadowSchedule.newItemsPerDay} new shadow lines/day · {dueSrsLines.length} SRS due</p>
          </div>
          <LearnerControls state={state} setState={setState} maxDay={data.dailyShadowSchedule.totalDays} />
        </header>

        {view === "dashboard" && currentShadowDay && (
          <DashboardView
            data={data}
            state={state}
            setState={setState}
            currentDay={currentShadowDay}
            todaysShadowItems={todaysShadowItems}
            dueSrsLines={dueSrsLines}
            onStartShadowing={() => {
              setActiveShadowIndex(0);
              setView("shadowing");
            }}
            onOpenSrs={() => setView("srs")}
            onOpenRoadmap={() => setView("journey")}
          />
        )}

        {view === "stream" && (
          <div className="stream-layout">
            <EngineOverview data={data} knownWordCount={state.knownWordCount} />
            <div className="content-grid">
              <section className="pack-column" aria-label="CI+1 sentence packs">
                <div className="search-row">
                  <Search aria-hidden="true" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sentence sets, tiers, themes" />
                </div>
                <div className="pack-list">
                  {visiblePacks.map((pack) => (
                    <PackRow
                      key={pack.id}
                      pack={pack}
                      selected={pack.id === selectedPack.id}
                      completed={state.completedPackIds.includes(pack.id)}
                      unlocked={pack.unlockAtWordCount <= state.knownWordCount}
                      onSelect={() => setSelectedPackId(pack.id)}
                    />
                  ))}
                </div>
              </section>

              <PackDetail
                pack={selectedPack}
                unlocked={selectedUnlocked}
                completed={state.completedPackIds.includes(selectedPack.id)}
                onComplete={() => toggleListValue("completedPackIds", selectedPack.id, setState)}
                onStudyInput={() => {
                  setView("input");
                  setActiveLine(0);
                }}
                onShadow={() => {
                  setView("shadowing");
                  setActiveLine(0);
                }}
              />
            </div>
          </div>
        )}

        {view === "input" && (
          <InputView
            pack={selectedPack}
            reading={selectedReading}
            activeLine={activeLine}
            setActiveLine={setActiveLine}
            unlocked={selectedUnlocked}
            state={state}
            setState={setState}
          />
        )}

        {view === "authoring" && (
          <AuthoringView
            packets={data.ciAuthoringPackets}
            validationReport={data.authoredCiValidationReport}
          />
        )}

        {view === "shadowing" && (
          <DailyShadowingView
            day={currentShadowDay}
            items={todaysShadowItems}
            activeIndex={activeShadowIndex}
            setActiveIndex={setActiveShadowIndex}
            state={state}
            setState={setState}
            sessionPlan={data.shadowSessionPlan}
          />
        )}

        {view === "articles" && (
          <ArticlesView
            packs={allPacks}
            articleUnlocks={data.articleUnlocks}
            knownWordCount={state.knownWordCount}
            onSelectPack={(packId) => {
              setSelectedPackId(packId);
              setView("input");
              setActiveLine(0);
            }}
          />
        )}

        {view === "srs" && (
          <SrsView
            state={state}
            setState={setState}
            lineSources={allSrsLineSources}
            dueLines={dueSrsLines}
            srsDailyPlan={data.srsDailyPlan}
          />
        )}

        {view === "journey" && (
          <JourneyView
            packs={allPacks}
            unlockedPacks={unlockedPacks}
            knownLexicon={knownLexicon}
            state={state}
            productPolicy={data.productPolicy}
            acquisitionPath={data.acquisitionPath}
            roadmap={data.curriculumRoadmap}
          />
        )}

        {view === "settings" && (
          <SettingsView state={state} setState={setState} maxDay={data.dailyShadowSchedule.totalDays} />
        )}
      </section>
    </main>
  );
}

function Sidebar({ view, onViewChange }: { view: View; onViewChange: (view: View) => void }) {
  const items: Array<{ id: View; label: string; icon: typeof Library }> = [
    { id: "dashboard", label: "Today", icon: Play },
    { id: "shadowing", label: "Shadowing", icon: Mic2 },
    { id: "srs", label: "SRS", icon: Brain },
    { id: "journey", label: "Roadmap", icon: MapPinned },
    { id: "stream", label: "Engine", icon: Library },
    { id: "input", label: "CI+1 Input", icon: BookOpen },
    { id: "articles", label: "Stories", icon: Layers3 },
    { id: "authoring", label: "Authoring", icon: PlusCircle },
    { id: "settings", label: "Settings", icon: Settings2 }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">中</div>
        <div>
          <strong>Eventually Fluent</strong>
          <span>Mandarin</span>
        </div>
      </div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button className={view === item.id ? "nav-item active" : "nav-item"} key={item.id} onClick={() => onViewChange(item.id)}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function LearnerControls({ state, setState, maxDay }: { state: LearnerState; setState: SetState<LearnerState>; maxDay: number }) {
  return (
    <div className="learner-controls">
      <Settings2 aria-hidden="true" />
      <label>
        Day
        <input
          type="number"
          min={1}
          max={maxDay}
          step={1}
          value={state.currentDay}
          onChange={(event) => setState((current) => nextDayState(current, Number(event.target.value), maxDay))}
        />
      </label>
    </div>
  );
}

function DashboardView({
  data,
  state,
  setState,
  currentDay,
  todaysShadowItems,
  dueSrsLines,
  onStartShadowing,
  onOpenSrs,
  onOpenRoadmap
}: {
  data: AppData;
  state: LearnerState;
  setState: SetState<LearnerState>;
  currentDay: DailyShadowScheduleDay;
  todaysShadowItems: ShadowCurriculumItem[];
  dueSrsLines: LineSource[];
  onStartShadowing: () => void;
  onOpenSrs: () => void;
  onOpenRoadmap: () => void;
}) {
  const completedToday = currentDay.sessionItemIds.filter((id) => state.completedShadowSentenceIds.includes(id)).length;
  const progressPercent = Math.round((state.currentDay / data.dailyShadowSchedule.totalDays) * 100);
  const unlockedStories = data.curriculumRoadmap.storyUnlocks.filter((story) => story.unlockDay <= state.currentDay);
  const activeWindow = `${currentDay.activeWindowStartDay}-${currentDay.activeWindowEndDay}`;

  return (
    <section className="today-layout">
      <div className="today-hero">
        <div>
          <span className="tier-label">Static 10k path</span>
          <h2>Day {state.currentDay.toLocaleString()} shadowing</h2>
          <p>{currentDay.newCount} new lines, {currentDay.reviewCount} review lines, rolling window days {activeWindow}. Default completion is about {data.dailyShadowSchedule.defaultCompletionYears} years.</p>
        </div>
        <div className="today-progress">
          <strong>{progressPercent}%</strong>
          <span>{state.currentDay} / {data.dailyShadowSchedule.totalDays} days</span>
        </div>
      </div>

      <div className="today-actions">
        <button className="primary-action" onClick={onStartShadowing}>
          <Play aria-hidden="true" />
          <span>Start today's shadowing</span>
        </button>
        <button className="secondary-action" onClick={onOpenSrs}>
          <Brain aria-hidden="true" />
          <span>{state.vacationMode ? "SRS paused" : `${dueSrsLines.length} SRS due`}</span>
        </button>
        <button className="secondary-action" onClick={onOpenRoadmap}>
          <MapPinned aria-hidden="true" />
          <span>View roadmap</span>
        </button>
      </div>

      <div className="engine-metrics">
        <Metric label="Today complete" value={`${completedToday}/${currentDay.sessionCount}`} />
        <Metric label="New cards" value={data.srsDailyPlan.days[state.currentDay - 1]?.newCardItemIds.length ?? 0} />
        <Metric label="Stories unlocked" value={unlockedStories.length} />
        <Metric label="Course items" value={data.dailyShadowSchedule.targetItemCount.toLocaleString()} />
      </div>

      <div className="today-grid">
        <section className="engine-card today-card">
          <div className="engine-card-title">
            <Mic2 aria-hidden="true" />
            <h3>Today's first lines</h3>
          </div>
          {todaysShadowItems.slice(0, 10).map((item) => (
            <div className="stream-line" key={item.id}>
              <div>
                <strong>{item.simplified}</strong>
                <span>{item.pinyin ?? item.english}</span>
              </div>
              <small>{item.lineStatus === "accepted-review" ? "ready" : item.lineStatus}</small>
            </div>
          ))}
        </section>

        <section className="engine-card today-card">
          <div className="engine-card-title">
            <Layers3 aria-hidden="true" />
            <h3>Unlocked stories</h3>
          </div>
          {unlockedStories.slice(-6).map((story) => (
            <div className="queue-line" key={story.storyId}>
              <strong>{story.title}</strong>
              <span>unlocked day {story.unlockDay}</span>
            </div>
          ))}
          {unlockedStories.length === 0 && <p className="locked-note">Stories unlock from the existing curriculum thresholds as the path progresses.</p>}
        </section>
      </div>
    </section>
  );
}

function EngineOverview({ data, knownWordCount }: { data: AppData; knownWordCount: number }) {
  const nextQueueItems = data.ciCurationQueue.slice(0, 6);
  const sampleStream = data.sentenceStream.slice(0, 5);
  const partialSteps = data.ciPipelineContract.steps.filter((step) => step.status !== "implemented");
  const sourceModes = data.sourceListImportAudit.sourceLists.map((source) => `${source.source.replace("_FREQUENCY", "")}: ${source.importMode}`);

  return (
    <section className="engine-panel" aria-label="10k CI engine state">
      <div className="section-title-row">
        <div>
          <h2>10k CI+1 engine</h2>
          <p>Source-backed acquisition path first. Lesson packs, shadowing, articles, and SRS consume this stream.</p>
        </div>
        <div className="srs-count">
          <Gauge aria-hidden="true" />
          <strong>{Math.round((knownWordCount / data.acquisitionPath.targetVocabularyCount) * 100)}%</strong>
          <span>journey</span>
        </div>
      </div>

      <div className="engine-metrics">
        <Metric label="Path candidates" value={data.acquisitionPath.currentCandidateCount.toLocaleString()} />
        <Metric label="CI stream lines" value={data.sentenceStream.length} />
        <Metric label="Need curation" value={data.ciCoverageReport.targetsNeedingCuration.toLocaleString()} />
        <Metric label="Authorable now" value={data.authorableCiCurationQueue.length.toLocaleString()} />
        <Metric label="Exposure deficit" value={data.ciCoverageReport.totalExposureDeficit.toLocaleString()} />
      </div>

      <div className="engine-grid">
        <div className="engine-card">
          <div className="engine-card-title">
            <Library aria-hidden="true" />
            <h3>Current CI stream</h3>
          </div>
          {sampleStream.map((item) => (
            <div className="stream-line" key={item.id}>
              <div>
                <strong>{item.simplified}</strong>
                <span>{item.pinyin}</span>
              </div>
              <small>+{item.newWordIds.length} at {item.knownWordThreshold.toLocaleString()}</small>
            </div>
          ))}
        </div>

        <div className="engine-card">
          <div className="engine-card-title">
            <FileCheck2 aria-hidden="true" />
            <h3>Next authoring targets</h3>
          </div>
          {nextQueueItems.map((item) => (
            <div className="queue-line" key={item.id}>
              <strong>{item.wordIndex.toLocaleString()}. {item.simplified}</strong>
              <span>{item.pinyin ?? "no pinyin"} · {item.priority} · {item.exposureDeficit} lines</span>
            </div>
          ))}
        </div>

        <div className="engine-card">
          <div className="engine-card-title">
            <CheckCircle2 aria-hidden="true" />
            <h3>Pipeline gates</h3>
          </div>
          <div className="gate-row">
            <span>Authored intake</span>
            <strong>{data.authoredCiValidationReport.acceptedCount} accepted / {data.authoredCiValidationReport.rejectedCount} rejected</strong>
          </div>
          <div className="gate-row">
            <span>Review-only lines</span>
            <strong>{data.sentenceStreamReport.reviewOnlyCount}</strong>
          </div>
          <div className="gate-row">
            <span>Blocked CI lines</span>
            <strong>{data.sentenceStreamReport.blockedCount}</strong>
          </div>
          <div className="gate-row">
            <span>Partial steps</span>
            <strong>{partialSteps.length}</strong>
          </div>
        </div>

        <div className="engine-card">
          <div className="engine-card-title">
            <Layers3 aria-hidden="true" />
            <h3>Source status</h3>
          </div>
          <p className="source-modes">{sourceModes.join(" · ")}</p>
          {data.sourceListImportAudit.warnings.map((warning) => (
            <p className="warning-line" key={warning}>{warning}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthoringView({
  packets,
  validationReport
}: {
  packets: CompactCiAuthoringPacket[];
  validationReport: AuthoredCiValidationReport;
}) {
  const [packetIndex, setPacketIndex] = useState(0);
  const packet = packets[packetIndex] ?? packets[0];
  const vocabularyById = useMemo(() => new Map(packet?.vocabularyPool.map((word) => [word.vocabularyId, word]) ?? []), [packet]);

  if (!packet) {
    return (
      <section className="engine-panel">
        <h2>No authoring packets</h2>
      </section>
    );
  }

  const slots = packet.items.flatMap((item) => item.sentenceSlots.map((slot) => ({ item, slot }))).slice(0, 24);

  return (
    <section className="authoring-layout">
      <div className="section-title-row">
        <div>
          <h2>CI+1 authoring queue</h2>
          <p>Write natural Mandarin against these slots, then add accepted lines to source-lists/authored-ci-sentences.json.</p>
        </div>
        <div className="srs-count">
          <FileCheck2 aria-hidden="true" />
          <strong>{validationReport.acceptedCount}</strong>
          <span>accepted</span>
        </div>
      </div>

      <div className="packet-tabs" aria-label="Authoring packet selector">
        {packets.map((candidate, index) => (
          <button className={index === packetIndex ? "mode-button active" : "mode-button"} key={candidate.id} onClick={() => setPacketIndex(index)}>
            <span>{candidate.targetWordStart}-{candidate.targetWordEnd}</span>
          </button>
        ))}
      </div>

      <div className="authoring-grid">
        {slots.map(({ item, slot }) => {
          const required = vocabularyById.get(slot.requiredNewWordId);
          const known = slot.allowedKnownVocabularyIds
            .map((id) => vocabularyById.get(id))
            .filter((word): word is CompactCiAuthoringVocabularyItem => Boolean(word))
            .slice(-12);

          return (
            <article className="slot-card" key={slot.id}>
              <div className="slot-header">
                <span>{slot.mode}</span>
                <strong>{item.wordIndex}. {required?.simplified ?? slot.requiredNewWordId}</strong>
              </div>
              <p className="slot-pinyin">{required?.pinyin ?? "No pinyin"} · {slot.functionHint}</p>
              <div className="known-strip">
                {known.map((word) => (
                  <span key={word.vocabularyId}>{word.simplified}</span>
                ))}
              </div>
              <code>{slot.id}</code>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PackRow({
  pack,
  selected,
  completed,
  unlocked,
  onSelect
}: {
  pack: Pack;
  selected: boolean;
  completed: boolean;
  unlocked: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={selected ? "pack-row selected" : "pack-row"} onClick={onSelect}>
      <div className="pack-row-main">
        <span className="tier-label">{pack.tierId.replace("-tier", " words")}</span>
        <h2>{pack.title}</h2>
        <p>{pack.summary}</p>
        <div className="tag-row">
          {pack.themeTags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="pack-status">
        {completed ? <CheckCircle2 aria-label="Completed" /> : unlocked ? <Unlock aria-label="Unlocked" /> : <Lock aria-label="Locked" />}
        <ChevronRight aria-hidden="true" />
      </div>
    </button>
  );
}

function PackDetail({
  pack,
  unlocked,
  completed,
  onComplete,
  onStudyInput,
  onShadow
}: {
  pack: Pack;
  unlocked: boolean;
  completed: boolean;
  onComplete: () => void;
  onStudyInput: () => void;
  onShadow: () => void;
}) {
  const reading = pack.readings[0];

  return (
    <section className="detail-panel" aria-label="Selected CI pack">
      <div className="detail-header">
        <div>
          <span className={unlocked ? "unlock-pill unlocked" : "unlock-pill"}>{unlocked ? "Unlocked" : `${pack.unlockAtWordCount} words`}</span>
          <h2>{pack.title}</h2>
          <p>{pack.summary}</p>
        </div>
        <button className="icon-button" onClick={onComplete} title={completed ? "Mark unfinished" : "Mark finished"}>
          <CheckCircle2 aria-hidden="true" />
        </button>
      </div>

      <div className="metric-row">
        <Metric label="CI coverage" value={`${Math.round((reading?.knownVocabularyCoverage ?? 0) * 100)}%`} />
        <Metric label="Input lines" value={reading?.sentences.length ?? 0} />
        <Metric label="Shadow lines" value={pack.dialogues[0]?.turns.length ?? 0} />
      </div>

      <div className="sentence-stack">
        {pack.sentences.slice(0, 6).map((sentence) => (
          <article className="sentence-card" key={sentence.id}>
            <div>
              <p className="hanzi">{sentence.simplified}</p>
              <p className="pinyin">{sentence.pinyin}</p>
              <p className="english">{sentence.english}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="dialogue-preview">
        <h3>{pack.dialogues[0]?.title ?? "Dialogue"}</h3>
        {pack.dialogues[0]?.turns.slice(0, 4).map((turn, index) => (
          <div className="turn-row" key={`${turn.speaker}-${index}`}>
            <span>{turn.speaker}</span>
            <p>{turn.simplified}</p>
          </div>
        ))}
      </div>

      <div className="action-row">
        <button className="primary-action" onClick={onStudyInput} disabled={!unlocked}>
          <BookOpen aria-hidden="true" />
          <span>Start CI input</span>
        </button>
        <button className="secondary-action full" onClick={onShadow} disabled={!unlocked}>
          <Mic2 aria-hidden="true" />
          <span>Shadow lines</span>
        </button>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function InputView({
  pack,
  reading,
  activeLine,
  setActiveLine,
  unlocked,
  state,
  setState
}: {
  pack: Pack;
  reading: Reading | null;
  activeLine: number;
  setActiveLine: (line: number) => void;
  unlocked: boolean;
  state: LearnerState;
  setState: SetState<LearnerState>;
}) {
  if (!reading) return null;
  const line = reading.sentences[activeLine] ?? reading.sentences[0];
  const lineKey = `${pack.id}:reading:${activeLine}`;
  const inSrs = Boolean(state.srsCards[lineKey]);

  return (
    <section className="reading-layout">
      <div className="reading-main">
        <span className="tier-label">{pack.title}</span>
        <h2>{reading.title}</h2>
        <div className="reading-card">
          <p className="reading-hanzi">{line.simplified}</p>
          {state.showPinyin && <p className="reading-pinyin">{line.pinyin}</p>}
          {state.showEnglish && <p className="reading-english">{line.english}</p>}
        </div>
        <div className="reading-controls">
          <button onClick={() => setActiveLine(Math.max(0, activeLine - 1))}>Previous</button>
          <button className={inSrs ? "listen-button active" : "listen-button"} onClick={() => addLineToSrs(lineKey, pack, line, setState)}>
            <Brain aria-hidden="true" />
            <span>{inSrs ? "In SRS" : "Add to SRS"}</span>
          </button>
          <span>{activeLine + 1} / {reading.sentences.length}</span>
          <button onClick={() => setActiveLine(Math.min(reading.sentences.length - 1, activeLine + 1))}>Next</button>
        </div>
      </div>
      <aside className="reading-sidebar">
        <h3>CI lines</h3>
        {reading.sentences.map((sentence, index) => (
          <button className={index === activeLine ? "line-button active" : "line-button"} key={`${sentence.simplified}-${index}`} onClick={() => setActiveLine(index)}>
            <span>{sentence.simplified}</span>
            <small>{sentence.newWordIds.length ? `+${sentence.newWordIds.length}` : "known"}</small>
          </button>
        ))}
        <div className="coverage-box">
          <Layers3 aria-hidden="true" />
          <strong>{Math.round(reading.knownVocabularyCoverage * 100)}%</strong>
          <span>{reading.ciPlusOneValid ? "CI+1 valid" : "Needs CI+1 fix"}</span>
        </div>
        <DisplayToggles state={state} setState={setState} />
        {!unlocked && <p className="locked-note">Increase known words to unlock this pack.</p>}
      </aside>
    </section>
  );
}

function ShadowingView({
  pack,
  mode,
  setMode,
  activeLine,
  setActiveLine,
  state,
  setState,
  unlocked
}: {
  pack: Pack;
  mode: "reading" | "dialogue";
  setMode: (mode: "reading" | "dialogue") => void;
  activeLine: number;
  setActiveLine: (line: number) => void;
  state: LearnerState;
  setState: SetState<LearnerState>;
  unlocked: boolean;
}) {
  const lines = mode === "reading" ? pack.readings[0]?.sentences ?? [] : pack.dialogues[0]?.turns ?? [];
  const line = lines[activeLine] ?? lines[0];
  const lineKey = `${pack.id}:${mode}:${activeLine}`;
  const shadowed = state.shadowedLineKeys.includes(lineKey);
  const inSrs = Boolean(state.srsCards[lineKey]);

  if (!line) return null;

  return (
    <section className="shadowing-layout">
      <div className="shadowing-main">
        <div className="mode-row">
          <button className={mode === "reading" ? "mode-button active" : "mode-button"} onClick={() => { setMode("reading"); setActiveLine(0); }}>
            <BookOpen aria-hidden="true" />
            <span>Reading lines</span>
          </button>
          <button className={mode === "dialogue" ? "mode-button active" : "mode-button"} onClick={() => { setMode("dialogue"); setActiveLine(0); }}>
            <Captions aria-hidden="true" />
            <span>Dialogue turns</span>
          </button>
        </div>

        <div className="shadow-card">
          <p className="shadow-hanzi">{line.simplified}</p>
          {state.showPinyin && <p className="shadow-pinyin">{line.pinyin}</p>}
          {state.showEnglish && <p className="shadow-english">{line.english}</p>}
        </div>

        <div className="shadow-controls">
          <button onClick={() => setActiveLine(Math.max(0, activeLine - 1))}>Previous</button>
          <button className="listen-button" onClick={() => speakMandarin(line.simplified)}>
            <Volume2 aria-hidden="true" />
            <span>Listen</span>
          </button>
          <button
            className={shadowed ? "listen-button active" : "listen-button"}
            onClick={() => toggleListValue("shadowedLineKeys", lineKey, setState)}
          >
            <Repeat2 aria-hidden="true" />
            <span>{shadowed ? "Shadowed" : "Mark shadowed"}</span>
          </button>
          <button className={inSrs ? "listen-button active" : "listen-button"} onClick={() => addLineToSrs(lineKey, pack, line, setState)}>
            <Brain aria-hidden="true" />
            <span>{inSrs ? "In SRS" : "Add SRS"}</span>
          </button>
          <button onClick={() => setActiveLine(Math.min(lines.length - 1, activeLine + 1))}>Next</button>
        </div>
      </div>

      <aside className="reading-sidebar">
        <h3>Shadowing sequence</h3>
        {lines.map((item, index) => {
          const key = `${pack.id}:${mode}:${index}`;
          return (
            <button className={index === activeLine ? "line-button active" : "line-button"} key={key} onClick={() => setActiveLine(index)}>
              <span>{item.simplified}</span>
              <small>{state.shadowedLineKeys.includes(key) ? "done" : "repeat"}</small>
            </button>
          );
        })}
        <DisplayToggles state={state} setState={setState} />
        {!unlocked && <p className="locked-note">Increase known words to unlock this pack.</p>}
      </aside>
    </section>
  );
}

function DailyShadowingView({
  day,
  items,
  activeIndex,
  setActiveIndex,
  state,
  setState,
  sessionPlan
}: {
  day: DailyShadowScheduleDay | null;
  items: ShadowCurriculumItem[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  state: LearnerState;
  setState: SetState<LearnerState>;
  sessionPlan: ShadowSessionPlan;
}) {
  const [playing, setPlaying] = useState(false);
  const activeItem = items[activeIndex] ?? items[0];
  const completed = activeItem ? state.completedShadowSentenceIds.includes(activeItem.id) : false;
  const inSrs = activeItem ? Boolean(state.srsCards[activeItem.id]) : false;

  useEffect(() => {
    if (!playing || !activeItem) return;
    speakMandarin(activeItem.simplified);
    const seconds = sessionPlan.secondsPerListenPass + sessionPlan.secondsPerShadowPass;
    const timeout = window.setTimeout(() => {
      setState((current) => markShadowItemComplete(current, activeItem.id, day?.day ?? current.currentDay));
      if (activeIndex < items.length - 1 && currentAutoAdvance(state)) {
        setActiveIndex(activeIndex + 1);
      } else {
        setPlaying(false);
      }
    }, seconds * 1000);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, activeItem, day?.day, items.length, playing, sessionPlan.secondsPerListenPass, sessionPlan.secondsPerShadowPass, setActiveIndex, setState, state]);

  if (!day || !activeItem) {
    return (
      <section className="shadowing-layout">
        <div className="shadowing-main empty-srs">
          <Mic2 aria-hidden="true" />
          <h2>No shadowing day loaded</h2>
          <p>The static schedule should contain every day before learner progress reaches it.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="shadowing-layout">
      <div className="shadowing-main daily-shadow-main">
        <div className="section-title-row">
          <div>
            <h2>Day {day.day} shadowing</h2>
            <p>{day.newCount} new · {day.reviewCount} review · active window {day.activeWindowStartDay}-{day.activeWindowEndDay}</p>
          </div>
          <div className="srs-count">
            <Mic2 aria-hidden="true" />
            <strong>{activeIndex + 1}</strong>
            <span>of {items.length}</span>
          </div>
        </div>

        <div className={playing ? "shadow-card playing" : "shadow-card"}>
          <p className="shadow-hanzi">{activeItem.simplified}</p>
          {state.shadowDisplaySettings.showPinyin && <p className="shadow-pinyin">{activeItem.pinyin ?? "No pinyin available"}</p>}
          {state.shadowDisplaySettings.showEnglish && <p className="shadow-english">{activeItem.english}</p>}
          <div className="shadow-meta-row">
            <span>{activeItem.displayMode === "sentence" ? "sentence" : "target placeholder"}</span>
            <span>{activeItem.lineStatus}</span>
            <span>rank {activeItem.targetCommunicationPathRank.toLocaleString()}</span>
          </div>
        </div>

        <div className="shadow-controls">
          <button onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}>Previous</button>
          <button className={playing ? "listen-button active" : "listen-button"} onClick={() => setPlaying((value) => !value)}>
            <Volume2 aria-hidden="true" />
            <span>{playing ? "Pause" : "Play auto"}</span>
          </button>
          <button className="listen-button" onClick={() => speakMandarin(activeItem.simplified)}>
            <Repeat2 aria-hidden="true" />
            <span>Replay</span>
          </button>
          <button className={completed ? "listen-button active" : "listen-button"} onClick={() => setState((current) => markShadowItemComplete(current, activeItem.id, day.day))}>
            <CheckCircle2 aria-hidden="true" />
            <span>{completed ? "Complete" : "Mark complete"}</span>
          </button>
          <button className={inSrs ? "listen-button active" : "listen-button"} onClick={() => addShadowItemToSrs(activeItem, setState)}>
            <Brain aria-hidden="true" />
            <span>{inSrs ? "In SRS" : "Add SRS"}</span>
          </button>
          <button onClick={() => setActiveIndex(Math.min(items.length - 1, activeIndex + 1))}>Next</button>
        </div>
      </div>

      <aside className="reading-sidebar">
        <h3>Day sequence</h3>
        {items.map((item, index) => (
          <button className={index === activeIndex ? "line-button active" : "line-button"} key={item.id} onClick={() => setActiveIndex(index)}>
            <span>{item.simplified}</span>
            <small>{state.completedShadowSentenceIds.includes(item.id) ? "done" : item.day === day.day ? "new" : `day ${item.day}`}</small>
          </button>
        ))}
        <ShadowDisplayToggles state={state} setState={setState} />
      </aside>
    </section>
  );
}

function DisplayToggles({ state, setState }: { state: LearnerState; setState: SetState<LearnerState> }) {
  return (
    <div className="toggle-box">
      <label>
        <input
          type="checkbox"
          checked={state.showPinyin}
          onChange={(event) => setState((current) => ({ ...current, showPinyin: event.target.checked }))}
        />
        Pinyin
      </label>
      <label>
        <input
          type="checkbox"
          checked={state.showEnglish}
          onChange={(event) => setState((current) => ({ ...current, showEnglish: event.target.checked }))}
        />
        English
      </label>
    </div>
  );
}

function ShadowDisplayToggles({ state, setState }: { state: LearnerState; setState: SetState<LearnerState> }) {
  return (
    <div className="toggle-box">
      <label>
        <input
          type="checkbox"
          checked={state.shadowDisplaySettings.showPinyin}
          onChange={(event) => setState((current) => ({ ...current, shadowDisplaySettings: { ...current.shadowDisplaySettings, showPinyin: event.target.checked } }))}
        />
        Pinyin
      </label>
      <label>
        <input
          type="checkbox"
          checked={state.shadowDisplaySettings.showEnglish}
          onChange={(event) => setState((current) => ({ ...current, shadowDisplaySettings: { ...current.shadowDisplaySettings, showEnglish: event.target.checked } }))}
        />
        English
      </label>
      <label>
        <input
          type="checkbox"
          checked={state.shadowDisplaySettings.autoAdvance}
          onChange={(event) => setState((current) => ({ ...current, shadowDisplaySettings: { ...current.shadowDisplaySettings, autoAdvance: event.target.checked } }))}
        />
        Auto advance
      </label>
    </div>
  );
}

function SrsView({
  state,
  setState,
  lineSources,
  dueLines,
  srsDailyPlan
}: {
  state: LearnerState;
  setState: SetState<LearnerState>;
  lineSources: LineSource[];
  dueLines: LineSource[];
  srsDailyPlan: SrsDailyPlan;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeLine = dueLines[activeIndex] ?? lineSources.find((line) => state.srsCards[line.lineKey]) ?? null;
  const activeCard = activeLine ? state.srsCards[activeLine.lineKey] : undefined;
  const totalCards = Object.keys(state.srsCards).length;

  return (
    <section className="srs-layout">
      <div className="srs-main">
        <div className="section-title-row">
          <div>
            <h2>SRS retention</h2>
            <p>{srsDailyPlan.maxNewCardsPerDay} new cards per day. Vacation mode pauses due pressure without deleting progress.</p>
          </div>
          <div className="srs-count">
            <CalendarDays aria-hidden="true" />
            <strong>{dueLines.length}</strong>
            <span>{state.vacationMode ? "paused" : "due"}</span>
          </div>
        </div>
        <button className={state.vacationMode ? "listen-button active vacation-toggle" : "listen-button vacation-toggle"} onClick={() => setState((current) => ({ ...current, vacationMode: !current.vacationMode }))}>
          <CalendarDays aria-hidden="true" />
          <span>{state.vacationMode ? "Vacation mode on" : "Turn on vacation mode"}</span>
        </button>

        {activeLine && activeCard ? (
          <>
            <div className="srs-card">
              <span>{activeLine.packTitle}</span>
              <p className="srs-hanzi">{activeLine.simplified}</p>
              <p className="srs-pinyin">{activeLine.pinyin}</p>
              <p className="srs-english">{activeLine.english}</p>
            </div>
            <div className="srs-actions">
              <button onClick={() => gradeSrsCard(activeLine.lineKey, "again", setState)}>Again</button>
              <button onClick={() => gradeSrsCard(activeLine.lineKey, "good", setState)}>Good</button>
              <button onClick={() => gradeSrsCard(activeLine.lineKey, "easy", setState)}>Easy</button>
            </div>
            <div className="srs-meta">
              <Metric label="Reps" value={activeCard.reps} />
              <Metric label="Interval" value={`${activeCard.intervalDays}d`} />
              <Metric label="Ease" value={activeCard.ease.toFixed(2)} />
            </div>
          </>
        ) : (
          <div className="empty-srs">
            <Brain aria-hidden="true" />
            <h2>No SRS cards yet</h2>
            <p>Add lines from CI Input or Shadowing. SRS is the retention layer, not the main acquisition source.</p>
          </div>
        )}
      </div>

      <aside className="reading-sidebar">
        <h3>SRS queue</h3>
        {(dueLines.length > 0 ? dueLines : lineSources.filter((line) => state.srsCards[line.lineKey])).map((line, index) => (
          <button className={index === activeIndex ? "line-button active" : "line-button"} key={line.lineKey} onClick={() => setActiveIndex(index)}>
            <span>{line.simplified}</span>
            <small>{state.srsCards[line.lineKey]?.intervalDays ?? 0}d</small>
          </button>
        ))}
        <div className="coverage-box">
          <Brain aria-hidden="true" />
          <strong>{totalCards}</strong>
          <span>active SRS cards</span>
        </div>
      </aside>
    </section>
  );
}

function ArticlesView({
  packs,
  articleUnlocks,
  knownWordCount,
  onSelectPack
}: {
  packs: Pack[];
  articleUnlocks: ArticleUnlockPolicy[];
  knownWordCount: number;
  onSelectPack: (packId: string) => void;
}) {
  const articlePacks = packs.filter((pack) => pack.readings.length > 0).sort((a, b) => a.unlockAtWordCount - b.unlockAtWordCount);

  return (
    <section className="journey-layout">
      <div className="section-title-row">
        <div>
          <h2>Unlocked articles</h2>
          <p>Articles unlock only when vocabulary coverage can stay CI+1. The sentence stream remains the primary path.</p>
        </div>
        <div className="srs-count">
          <Layers3 aria-hidden="true" />
          <strong>{articlePacks.filter((pack) => pack.unlockAtWordCount <= knownWordCount).length}</strong>
          <span>available</span>
        </div>
      </div>

      <div className="journey-track" aria-label="Article unlock thresholds">
        {articleUnlocks.map((unlock) => (
          <div className={knownWordCount >= unlock.minKnownWords ? "milestone reached" : "milestone"} key={unlock.id}>
            <span>{unlock.minKnownWords.toLocaleString()}</span>
            <small>{Math.round(unlock.minKnownVocabularyCoverage * 100)}% CI</small>
          </div>
        ))}
      </div>

      <div className="pack-list article-list">
        {articlePacks.map((pack) => {
          const reading = pack.readings[0];
          const unlocked = pack.unlockAtWordCount <= knownWordCount;
          return (
            <button className={unlocked ? "pack-row" : "pack-row locked"} key={pack.id} onClick={() => unlocked && onSelectPack(pack.id)}>
              <div className="pack-row-main">
                <span className="tier-label">{pack.unlockAtWordCount.toLocaleString()} words</span>
                <h2>{reading?.title ?? pack.title}</h2>
                <p>{pack.summary}</p>
                <div className="tag-row">
                  <span>{Math.round((reading?.knownVocabularyCoverage ?? 0) * 100)}% known</span>
                  <span>{reading?.ciPlusOneValid ? "CI+1 valid" : "locked"}</span>
                </div>
              </div>
              <div className="pack-status">
                {unlocked ? <Unlock aria-label="Unlocked" /> : <Lock aria-label="Locked" />}
                <ChevronRight aria-hidden="true" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function JourneyView({
  packs,
  unlockedPacks,
  knownLexicon,
  state,
  productPolicy,
  acquisitionPath,
  roadmap
}: {
  packs: Pack[];
  unlockedPacks: Pack[];
  knownLexicon: LexiconEntry[];
  state: LearnerState;
  productPolicy: ProductPolicy;
  acquisitionPath: AcquisitionVocabPath;
  roadmap: CurriculumRoadmap;
}) {
  const nextPack = packs.find((pack) => pack.unlockAtWordCount > state.knownWordCount);
  const milestones = roadmap.stages.filter((stage) => stage.minKnownWords > 0);
  const progressTo10k = Math.min(100, Math.round((state.knownWordCount / acquisitionPath.targetVocabularyCount) * 100));
  const unlockedStories = roadmap.storyUnlocks.filter((story) => story.unlockDay <= state.currentDay);

  return (
    <section className="journey-layout">
      <div className="journey-hero">
        <MapPinned aria-hidden="true" />
        <div>
          <h2>{state.knownWordCount.toLocaleString()} / {roadmap.targetVocabularyCount.toLocaleString()} path items</h2>
          <p>{roadmap.honestPromise}</p>
        </div>
        <strong>{progressTo10k}%</strong>
      </div>
      <div className="journey-track" aria-label="10k journey milestones">
        {milestones.map((milestone) => (
          <div className={state.knownWordCount >= milestone.minKnownWords ? "milestone reached" : "milestone"} key={milestone.id}>
            <span>{milestone.minKnownWords.toLocaleString()}</span>
            <small>{milestone.label}</small>
          </div>
        ))}
      </div>
      <div className="progress-grid">
        <Metric label="Unlocked packs" value={unlockedPacks.length} />
        <Metric label="Completed packs" value={state.completedPackIds.length} />
        <Metric label="Shadowed lines" value={state.completedShadowSentenceIds.length} />
      </div>
      <div className="progress-grid">
        <Metric label="SRS cards" value={Object.keys(state.srsCards).length} />
        <Metric label="Known vocab loaded" value={knownLexicon.length} />
        <Metric label="Stories unlocked" value={unlockedStories.length} />
      </div>
      <section className="lexicon-panel">
        <h3>Story unlocks</h3>
        <div className="story-unlock-list">
          {roadmap.storyUnlocks.map((story) => (
            <div className={story.unlockDay <= state.currentDay ? "story-unlock reached" : "story-unlock"} key={story.storyId}>
              <strong>{story.title}</strong>
              <span>Day {story.unlockDay} · {story.unlockAtWordCount.toLocaleString()} known items</span>
            </div>
          ))}
        </div>
      </section>
      <section className="lexicon-panel">
        <h3>Current lexicon slice</h3>
        <div className="lexicon-grid">
          {knownLexicon.slice(0, 60).map((entry) => (
            <div className="lexicon-token" key={entry.id}>
              <strong>{entry.simplified}</strong>
              <span>{entry.pinyin}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function SettingsView({ state, setState, maxDay }: { state: LearnerState; setState: SetState<LearnerState>; maxDay: number }) {
  return (
    <section className="journey-layout">
      <div className="section-title-row">
        <div>
          <h2>Settings</h2>
          <p>Local-first progress controls. Login and account sync come later.</p>
        </div>
      </div>
      <div className="settings-grid">
        <label className="settings-card">
          <span>Current day</span>
          <input type="number" min={1} max={maxDay} value={state.currentDay} onChange={(event) => setState((current) => nextDayState(current, Number(event.target.value), maxDay))} />
        </label>
        <label className="settings-card checkbox-card">
          <input type="checkbox" checked={state.vacationMode} onChange={(event) => setState((current) => ({ ...current, vacationMode: event.target.checked }))} />
          <span>Vacation mode pauses SRS due pressure</span>
        </label>
        <label className="settings-card checkbox-card">
          <input type="checkbox" checked={state.shadowDisplaySettings.showPinyin} onChange={(event) => setState((current) => ({ ...current, shadowDisplaySettings: { ...current.shadowDisplaySettings, showPinyin: event.target.checked } }))} />
          <span>Show pinyin while shadowing</span>
        </label>
        <label className="settings-card checkbox-card">
          <input type="checkbox" checked={state.shadowDisplaySettings.showEnglish} onChange={(event) => setState((current) => ({ ...current, shadowDisplaySettings: { ...current.shadowDisplaySettings, showEnglish: event.target.checked } }))} />
          <span>Show English while shadowing</span>
        </label>
      </div>
    </section>
  );
}

type SetState<T> = (value: T | ((current: T) => T)) => void;

function usePersistentState(): [LearnerState, SetState<LearnerState>] {
  const [state, setState] = useState<LearnerState>(() => {
    const stored = window.localStorage.getItem(stateKey);
    return stored ? normalizeLearnerState(JSON.parse(stored) as Partial<LearnerState>) : defaultState;
  });

  const updateState: SetState<LearnerState> = (value) => {
    setState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      window.localStorage.setItem(stateKey, JSON.stringify(next));
      return next;
    });
  };

  return [state, updateState];
}

function normalizeLearnerState(stored: Partial<LearnerState>): LearnerState {
  return {
    ...defaultState,
    ...stored,
    shadowDisplaySettings: {
      ...defaultState.shadowDisplaySettings,
      ...(stored.shadowDisplaySettings ?? {})
    },
    completedShadowDays: stored.completedShadowDays ?? [],
    completedShadowSentenceIds: stored.completedShadowSentenceIds ?? [],
    vacationMode: stored.vacationMode ?? false
  };
}

function nextDayState(current: LearnerState, requestedDay: number, maxDay: number): LearnerState {
  const currentDay = Math.max(1, Math.min(maxDay, Number.isFinite(requestedDay) ? Math.round(requestedDay) : current.currentDay));
  return {
    ...current,
    currentDay,
    knownWordCount: Math.min(10000, currentDay * 10)
  };
}

function toggleListValue(key: "completedPackIds" | "shadowedLineKeys", value: string, setState: SetState<LearnerState>) {
  setState((current) => {
    const currentList = current[key];
    const nextList = currentList.includes(value) ? currentList.filter((item) => item !== value) : [...currentList, value];
    return { ...current, [key]: nextList };
  });
}

function markShadowItemComplete(current: LearnerState, itemId: string, day: number): LearnerState {
  const completedShadowSentenceIds = current.completedShadowSentenceIds.includes(itemId)
    ? current.completedShadowSentenceIds
    : [...current.completedShadowSentenceIds, itemId];
  const completedShadowDays = current.completedShadowDays.includes(day)
    ? current.completedShadowDays
    : [...current.completedShadowDays, day].sort((a, b) => a - b);
  return {
    ...current,
    completedShadowSentenceIds,
    completedShadowDays,
    lastSessionAt: new Date().toISOString()
  };
}

function currentAutoAdvance(state: LearnerState): boolean {
  return state.shadowDisplaySettings.autoAdvance;
}

function buildLineSources(packs: Pack[]): LineSource[] {
  return packs.flatMap((pack) => [
    ...pack.sentences.map((sentence, index) => ({
      lineKey: `${pack.id}:sentence:${index}`,
      source: "sentence" as const,
      packId: pack.id,
      packTitle: pack.title,
      simplified: sentence.simplified,
      pinyin: sentence.pinyin,
      english: sentence.english,
      vocabularyIds: sentence.vocabularyIds
    })),
    ...(pack.readings[0]?.sentences ?? []).map((line, index) => ({
      lineKey: `${pack.id}:reading:${index}`,
      source: "reading" as const,
      packId: pack.id,
      packTitle: pack.title,
      simplified: line.simplified,
      pinyin: line.pinyin,
      english: line.english,
      vocabularyIds: [...line.vocabularyIds, ...line.newWordIds]
    })),
    ...(pack.dialogues[0]?.turns ?? []).map((turn, index) => ({
      lineKey: `${pack.id}:dialogue:${index}`,
      source: "dialogue" as const,
      packId: pack.id,
      packTitle: pack.title,
      simplified: turn.simplified,
      pinyin: turn.pinyin,
      english: turn.english,
      vocabularyIds: turn.vocabularyIds
    }))
  ]);
}

function buildShadowLineSources(schedule: DailyShadowSchedule, completedIds: string[]): LineSource[] {
  const completed = new Set(completedIds);
  return schedule.items
    .filter((item) => completed.has(item.id))
    .map((item) => ({
      lineKey: item.id,
      source: "sentence" as const,
      packId: `shadow-day-${item.day}`,
      packTitle: `Shadow day ${item.day}`,
      simplified: item.simplified,
      pinyin: item.pinyin ?? "",
      english: item.english,
      vocabularyIds: [item.conceptId]
    }));
}

function getDueSrsLines(state: LearnerState, lineSources: LineSource[]): LineSource[] {
  if (state.vacationMode) return [];
  const lineByKey = new Map(lineSources.map((line) => [line.lineKey, line]));
  const now = Date.now();
  return Object.values(state.srsCards)
    .filter((card) => Date.parse(card.dueAt) <= now)
    .map((card) => lineByKey.get(card.lineKey))
    .filter((line): line is LineSource => Boolean(line));
}

function addShadowItemToSrs(item: ShadowCurriculumItem, setState: SetState<LearnerState>): void {
  setState((current) => {
    if (!current.completedShadowSentenceIds.includes(item.id)) return current;
    if (current.srsCards[item.id]) return current;
    return {
      ...current,
      srsCards: {
        ...current.srsCards,
        [item.id]: {
          lineKey: item.id,
          intervalDays: 0,
          ease: 2.3,
          dueAt: new Date().toISOString(),
          reps: 0,
          lapses: 0
        }
      }
    };
  });
}

function addLineToSrs(
  lineKey: string,
  pack: Pack,
  line: Pick<LineSource, "simplified" | "pinyin" | "english" | "vocabularyIds">,
  setState: SetState<LearnerState>
): void {
  setState((current) => {
    if (current.srsCards[lineKey]) return current;
    return {
      ...current,
      srsCards: {
        ...current.srsCards,
        [lineKey]: {
          lineKey,
          intervalDays: 0,
          ease: 2.3,
          dueAt: new Date().toISOString(),
          reps: 0,
          lapses: 0
        }
      }
    };
  });
  void pack;
  void line;
}

function gradeSrsCard(lineKey: string, rating: "again" | "good" | "easy", setState: SetState<LearnerState>): void {
  setState((current) => {
    const card = current.srsCards[lineKey];
    if (!card) return current;
    const nextEase = rating === "again" ? Math.max(1.3, card.ease - 0.2) : rating === "easy" ? card.ease + 0.15 : card.ease;
    const nextInterval = nextIntervalDays(card, rating, nextEase);
    return {
      ...current,
      srsCards: {
        ...current.srsCards,
        [lineKey]: {
          ...card,
          intervalDays: nextInterval,
          ease: nextEase,
          dueAt: addDays(new Date(), nextInterval).toISOString(),
          reps: card.reps + 1,
          lapses: rating === "again" ? card.lapses + 1 : card.lapses,
          lastReviewedAt: new Date().toISOString()
        }
      }
    };
  });
}

function nextIntervalDays(card: SrsCardState, rating: "again" | "good" | "easy", ease: number): number {
  if (rating === "again") return 0;
  if (card.reps === 0) return rating === "easy" ? 3 : 1;
  const multiplier = rating === "easy" ? ease + 0.6 : ease;
  return Math.max(1, Math.round(card.intervalDays * multiplier));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function loadAppData(): Promise<AppData> {
  const [
    packs,
    lockedPacks,
    lexicon,
    productPolicy,
    acquisitionPath,
    articleUnlocks,
    sentenceStream,
    sentenceStreamReport,
    ciCoverageReport,
    ciCurationQueue,
    authorableCiCurationQueue,
    ciAuthoringPackets,
    ciPipelineContract,
    sourceListImportAudit,
    authoredCiValidationReport,
    dailyShadowSchedule,
    shadowSessionPlan,
    srsDailyPlan,
    curriculumRoadmap
  ] = await Promise.all([
    fetchJson<Pack[]>("/data/curriculum-packs.json"),
    fetchJson<Pack[]>("/data/locked-packs.json"),
    fetchJson<LexiconEntry[]>("/data/lexicon.json"),
    fetchJson<ProductPolicy>("/data/product-policy.json"),
    fetchJson<AcquisitionVocabPath>("/data/acquisition-vocab-path.json"),
    fetchJson<ArticleUnlockPolicy[]>("/data/article-unlocks.json"),
    fetchJson<SentenceStreamItem[]>("/data/sentence-stream.json"),
    fetchJson<SentenceStreamBuildReport>("/data/sentence-stream-build-report.json"),
    fetchJson<CiCoverageReport>("/data/ci-coverage-report.json"),
    fetchJson<CiCurationQueueItem[]>("/data/ci-curation-queue.json"),
    fetchJson<CiCurationQueueItem[]>("/data/ci-authorable-curation-queue.json"),
    fetchJson<CompactCiAuthoringPacket[]>("/data/ci-authoring-packets.compact.json"),
    fetchJson<CiPipelineContract>("/data/ci-pipeline-contract.json"),
    fetchJson<SourceListImportAudit>("/data/source-list-import-audit.json"),
    fetchJson<AuthoredCiValidationReport>("/data/authored-ci-validation-report.json"),
    fetchJson<DailyShadowSchedule>("/data/daily-shadow-schedule.json"),
    fetchJson<ShadowSessionPlan>("/data/shadow-session-plan.json"),
    fetchJson<SrsDailyPlan>("/data/srs-daily-plan.json"),
    fetchJson<CurriculumRoadmap>("/data/curriculum-roadmap.json")
  ]);
  return { packs, lockedPacks, lexicon, productPolicy, acquisitionPath, articleUnlocks, sentenceStream, sentenceStreamReport, ciCoverageReport, ciCurationQueue, authorableCiCurationQueue, ciAuthoringPackets, ciPipelineContract, sourceListImportAudit, authoredCiValidationReport, dailyShadowSchedule, shadowSessionPlan, srsDailyPlan, curriculumRoadmap };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json() as Promise<T>;
}

function speakMandarin(text: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith("zh"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

