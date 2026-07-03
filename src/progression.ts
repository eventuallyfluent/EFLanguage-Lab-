import { GeneratedSentence, IslandTag } from "./models";

export interface ProgressionTier {
  id: "seed-100" | "core-300" | "bridge-1000" | "adult-2000" | "adult-3000";
  minKnownWords: number;
  label: string;
  allowedThemes: IslandTag[];
  notes: string;
}

export const progressionTiers: ProgressionTier[] = [
  {
    id: "seed-100",
    minKnownWords: 100,
    label: "Survival beginner",
    allowedThemes: ["identity", "daily-life", "food", "drink", "school", "time", "location", "home", "social", "question", "description", "preference", "ability"],
    notes: "Short beginner-safe utterances; no adult work/health/transport burden yet."
  },
  {
    id: "core-300",
    minKnownWords: 300,
    label: "Core daily life",
    allowedThemes: ["identity", "daily-life", "food", "drink", "school", "time", "location", "home", "shopping", "social", "question", "description", "preference", "ability"],
    notes: "More daily routines and simple errands, still low-stakes and high-frequency."
  },
  {
    id: "bridge-1000",
    minKnownWords: 1000,
    label: "Practical bridge",
    allowedThemes: ["identity", "daily-life", "food", "drink", "school", "time", "location", "home", "shopping", "transport", "social", "question", "description", "preference", "ability"],
    notes: "Transport and errands can appear, but work/medical themes stay locked."
  },
  {
    id: "adult-2000",
    minKnownWords: 2000,
    label: "Adult operating life",
    allowedThemes: ["identity", "daily-life", "food", "drink", "school", "work", "shopping", "time", "location", "home", "transport", "health", "weather", "social", "question", "description", "preference", "ability"],
    notes: "Work, health, appointments, money pressure, and transport logistics can appear."
  },
  {
    id: "adult-3000",
    minKnownWords: 3000,
    label: "Adult nuance",
    allowedThemes: ["identity", "daily-life", "food", "drink", "family", "school", "work", "shopping", "time", "location", "home", "transport", "health", "weather", "reading", "shadowing", "social", "question", "description", "preference", "ability"],
    notes: "Longer multi-clause adult scenarios, tradeoffs, problems, and plans."
  }
];

const adultThemeTags = new Set<IslandTag>(["work", "health", "transport"]);
const matureThemeTags = new Set<IslandTag>(["work", "health"]);

export function tierForKnownWordCount(knownWordCount: number): ProgressionTier {
  return [...progressionTiers].reverse().find((tier) => knownWordCount >= tier.minKnownWords) ?? progressionTiers[0];
}

export function requiredWordCountForSentence(sentence: Pick<GeneratedSentence, "progressionLevel" | "themeTags" | "unlockAtWordCount">): number {
  if (sentence.unlockAtWordCount !== undefined) return sentence.unlockAtWordCount;

  const tags = sentence.themeTags ?? [];
  if ((sentence.progressionLevel ?? 1) >= 4) return 3000;
  if (tags.some((tag) => matureThemeTags.has(tag))) return 2000;
  if (tags.some((tag) => adultThemeTags.has(tag))) return 1000;
  if ((sentence.progressionLevel ?? 1) >= 2) return 300;
  return 100;
}

export function isSentenceUnlocked(sentence: Pick<GeneratedSentence, "progressionLevel" | "themeTags" | "unlockAtWordCount">, knownWordCount: number): boolean {
  return knownWordCount >= requiredWordCountForSentence(sentence);
}
