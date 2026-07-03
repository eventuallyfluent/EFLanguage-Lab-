import { coverageFor, readingCoverageFor, validateCiPlusOne } from "../quality";
import { lexicon } from "./lexicon";
import { curatedSentences } from "./curatedSentences";
import {
  ContentComplexity,
  CurriculumDialogue,
  CurriculumPack,
  CurriculumReading,
  CurriculumTierId,
  DialogueTurn,
  GeneratedSentence,
  ReadingSentence
} from "../models";

interface PackInput {
  id: string;
  tierId: CurriculumTierId;
  title: string;
  summary: string;
  unlockAtWordCount: number;
  themeTags: CurriculumPack["themeTags"];
  sentenceIds: string[];
  dialogues: Array<{
    id: string;
    title: string;
    complexity: ContentComplexity;
    turns: [DialogueTurn["speaker"], string, string, string, string[]][];
  }>;
  reading: {
    id: string;
    title: string;
    complexity: ContentComplexity;
    sentences: [string, string, string, string[], string[]][];
  };
}

const sentenceById = new Map(curatedSentences.map((sentence) => [sentence.id, sentence]));

const packs: PackInput[] = [
  pack100Identity(),
  pack100Names(),
  pack100Food(),
  pack100School(),
  pack100Home(),
  pack100Questions(),
  pack100Feelings(),
  pack100DailyRoutine(),
  pack300Shopping(),
  pack300Restaurant(),
  pack300Device(),
  pack300TransitLight(),
  pack1000Delay(),
  pack1000CityMovement(),
  pack1000PracticalHelp()
];

export const curriculumPacks: CurriculumPack[] = packs.map(resolvePack);

function resolvePack(input: PackInput): CurriculumPack {
  const sentences = input.sentenceIds.map((id) => {
    const sentence = sentenceById.get(id);
    if (!sentence) throw new Error(`Unknown curated sentence id: ${id}`);
    return {
      ...sentence,
      tierId: input.tierId,
      packId: input.id,
      unlockAtWordCount: input.unlockAtWordCount,
      complexity: sentenceComplexity(sentence),
      contentType: "sentence" as const,
      themeTags: Array.from(new Set([...(sentence.themeTags ?? []), ...input.themeTags]))
    };
  });

  const dialogues: CurriculumDialogue[] = input.dialogues.map((dialogue) => ({
    id: dialogue.id,
    title: dialogue.title,
    islandTags: input.themeTags,
    knownVocabularyCoverage: coverageFor(dialogue.turns.flatMap((turn) => turn[4]), lexicon),
    tierId: input.tierId,
    packId: input.id,
    unlockAtWordCount: input.unlockAtWordCount,
    complexity: dialogue.complexity,
    reviewStatus: "curated",
    turns: dialogue.turns.map(([speaker, simplified, pinyin, english, vocabularyIds]) => ({
      speaker,
      simplified,
      pinyin,
      english,
      vocabularyIds,
      tierId: input.tierId,
      packId: input.id,
      unlockAtWordCount: input.unlockAtWordCount,
      complexity: dialogue.complexity,
      contentType: "dialogue-turn"
    }))
  }));

  const readingSentences = buildReadingSentences(input, sentences, dialogues);

  const reading: CurriculumReading = {
    id: input.reading.id,
    title: input.reading.title,
    islandTags: input.themeTags,
    sentences: readingSentences,
    knownVocabularyCoverage: readingCoverageFor(readingSentences),
    ciPlusOneValid: validateCiPlusOne(readingSentences),
    tierId: input.tierId,
    packId: input.id,
    unlockAtWordCount: input.unlockAtWordCount,
    complexity: input.reading.complexity,
    reviewStatus: "curated"
  };

  return {
    id: input.id,
    tierId: input.tierId,
    title: input.title,
    summary: input.summary,
    unlockAtWordCount: input.unlockAtWordCount,
    themeTags: input.themeTags,
    sentenceCountTarget: input.sentenceIds.length,
    dialogueCountTarget: input.dialogues.length,
    readingCountTarget: 1,
    sentences,
    dialogues,
    readings: [reading]
  };
}

function sentenceComplexity(sentence: GeneratedSentence): ContentComplexity {
  if (/[，。！？]/.test(sentence.simplified.replace(/[。！？]$/, ""))) return "paired-clause";
  return sentence.vocabularyIds.length > 5 ? "paired-clause" : "single-clause";
}

function buildReadingSentences(
  input: PackInput,
  sentences: GeneratedSentence[],
  dialogues: CurriculumDialogue[]
): ReadingSentence[] {
  const sourceLines = selectReadingSourceLines(sentences, dialogues);
  const newWordId = pickReadingNewWordId(sourceLines);
  let assigned = false;

  return sourceLines.map((line) => {
    const vocabularyIds = [...line.vocabularyIds];
    const newWordIds: string[] = [];

    if (!assigned && newWordId) {
      const index = vocabularyIds.lastIndexOf(newWordId);
      if (index >= 0 && vocabularyIds.length > 1) {
        vocabularyIds.splice(index, 1);
        newWordIds.push(newWordId);
        assigned = true;
      }
    }

    return {
      simplified: line.simplified,
      pinyin: line.pinyin,
      english: line.english,
      vocabularyIds,
      newWordIds,
      tierId: input.tierId,
      packId: input.id,
      unlockAtWordCount: input.unlockAtWordCount,
      complexity: input.reading.complexity,
      contentType: "reading-line"
    };
  });
}

function selectReadingSourceLines(
  sentences: GeneratedSentence[],
  dialogues: CurriculumDialogue[]
): Array<Pick<ReadingSentence, "simplified" | "pinyin" | "english" | "vocabularyIds">> {
  const selected: Array<Pick<ReadingSentence, "simplified" | "pinyin" | "english" | "vocabularyIds">> = [];
  const seen = new Set<string>();

  const pushLine = (line: Pick<ReadingSentence, "simplified" | "pinyin" | "english" | "vocabularyIds">) => {
    if (seen.has(line.simplified)) return;
    seen.add(line.simplified);
    selected.push(line);
  };

  for (const sentence of sentences) {
    pushLine(sentence);
    if (selected.length >= 5 && totalVocabularyCount(selected) >= 20) break;
  }

  if (selected.length < 5 || totalVocabularyCount(selected) < 20) {
    for (const dialogue of dialogues) {
      for (const turn of dialogue.turns) {
        pushLine(turn);
        if (selected.length >= 5 && totalVocabularyCount(selected) >= 20) break;
      }
      if (selected.length >= 5 && totalVocabularyCount(selected) >= 20) break;
    }
  }

  if (selected.length < 5 || totalVocabularyCount(selected) < 20) {
    const fallbackPool = [...sentences, ...dialogues.flatMap((dialogue) => dialogue.turns)];
    let index = 0;
    while (fallbackPool.length > 0 && totalVocabularyCount(selected) < 20) {
      const line = fallbackPool[index % fallbackPool.length];
      selected.push({
        simplified: line.simplified,
        pinyin: line.pinyin,
        english: line.english,
        vocabularyIds: [...line.vocabularyIds]
      });
      index += 1;
    }
  }

  return selected.slice(0, Math.max(5, selected.length));
}

function totalVocabularyCount(lines: Array<Pick<ReadingSentence, "vocabularyIds">>): number {
  return lines.reduce((sum, line) => sum + line.vocabularyIds.length, 0);
}

function pickReadingNewWordId(lines: Array<Pick<ReadingSentence, "vocabularyIds">>): string | undefined {
  for (const line of lines) {
    const candidate = [...line.vocabularyIds].reverse().find((id) => !["wo", "ni", "ta_he", "ta_she", "women", "ma", "le", "de", "ge"].includes(id));
    if (candidate) return candidate;
  }
  return lines[0]?.vocabularyIds.at(-1);
}

function pack100Identity(): PackInput {
  return {
    id: "pack-100-identity",
    tierId: "100-tier",
    title: "Identity and Greetings",
    summary: "Short identity exchanges and greetings.",
    unlockAtWordCount: 100,
    themeTags: ["identity", "social", "daily-life"],
    sentenceIds: ["curated-001", "curated-002", "curated-003", "curated-004", "curated-005", "curated-006"],
    dialogues: [
      {
        id: "dialogue-pack-100-identity",
        title: "Meeting Someone",
        complexity: "single-clause",
        turns: [
          ["A", "你好。", "nǐ hǎo.", "Hello.", ["ni", "hao"]],
          ["B", "你好。", "nǐ hǎo.", "Hello.", ["ni", "hao"]],
          ["A", "你是学生吗？", "nǐ shì xué sheng ma?", "Are you a student?", ["ni", "shi", "xuesheng", "ma"]],
          ["B", "我是学生。", "wǒ shì xué sheng.", "I am a student.", ["wo", "shi", "xuesheng"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-100-identity",
      title: "Two People",
      complexity: "single-clause",
      sentences: [
        ["他是老师。", "tā shì lǎo shī.", "He is a teacher.", ["ta_he", "shi", "laoshi"], []],
        ["她是学生。", "tā shì xué sheng.", "She is a student.", ["ta_she", "shi", "xuesheng"], []],
        ["他们很好。", "tā men hěn hǎo.", "They are fine.", ["ta_he", "hen", "hao"], ["tamen"]]
      ]
    }
  };
}

function pack100Names(): PackInput {
  return {
    id: "pack-100-names",
    tierId: "100-tier",
    title: "Names and Knowing People",
    summary: "Asking names and saying who you know.",
    unlockAtWordCount: 100,
    themeTags: ["identity", "social", "question"],
    sentenceIds: ["curated-007", "curated-008", "curated-009", "curated-010", "curated-011", "curated-012"],
    dialogues: [
      {
        id: "dialogue-pack-100-names",
        title: "What Is His Name?",
        complexity: "single-clause",
        turns: [
          ["A", "他叫什么名字？", "tā jiào shén me míng zi?", "What is his name?", ["ta_he", "jiao", "shenme", "mingzi"]],
          ["B", "我不知道。", "wǒ bù zhī dào.", "I do not know.", ["wo", "bu", "zhidao"]],
          ["A", "你认识他吗？", "nǐ rèn shi tā ma?", "Do you know him?", ["ni", "renshi", "ta_he", "ma"]],
          ["B", "我认识他。", "wǒ rèn shi tā.", "I know him.", ["wo", "renshi", "ta_he"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-100-names",
      title: "Do You Know Him?",
      complexity: "single-clause",
      sentences: [
        ["你认识他吗？", "nǐ rèn shi tā ma?", "Do you know him?", ["ni", "renshi", "ta_he", "ma"], []],
        ["我认识他。", "wǒ rèn shi tā.", "I know him.", ["wo", "renshi", "ta_he"], []],
        ["我不知道他的名字。", "wǒ bù zhī dào tā de míng zi.", "I do not know his name.", ["wo", "bu", "zhidao", "ta_he", "de", "mingzi"], []]
      ]
    }
  };
}

function pack100Food(): PackInput {
  return {
    id: "pack-100-food",
    tierId: "100-tier",
    title: "Food and Drinks",
    summary: "Eating, drinking, and simple preferences.",
    unlockAtWordCount: 100,
    themeTags: ["food", "drink", "daily-life", "preference"],
    sentenceIds: ["curated-013", "curated-014", "curated-017", "curated-018", "curated-021", "curated-022", "curated-025", "curated-026"],
    dialogues: [
      {
        id: "dialogue-pack-100-food",
        title: "Tea or Water",
        complexity: "single-clause",
        turns: [
          ["A", "你想喝茶吗？", "nǐ xiǎng hē chá ma?", "Do you want to drink tea?", ["ni", "xiang", "he", "cha", "ma"]],
          ["B", "我想喝水。", "wǒ xiǎng hē shuǐ.", "I want to drink water.", ["wo", "xiang", "he", "shui"]],
          ["A", "你吃饭了吗？", "nǐ chī fàn le ma?", "Have you eaten?", ["ni", "chi", "fan", "le", "ma"]],
          ["B", "我吃了。", "wǒ chī le.", "I ate.", ["wo", "chi", "le"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-100-food",
      title: "Today I Eat",
      complexity: "single-clause",
      sentences: [
        ["我喝水。", "wǒ hē shuǐ.", "I drink water.", ["wo", "he", "shui"], []],
        ["他喝茶。", "tā hē chá.", "He drinks tea.", ["ta_he", "he", "cha"], []],
        ["我吃饭。", "wǒ chī fàn.", "I eat.", ["wo", "chi", "fan"], []]
      ]
    }
  };
}

function pack100School(): PackInput {
  return {
    id: "pack-100-school",
    tierId: "100-tier",
    title: "School and Chinese Study",
    summary: "Basic school routine and language study.",
    unlockAtWordCount: 100,
    themeTags: ["school", "daily-life", "time"],
    sentenceIds: ["curated-029", "curated-030", "curated-031", "curated-041", "curated-042", "curated-043", "curated-044"],
    dialogues: [
      {
        id: "dialogue-pack-100-school",
        title: "Going to School",
        complexity: "single-clause",
        turns: [
          ["A", "你今天去学校吗？", "nǐ jīn tiān qù xué xiào ma?", "Are you going to school today?", ["ni", "jin_tian", "qu", "xuexiao", "ma"]],
          ["B", "我今天去学校。", "wǒ jīn tiān qù xué xiào.", "I am going to school today.", ["wo", "jin_tian", "qu", "xuexiao"]],
          ["A", "你会说中文吗？", "nǐ huì shuō zhōng wén ma?", "Can you speak Chinese?", ["ni", "hui", "shuo", "zhongwen", "ma"]],
          ["B", "我会说中文。", "wǒ huì shuō zhōng wén.", "I can speak Chinese.", ["wo", "hui", "shuo", "zhongwen"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-100-school",
      title: "Chinese Every Day",
      complexity: "single-clause",
      sentences: [
        ["我每天学中文。", "wǒ měi tiān xué zhōng wén.", "I study Chinese every day.", ["wo", "mei_tian", "xue", "zhongwen"], []],
        ["我在学校。", "wǒ zài xué xiào.", "I am at school.", ["wo", "zai", "xuexiao"], []],
        ["我会说中文。", "wǒ huì shuō zhōng wén.", "I can speak Chinese.", ["wo", "hui", "shuo", "zhongwen"], []]
      ]
    }
  };
}

function pack100Home(): PackInput {
  return {
    id: "pack-100-home",
    tierId: "100-tier",
    title: "Home and Simple Location",
    summary: "Being at home and going home.",
    unlockAtWordCount: 100,
    themeTags: ["home", "location", "daily-life"],
    sentenceIds: ["curated-038", "curated-040", "curated-045", "curated-046", "curated-047", "curated-048"],
    dialogues: [
      {
        id: "dialogue-pack-100-home",
        title: "Where Are You?",
        complexity: "single-clause",
        turns: [
          ["A", "你在哪里？", "nǐ zài nǎ lǐ?", "Where are you?", ["ni", "zai", "nali"]],
          ["B", "我在家。", "wǒ zài jiā.", "I am at home.", ["wo", "zai", "jia"]],
          ["A", "你想回家吗？", "nǐ xiǎng huí jiā ma?", "Do you want to go home?", ["ni", "xiang", "hui_return", "jia", "ma"]],
          ["B", "我想回家。", "wǒ xiǎng huí jiā.", "I want to go home.", ["wo", "xiang", "hui_return", "jia"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-100-home",
      title: "At Home",
      complexity: "single-clause",
      sentences: [
        ["我在家。", "wǒ zài jiā.", "I am at home.", ["wo", "zai", "jia"], []],
        ["我回家。", "wǒ huí jiā.", "I am going home.", ["wo", "hui_return", "jia"], []],
        ["我住在学校。", "wǒ zhù zài xué xiào.", "I live at school.", ["wo", "zhu", "zai", "xuexiao"], []]
      ]
    }
  };
}

function pack100Questions(): PackInput {
  return {
    id: "pack-100-questions",
    tierId: "100-tier",
    title: "Questions and Help",
    summary: "Basic comprehension and repair language.",
    unlockAtWordCount: 100,
    themeTags: ["question", "school", "social"],
    sentenceIds: ["curated-056", "curated-057", "curated-058", "curated-059", "curated-060", "curated-061", "curated-062", "curated-063"],
    dialogues: [
      {
        id: "dialogue-pack-100-questions",
        title: "Please Say It Again",
        complexity: "single-clause",
        turns: [
          ["A", "我有一个问题。", "wǒ yǒu yí ge wèn tí.", "I have a question.", ["wo", "you", "yi", "ge", "wenti"]],
          ["B", "这是什么意思？", "zhè shì shén me yì si?", "What does this mean?", ["zhe", "shi", "shenme", "yisi"]],
          ["A", "请说慢一点。", "qǐng shuō màn yì diǎn.", "Please speak a little slower.", ["qing", "shuo", "man", "yidian"]],
          ["B", "好。", "hǎo.", "Okay.", ["hao"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-100-questions",
      title: "A Simple Question",
      complexity: "single-clause",
      sentences: [
        ["我有一个问题。", "wǒ yǒu yí ge wèn tí.", "I have a question.", ["wo", "you", "yi", "ge", "wenti"], []],
        ["这是什么意思？", "zhè shì shén me yì si?", "What does this mean?", ["zhe", "shi", "shenme", "yisi"], []],
        ["我知道。", "wǒ zhī dào.", "I know.", ["wo", "zhidao"], []]
      ]
    }
  };
}

function pack100Feelings(): PackInput {
  return {
    id: "pack-100-feelings",
    tierId: "100-tier",
    title: "Weather and Feelings",
    summary: "Basic physical state and weather talk.",
    unlockAtWordCount: 100,
    themeTags: ["daily-life", "description", "time"],
    sentenceIds: ["curated-033", "curated-034", "curated-035", "curated-036", "curated-037", "curated-049"],
    dialogues: [
      {
        id: "dialogue-pack-100-feelings",
        title: "How Is Today?",
        complexity: "single-clause",
        turns: [
          ["A", "今天很热。", "jīn tiān hěn rè.", "It is hot today.", ["jin_tian", "hen", "re"]],
          ["B", "我今天很累。", "wǒ jīn tiān hěn lèi.", "I am tired today.", ["jin_tian", "wo", "hen", "lei"]],
          ["A", "天气很好。", "tiān qì hěn hǎo.", "The weather is good.", ["tianqi", "hen", "hao"]],
          ["B", "好。", "hǎo.", "Okay.", ["hao"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-100-feelings",
      title: "Today",
      complexity: "single-clause",
      sentences: [
        ["今天很热。", "jīn tiān hěn rè.", "It is hot today.", ["jin_tian", "hen", "re"], []],
        ["我今天很忙。", "wǒ jīn tiān hěn máng.", "I am busy today.", ["jin_tian", "wo", "hen", "mang"], []],
        ["我今天很累。", "wǒ jīn tiān hěn lèi.", "I am tired today.", ["jin_tian", "wo", "hen", "lei"], []]
      ]
    }
  };
}

function pack100DailyRoutine(): PackInput {
  return {
    id: "pack-100-routine",
    tierId: "100-tier",
    title: "Simple Daily Routine",
    summary: "Daily actions with home and study.",
    unlockAtWordCount: 100,
    themeTags: ["daily-life", "time", "food", "school"],
    sentenceIds: ["curated-023", "curated-024", "curated-028", "curated-029", "curated-050"],
    dialogues: [
      {
        id: "dialogue-pack-100-routine",
        title: "Today",
        complexity: "single-clause",
        turns: [
          ["A", "你吃饭了吗？", "nǐ chī fàn le ma?", "Have you eaten?", ["ni", "chi", "fan", "le", "ma"]],
          ["B", "我没吃。", "wǒ méi chī.", "I have not eaten.", ["wo", "mei_you", "chi"]],
          ["A", "你今天去学校吗？", "nǐ jīn tiān qù xué xiào ma?", "Are you going to school today?", ["ni", "jin_tian", "qu", "xuexiao", "ma"]],
          ["B", "我今天去学校。", "wǒ jīn tiān qù xué xiào.", "I am going to school today.", ["wo", "jin_tian", "qu", "xuexiao"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-100-routine",
      title: "My Day",
      complexity: "single-clause",
      sentences: [
        ["我吃了。", "wǒ chī le.", "I ate.", ["wo", "chi", "le"], []],
        ["我每天喝水。", "wǒ měi tiān hē shuǐ.", "I drink water every day.", ["wo", "mei_tian", "he", "shui"], []],
        ["我每天学中文。", "wǒ měi tiān xué zhōng wén.", "I study Chinese every day.", ["wo", "mei_tian", "xue", "zhongwen"], []]
      ]
    }
  };
}

function pack300Shopping(): PackInput {
  return {
    id: "pack-300-shopping",
    tierId: "300-tier",
    title: "Shopping Basics",
    summary: "Buying simple items and talking about money.",
    unlockAtWordCount: 300,
    themeTags: ["shopping", "daily-life", "social"],
    sentenceIds: ["curated-072", "curated-073", "curated-074", "curated-075"],
    dialogues: [
      {
        id: "dialogue-pack-300-shopping",
        title: "Buying a Phone",
        complexity: "paired-clause",
        turns: [
          ["A", "你想买什么？", "nǐ xiǎng mǎi shén me?", "What do you want to buy?", ["ni", "xiang", "mai_buy", "shenme"]],
          ["B", "我想买一个手机。", "wǒ xiǎng mǎi yí ge shǒu jī.", "I want to buy a phone.", ["wo", "xiang", "mai_buy", "yi", "ge", "shouji"]],
          ["A", "这个手机很好。", "zhè ge shǒu jī hěn hǎo.", "This phone is good.", ["zhe", "ge", "shouji", "hen", "hao"]],
          ["B", "可是我没有很多钱。", "kě shì wǒ méi yǒu hěn duō qián.", "But I do not have much money.", ["keshi", "wo", "mei_you", "hen", "duo", "qian"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-300-shopping",
      title: "At the Store",
      complexity: "paired-clause",
      sentences: [
        ["我今天想买衣服。", "wǒ jīn tiān xiǎng mǎi yī fu.", "I want to buy clothes today.", ["wo", "jin_tian", "xiang", "mai_buy", "yifu"], []],
        ["我们去商店买东西。", "wǒ men qù shāng diàn mǎi dōng xi.", "We are going to the store to buy things.", ["women", "qu", "shangdian", "mai_buy", "dongxi"], []],
        ["我没有很多钱。", "wǒ méi yǒu hěn duō qián.", "I do not have much money.", ["wo", "mei_you", "hen", "duo", "qian"], []]
      ]
    }
  };
}

function pack300Restaurant(): PackInput {
  return {
    id: "pack-300-restaurant",
    tierId: "300-tier",
    title: "Restaurant and Coffee Plans",
    summary: "Simple meetup and food/drink plans.",
    unlockAtWordCount: 300,
    themeTags: ["food", "drink", "social", "time"],
    sentenceIds: ["curated-076", "curated-077", "curated-078"],
    dialogues: [
      {
        id: "dialogue-pack-300-restaurant",
        title: "Coffee Tonight",
        complexity: "paired-clause",
        turns: [
          ["A", "你想去饭店吃饭吗？", "nǐ xiǎng qù fàn diàn chī fàn ma?", "Do you want to go to a restaurant to eat?", ["ni", "xiang", "qu", "fandian", "chi", "fan", "ma"]],
          ["B", "我在饭店等朋友。", "wǒ zài fàn diàn děng péng you.", "I am waiting for a friend at the restaurant.", ["wo", "zai", "fandian", "deng", "pengyou"]],
          ["A", "我们晚上喝咖啡。", "wǒ men wǎn shang hē kā fēi.", "We are drinking coffee tonight.", ["women", "wanshang", "he", "kafei"]],
          ["B", "好。", "hǎo.", "Okay.", ["hao"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-300-restaurant",
      title: "Tonight",
      complexity: "single-clause",
      sentences: [
        ["我们晚上喝咖啡。", "wǒ men wǎn shang hē kā fēi.", "We are drinking coffee tonight.", ["women", "wanshang", "he", "kafei"], []],
        ["我在饭店等朋友。", "wǒ zài fàn diàn děng péng you.", "I am waiting for a friend at the restaurant.", ["wo", "zai", "fandian", "deng", "pengyou"], []],
        ["你想去饭店吃饭吗？", "nǐ xiǎng qù fàn diàn chī fàn ma?", "Do you want to go to a restaurant to eat?", ["ni", "xiang", "qu", "fandian", "chi", "fan", "ma"], []]
      ]
    }
  };
}

function pack300Device(): PackInput {
  return {
    id: "pack-300-device",
    tierId: "300-tier",
    title: "Basic Device Use",
    summary: "Simple phone and computer use without work pressure.",
    unlockAtWordCount: 300,
    themeTags: ["shopping", "daily-life", "social"],
    sentenceIds: ["curated-072", "curated-073", "curated-074"],
    dialogues: [
      {
        id: "dialogue-pack-300-device",
        title: "A Phone Call",
        complexity: "paired-clause",
        turns: [
          ["A", "我有电话。", "wǒ yǒu diàn huà.", "I have a phone call.", ["wo", "you", "dianhua"]],
          ["B", "你现在打电话吗？", "nǐ xiàn zài dǎ diàn huà ma?", "Are you making a phone call now?", ["ni", "xianzai", "da", "dianhua", "ma"]],
          ["A", "我现在打电话。", "wǒ xiàn zài dǎ diàn huà.", "I am making a phone call now.", ["wo", "xianzai", "da", "dianhua"]],
          ["B", "好。", "hǎo.", "Okay.", ["hao"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-300-device",
      title: "My Device",
      complexity: "single-clause",
      sentences: [
        ["我想买一个手机。", "wǒ xiǎng mǎi yí ge shǒu jī.", "I want to buy a phone.", ["wo", "xiang", "mai_buy", "yi", "ge", "shouji"], []],
        ["这个手机很好。", "zhè ge shǒu jī hěn hǎo.", "This phone is good.", ["zhe", "ge", "shouji", "hen", "hao"], []],
        ["我有电话。", "wǒ yǒu diàn huà.", "I have a phone call.", ["wo", "you", "dianhua"], []]
      ]
    }
  };
}

function pack300TransitLight(): PackInput {
  return {
    id: "pack-300-transit-light",
    tierId: "300-tier",
    title: "Light Transport",
    summary: "Simple transport phrases without real logistics problems.",
    unlockAtWordCount: 300,
    themeTags: ["transport", "time", "location"],
    sentenceIds: ["curated-081", "curated-082", "curated-083"],
    dialogues: [
      {
        id: "dialogue-pack-300-transit-light",
        title: "Going Out",
        complexity: "paired-clause",
        turns: [
          ["A", "你怎么去学校？", "nǐ zěn me qù xué xiào?", "How are you going to school?", ["ni", "qu", "xuexiao"]],
          ["B", "我坐车去学校。", "wǒ zuò chē qù xué xiào.", "I take the bus to school.", ["wo", "zuo_sit", "che", "qu", "xuexiao"]],
          ["A", "这路很慢。", "zhè lù hěn màn.", "This road is slow.", ["zhe", "lu", "hen", "man"]],
          ["B", "好。", "hǎo.", "Okay.", ["hao"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-300-transit-light",
      title: "The Road",
      complexity: "single-clause",
      sentences: [
        ["我坐车去学校。", "wǒ zuò chē qù xué xiào.", "I take the bus to school.", ["wo", "zuo_sit", "che", "qu", "xuexiao"], []],
        ["这路很慢。", "zhè lù hěn màn.", "This road is slow.", ["zhe", "lu", "hen", "man"], []],
        ["我想回家。", "wǒ xiǎng huí jiā.", "I want to go home.", ["wo", "xiang", "hui_return", "jia"], []]
      ]
    }
  };
}

function pack1000Delay(): PackInput {
  return {
    id: "pack-1000-delay",
    tierId: "1000-tier",
    title: "Delays and Time Pressure",
    summary: "Simple scheduling pressure without adult operating-life content.",
    unlockAtWordCount: 1000,
    themeTags: ["time", "transport", "social"],
    sentenceIds: ["curated-097", "curated-098", "curated-100"],
    dialogues: [
      {
        id: "dialogue-pack-1000-delay",
        title: "Running Late",
        complexity: "paired-clause",
        turns: [
          ["A", "你现在在哪里？", "nǐ xiàn zài zài nǎ lǐ?", "Where are you now?", ["ni", "xianzai", "zai", "nali"]],
          ["B", "我在车站等车。", "wǒ zài chē zhàn děng chē.", "I am waiting for the bus at the station.", ["wo", "zai", "chezhan", "deng", "che"]],
          ["A", "我等了十分钟。", "wǒ děng le shí fēn zhōng.", "I waited ten minutes.", ["wo", "deng", "le", "shi_num", "fenzhong"]],
          ["B", "我没有时间。", "wǒ méi yǒu shí jiān.", "I do not have time.", ["wo", "mei_you", "shijian"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-1000-delay",
      title: "Waiting",
      complexity: "paired-clause",
      sentences: [
        ["我在车站等车。", "wǒ zài chē zhàn děng chē.", "I am waiting for the bus at the station.", ["wo", "zai", "chezhan", "deng", "che"], []],
        ["我等了十分钟。", "wǒ děng le shí fēn zhōng.", "I waited ten minutes.", ["wo", "deng", "le", "shi_num", "fenzhong"], []],
        ["我没有时间。", "wǒ méi yǒu shí jiān.", "I do not have time.", ["wo", "mei_you", "shijian"], []]
      ]
    }
  };
}

function pack1000CityMovement(): PackInput {
  return {
    id: "pack-1000-city",
    tierId: "1000-tier",
    title: "Movement Through the City",
    summary: "Airport, station, and changing plans.",
    unlockAtWordCount: 1000,
    themeTags: ["transport", "time", "location"],
    sentenceIds: ["curated-082", "curated-083", "curated-084"],
    dialogues: [
      {
        id: "dialogue-pack-1000-city",
        title: "Tomorrow's Trip",
        complexity: "paired-clause",
        turns: [
          ["A", "他明天去机场。", "tā míng tiān qù jī chǎng.", "He is going to the airport tomorrow.", ["ta_he", "ming_tian", "qu", "jichang"]],
          ["B", "我不想开车。", "wǒ bù xiǎng kāi chē.", "I do not want to drive.", ["wo", "bu", "xiang", "kai", "che"]],
          ["A", "这路很慢。", "zhè lù hěn màn.", "This road is slow.", ["zhe", "lu", "hen", "man"]],
          ["B", "好。", "hǎo.", "Okay.", ["hao"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-1000-city",
      title: "Tomorrow",
      complexity: "paired-clause",
      sentences: [
        ["他明天去机场。", "tā míng tiān qù jī chǎng.", "He is going to the airport tomorrow.", ["ta_he", "ming_tian", "qu", "jichang"], []],
        ["我不想开车。", "wǒ bù xiǎng kāi chē.", "I do not want to drive.", ["wo", "bu", "xiang", "kai", "che"], []],
        ["这路很慢。", "zhè lù hěn màn.", "This road is slow.", ["zhe", "lu", "hen", "man"], []]
      ]
    }
  };
}

function pack1000PracticalHelp(): PackInput {
  return {
    id: "pack-1000-help",
    tierId: "1000-tier",
    title: "Practical Help and Clarification",
    summary: "Simple asking-for-help and clarification tasks.",
    unlockAtWordCount: 1000,
    themeTags: ["question", "social", "time"],
    sentenceIds: ["curated-084", "curated-104", "curated-110"],
    dialogues: [
      {
        id: "dialogue-pack-1000-help",
        title: "Please Help Me",
        complexity: "paired-clause",
        turns: [
          ["A", "请帮我看这个问题。", "qǐng bāng wǒ kàn zhè ge wèn tí.", "Please help me look at this question.", ["qing", "bang", "wo", "kan", "zhe", "ge", "wenti"]],
          ["B", "这个问题是什么意思？", "zhè ge wèn tí shì shén me yì si?", "What does this question mean?", ["zhe", "ge", "wenti", "shi", "shenme", "yisi"]],
          ["A", "请说慢一点。", "qǐng shuō màn yì diǎn.", "Please speak a little slower.", ["qing", "shuo", "man", "yidian"]],
          ["B", "好。", "hǎo.", "Okay.", ["hao"]]
        ]
      }
    ],
    reading: {
      id: "reading-pack-1000-help",
      title: "A Hard Moment",
      complexity: "paired-clause",
      sentences: [
        ["请帮我看这个问题。", "qǐng bāng wǒ kàn zhè ge wèn tí.", "Please help me look at this question.", ["qing", "bang", "wo", "kan", "zhe", "ge", "wenti"], []],
        ["这个意思我知道。", "zhè ge yì si wǒ zhī dào.", "I know what this means.", ["zhe", "ge", "yisi", "wo", "zhidao"], []],
        ["请说慢一点。", "qǐng shuō màn yì diǎn.", "Please speak a little slower.", ["qing", "shuo", "man", "yidian"], []]
      ]
    }
  };
}
