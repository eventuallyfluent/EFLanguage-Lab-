import { ProductPolicy } from "./models";

export const productPolicy: ProductPolicy = {
  targetVocabularyCount: 10000,
  primaryAcquisitionMode: "ci-plus-one-sentence-stream",
  repetitionStyle: "glossika-style",
  srsRole: "support-retention",
  productSurfaces: [
    {
      id: "sentence-stream",
      label: "CI+1 Sentence Stream",
      role: "primary-acquisition",
      description: "The main learner path: controlled, high-repetition Mandarin sentences that gradually introduce one new item at a time."
    },
    {
      id: "shadowing",
      label: "Shadowing",
      role: "core-practice",
      description: "Repeatable listen-and-speak lines sourced from the same controlled sentence stream."
    },
    {
      id: "srs",
      label: "SRS",
      role: "support-retention",
      description: "A retention aid fed by sentences the learner has already met through input and shadowing."
    },
    {
      id: "articles",
      label: "Unlocked Articles",
      role: "unlockable-reading",
      description: "Longer CI readings unlock only when known-word count and coverage are high enough."
    }
  ],
  journeyMilestones: [
    {
      knownWordCount: 100,
      label: "Survival sentence stream",
      acquisitionFocus: "Identity, food, basic time, home, school, simple location, and very short exchanges.",
      unlockedContent: ["CI+1 sentences", "short shadowing lines"]
    },
    {
      knownWordCount: 300,
      label: "Daily-life sentence stream",
      acquisitionFocus: "Shopping, restaurant basics, simple errands, light transport, scheduling, and device basics.",
      unlockedContent: ["longer sentence chains", "simple CI readings"]
    },
    {
      knownWordCount: 1000,
      label: "Practical bridge",
      acquisitionFocus: "Delays, missed plans, asking for help, clarification, and moving through a city.",
      unlockedContent: ["beginner articles", "longer shadowing sequences"]
    },
    {
      knownWordCount: 2000,
      label: "Adult operating life",
      acquisitionFocus: "Work-adjacent logistics, health visits, money pressure, appointments, and multi-step errands.",
      unlockedContent: ["adult-life articles", "scenario shadowing"]
    },
    {
      knownWordCount: 3000,
      label: "Adult nuance",
      acquisitionFocus: "Longer explanations, preferences, constraints, reasons, and low-stakes disagreement.",
      unlockedContent: ["multi-paragraph articles", "nuanced sentence drills"]
    },
    {
      knownWordCount: 5000,
      label: "Broad practical reading",
      acquisitionFocus: "Everyday media, notices, service interactions, and common life administration.",
      unlockedContent: ["intermediate articles", "topic-based sentence streams"]
    },
    {
      knownWordCount: 7500,
      label: "High-coverage real input",
      acquisitionFocus: "Wider adult topics with controlled unknown-word density.",
      unlockedContent: ["near-authentic articles", "long-form shadowing"]
    },
    {
      knownWordCount: 10000,
      label: "10k operating base",
      acquisitionFocus: "Large-scale usable vocabulary supported by controlled review and reading.",
      unlockedContent: ["broad article library", "maintenance SRS"]
    }
  ],
  articleUnlocks: [
    {
      id: "article-300",
      minKnownWords: 300,
      minKnownVocabularyCoverage: 0.95,
      maxNewWordsPerSentence: 1,
      allowedComplexity: "single-clause",
      description: "Very short CI readings built from daily-life sentence chains."
    },
    {
      id: "article-1000",
      minKnownWords: 1000,
      minKnownVocabularyCoverage: 0.95,
      maxNewWordsPerSentence: 2,
      allowedComplexity: "paired-clause",
      description: "Short practical articles about errands, movement, schedule changes, and asking for help."
    },
    {
      id: "article-2000",
      minKnownWords: 2000,
      minKnownVocabularyCoverage: 0.95,
      maxNewWordsPerSentence: 2,
      allowedComplexity: "paired-clause",
      description: "Adult operating-life readings unlock only after the learner has enough vocabulary coverage."
    },
    {
      id: "article-3000",
      minKnownWords: 3000,
      minKnownVocabularyCoverage: 0.96,
      maxNewWordsPerSentence: 2,
      allowedComplexity: "multi-clause",
      description: "Longer adult nuance and multi-paragraph reading with strict unknown-word limits."
    }
  ],
  nonGoals: [
    "quiz-first learning loop",
    "SRS as the primary acquisition engine",
    "freeform generated learner-facing content",
    "articles before vocabulary coverage supports CI+1",
    "adult operating-life content before the 2000-word threshold"
  ]
};
