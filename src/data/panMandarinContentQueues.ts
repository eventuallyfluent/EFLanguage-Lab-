import {
  IslandTag,
  PanMandarinCiCandidate,
  PanMandarinConcept,
  PanMandarinContentCoverageReport,
  PanMandarinContentReviewQueueItem,
  PanMandarinContentReviewReport,
  PanMandarinIslandUnlock,
  PanMandarinPremadeIsland,
  PanMandarinPremadeLine,
  PanMandarinPremadeStory,
  PanMandarinStoryTopicCandidate,
  PanMandarinStoryTopicPlan,
  PanMandarinStoryQueue
} from "../models";

interface IslandDefinition {
  id: string;
  label: string;
  unlockAtWordCount: number;
  themeTags: IslandTag[];
  allowedContent: PanMandarinIslandUnlock["allowedContent"];
  conceptHints: string[];
  shortPhrases: string[];
  miniDialogueLines: string[];
  scenarioPrompts: string[];
  notes: string[];
}

interface DialogueTopicDefinition {
  id: string;
  label: string;
  inferredDomain: string;
  themeTags: IslandTag[];
  requiredForms: string[];
  supportingForms: string[];
  turns: DialogueTurnDefinition[];
}

interface DialogueTurnDefinition {
  speaker: string;
  simplified: string;
  pinyin: string;
  english: string;
  forms: string[];
  grammarPointIds: string[];
  episodeBeat: string;
  scenePurpose: string;
}

function dialogueTurn(
  speaker: string,
  simplified: string,
  pinyin: string,
  english: string,
  forms: string[],
  grammarPointIds: string[],
  episodeBeat: string,
  scenePurpose: string
): DialogueTurnDefinition {
  return { speaker, simplified, pinyin, english, forms, grammarPointIds, episodeBeat, scenePurpose };
}

const dialogueTopicDefinitions: DialogueTopicDefinition[] = [
  {
    id: "topic-adjusting-to-daily-life",
    label: "Adjusting to daily life",
    inferredDomain: "life-reflection",
    themeTags: ["daily-life", "social", "description"],
    requiredForms: ["现在", "生活", "习惯", "事情", "可以", "处理", "觉得", "表达"],
    supportingForms: ["以前", "听", "说", "意思", "慢慢", "完美", "重要"],
    turns: [
      dialogueTurn("小雨", "你现在觉得这里怎么样？", "nǐ xiànzài juéde zhèlǐ zěnme yàng?", "How do you feel about here now?", ["你", "现在", "觉得", "这里", "怎么"], [], "opening-question", "ask Alex about current life"),
      dialogueTurn("Alex", "我觉得我比较习惯这里了。", "wǒ juéde wǒ bǐjiào xíguàn zhèlǐ le.", "I feel I am more used to being here now.", ["我", "觉得", "我", "比较", "习惯", "这里", "了"], ["grammar-le-completion"], "life-status", "state adjustment"),
      dialogueTurn("小雨", "变化是什么？", "biànhuà shì shénme?", "What changed?", ["变化", "是", "什么"], ["grammar-shi-identity"], "follow-up", "ask for concrete change"),
      dialogueTurn("Alex", "我现在可以自己处理事情了。", "wǒ xiànzài kěyǐ zìjǐ chǔlǐ shìqing le.", "Now I can handle things myself.", ["我", "现在", "可以", "自己", "处理", "事情", "了"], ["grammar-le-completion"], "capability", "name practical independence"),
      dialogueTurn("小雨", "听、说呢？", "tīng, shuō ne?", "What about listening and speaking?", ["听", "说", "呢"], [], "language-practice", "ask about communication skill"),
      dialogueTurn("Alex", "以前我不开口，现在我慢慢说。", "yǐqián wǒ bù kāikǒu, xiànzài wǒ mànmàn shuō.", "Before I did not open my mouth; now I slowly speak.", ["以前", "我", "不", "开口", "现在", "我", "慢慢", "说"], ["grammar-bu-negation"], "change", "contrast past and present"),
      dialogueTurn("小雨", "这样很重要。", "zhèyàng hěn zhòngyào.", "That is important.", ["这样", "很", "重要"], ["grammar-hen-adjective"], "validation", "respond naturally"),
      dialogueTurn("Alex", "我觉得重要的不是完美，是慢慢表达自己的意思。", "wǒ juéde zhòngyào de bú shì wánměi, shì mànmàn biǎodá zìjǐ de yìsi.", "I think the important thing is not perfection; it is slowly expressing my meaning.", ["我", "觉得", "重要", "的", "不", "是", "完美", "是", "慢慢", "表达", "自己", "的", "意思"], ["grammar-shi-identity", "grammar-bu-negation"], "reflection", "end with useful reflective language")
    ]
  },
  {
    id: "topic-language-progress",
    label: "Language progress and confidence",
    inferredDomain: "language-progress",
    themeTags: ["social", "shadowing", "description"],
    requiredForms: ["语言", "进步", "紧张", "敢", "听", "说", "日常"],
    supportingForms: ["继续", "可是", "已经", "处理", "解释", "意思"],
    turns: [
      dialogueTurn("小雨", "你觉得语言方面进步了吗？", "nǐ juéde yǔyán fāngmiàn jìnbù le ma?", "Do you feel you have improved in language?", ["你", "觉得", "语言", "方面", "进步", "了", "吗"], ["grammar-ma-question", "grammar-le-completion"], "opening-question", "ask about language progress"),
      dialogueTurn("Alex", "有进步，可是还要继续学。", "yǒu jìnbù, kěshì hái yào jìxù xué.", "There is progress, but I still need to keep learning.", ["有", "进步", "可是", "还", "要", "继续", "学"], ["grammar-you-possession"], "balanced-answer", "avoid overclaiming"),
      dialogueTurn("小雨", "现在还紧张吗？", "xiànzài hái jǐnzhāng ma?", "Are you still nervous now?", ["现在", "还", "紧张", "吗"], ["grammar-ma-question"], "emotion-check", "ask about confidence"),
      dialogueTurn("Alex", "有时候还紧张，但是我比较敢说了。", "yǒu shíhou hái jǐnzhāng, dànshì wǒ bǐjiào gǎn shuō le.", "Sometimes I am still nervous, but I dare to speak more now.", ["有", "时候", "还", "紧张", "但是", "我", "比较", "敢", "说", "了"], ["grammar-le-completion"], "confidence", "state realistic progress"),
      dialogueTurn("小雨", "日常的事情可以处理吗？", "rìcháng de shìqing kěyǐ chǔlǐ ma?", "Can you handle daily things?", ["日常", "的", "事情", "可以", "处理", "吗"], ["grammar-ma-question"], "daily-check", "connect language to life"),
      dialogueTurn("Alex", "可以。我听不懂的时候，会问，也会解释自己的意思。", "kěyǐ. wǒ tīng bù dǒng de shíhou, huì wèn, yě huì jiěshì zìjǐ de yìsi.", "Yes. When I do not understand, I ask, and I can explain what I mean.", ["可以", "我", "听", "不", "懂", "的", "时候", "会", "问", "也", "会", "解释", "自己", "的", "意思"], ["grammar-bu-negation", "grammar-hui-ability"], "repair-strategy", "show useful communication repair")
    ]
  },
  {
    id: "topic-phone-bank-hotel",
    label: "Phone, bank, and hotel basics",
    inferredDomain: "first-errands",
    themeTags: ["shopping", "daily-life", "location"],
    requiredForms: ["手机", "银行", "卡", "酒店", "咖啡", "钱"],
    supportingForms: ["买", "哪里", "可以", "没有", "问"],
    turns: [
      dialogueTurn("小雨", "今天你要处理什么事情？", "jīntiān nǐ yào chǔlǐ shénme shìqing?", "What do you need to handle today?", ["今天", "你", "要", "处理", "什么", "事情"], [], "opening-question", "ask about errands"),
      dialogueTurn("Alex", "我想买手机卡，也想去银行。", "wǒ xiǎng mǎi shǒujī kǎ, yě xiǎng qù yínháng.", "I want to buy a phone card and also go to the bank.", ["我", "想", "买", "手机", "卡", "也", "想", "去", "银行"], ["grammar-xiang-desire", "grammar-qu-motion"], "errand-list", "state practical errands"),
      dialogueTurn("小雨", "酒店在哪里？你知道吗？", "jiǔdiàn zài nǎlǐ? nǐ zhīdào ma?", "Where is the hotel? Do you know?", ["酒店", "在", "哪里", "你", "知道", "吗"], ["grammar-zai-location", "grammar-ma-question"], "location-check", "check lodging location"),
      dialogueTurn("Alex", "我知道酒店在哪里，可是银行我还不知道。", "wǒ zhīdào jiǔdiàn zài nǎlǐ, kěshì yínháng wǒ hái bù zhīdào.", "I know where the hotel is, but I still do not know the bank.", ["我", "知道", "酒店", "在", "哪里", "可是", "银行", "我", "还", "不", "知道"], ["grammar-zai-location", "grammar-bu-negation"], "partial-knowledge", "explain what is known and unknown"),
      dialogueTurn("小雨", "没有钱的时候，先去银行。", "méiyǒu qián de shíhou, xiān qù yínháng.", "When you do not have money, go to the bank first.", ["没有", "钱", "的", "时候", "先", "去", "银行"], ["grammar-meiyou-negation", "grammar-qu-motion"], "advice", "give practical order"),
      dialogueTurn("Alex", "好。然后我喝咖啡，慢慢处理。", "hǎo. ránhòu wǒ hē kāfēi, mànmàn chǔlǐ.", "Okay. Then I drink coffee and handle it slowly.", ["好", "然后", "我", "喝", "咖啡", "慢慢", "处理"], [], "closure", "end with natural pacing")
    ]
  },
  {
    id: "topic-package-and-clarification",
    label: "Package pickup and clarification",
    inferredDomain: "errand-clarification",
    themeTags: ["daily-life", "question", "social"],
    requiredForms: ["包裹", "拿", "问题", "解释", "意思"],
    supportingForms: ["问", "哪里", "时间", "可以"],
    turns: [
      dialogueTurn("小雨", "你今天要拿什么？", "nǐ jīntiān yào ná shénme?", "What do you need to pick up today?", ["你", "今天", "要", "拿", "什么"], [], "opening-question", "ask about the errand"),
      dialogueTurn("Alex", "我要拿包裹，可是现在有问题。", "wǒ yào ná bāoguǒ, kěshì xiànzài yǒu wèntí.", "I need to pick up a package, but there is a problem now.", ["我", "要", "拿", "包裹", "可是", "现在", "有", "问题"], ["grammar-you-possession"], "problem", "state the errand problem"),
      dialogueTurn("小雨", "问题是什么？", "wèntí shì shénme?", "What is the problem?", ["问题", "是", "什么"], ["grammar-shi-identity"], "clarification", "ask for the problem"),
      dialogueTurn("Alex", "我不懂他的意思。", "wǒ bù dǒng tā de yìsi.", "I do not understand what he means.", ["我", "不", "懂", "他", "的", "意思"], ["grammar-bu-negation"], "comprehension-gap", "name the issue"),
      dialogueTurn("小雨", "你可以问他，也可以请他解释。", "nǐ kěyǐ wèn tā, yě kěyǐ qǐng tā jiěshì.", "You can ask him and also ask him to explain.", ["你", "可以", "问", "他", "也", "可以", "请", "他", "解释"], [], "repair-advice", "suggest repair language"),
      dialogueTurn("Alex", "好，我慢慢问。", "hǎo, wǒ mànmàn wèn.", "Okay, I will ask slowly.", ["好", "我", "慢慢", "问"], [], "closure", "close with action")
    ]
  },
  {
    id: "topic-airport-transfer",
    label: "Airport transfer",
    inferredDomain: "transport-location",
    themeTags: ["transport", "location", "time"],
    requiredForms: ["机场", "酒店", "到", "路", "时间"],
    supportingForms: ["哪里", "现在", "没有", "前面"],
    turns: [
      dialogueTurn("小雨", "你到机场了吗？", "nǐ dào jīchǎng le ma?", "Have you arrived at the airport?", ["你", "到", "机场", "了", "吗"], ["grammar-le-completion", "grammar-ma-question"], "opening-question", "check arrival"),
      dialogueTurn("Alex", "到了。机场很大，我很紧张。", "dào le. jīchǎng hěn dà, wǒ hěn jǐnzhāng.", "I arrived. The airport is big, and I am nervous.", ["到", "了", "机场", "很", "大", "我", "很", "紧张"], ["grammar-le-completion", "grammar-hen-adjective"], "arrival-status", "make the scene human"),
      dialogueTurn("小雨", "你现在要去哪里？", "nǐ xiànzài yào qù nǎlǐ?", "Where do you need to go now?", ["你", "现在", "要", "去", "哪里"], ["grammar-qu-motion"], "destination-question", "ask destination"),
      dialogueTurn("Alex", "我要去酒店，可是不知道路。", "wǒ yào qù jiǔdiàn, kěshì bù zhīdào lù.", "I need to go to the hotel, but I do not know the way.", ["我", "要", "去", "酒店", "可是", "不", "知道", "路"], ["grammar-qu-motion", "grammar-bu-negation"], "route-gap", "state transport problem"),
      dialogueTurn("小雨", "没有时间的时候，先问路。", "méiyǒu shíjiān de shíhou, xiān wèn lù.", "When you do not have time, ask for directions first.", ["没有", "时间", "的", "时候", "先", "问", "路"], ["grammar-meiyou-negation"], "advice", "give simple strategy"),
      dialogueTurn("Alex", "好，我先问，慢慢去酒店。", "hǎo, wǒ xiān wèn, mànmàn qù jiǔdiàn.", "Okay, I will ask first and go slowly to the hotel.", ["好", "我", "先", "问", "慢慢", "去", "酒店"], ["grammar-qu-motion"], "closure", "close with action")
    ]
  },
  {
    id: "topic-procedures-and-food",
    label: "Procedures and food after an errand",
    inferredDomain: "admin-food",
    themeTags: ["work", "food", "daily-life"],
    requiredForms: ["手续", "办", "饭店", "问题", "时间"],
    supportingForms: ["处理", "朋友", "解释", "然后"],
    turns: [
      dialogueTurn("小雨", "今天手续办好了吗？", "jīntiān shǒuxù bàn hǎo le ma?", "Did the procedure go okay today?", ["今天", "手续", "办", "好", "了", "吗"], ["grammar-le-completion", "grammar-ma-question"], "opening-question", "ask about admin task"),
      dialogueTurn("Alex", "还没有。问题比较大。", "hái méiyǒu. wèntí bǐjiào dà.", "Not yet. The problem is fairly big.", ["还", "没有", "问题", "比较", "大"], ["grammar-meiyou-negation"], "problem", "state admin difficulty"),
      dialogueTurn("小雨", "你知道怎么处理吗？", "nǐ zhīdào zěnme chǔlǐ ma?", "Do you know how to handle it?", ["你", "知道", "怎么", "处理", "吗"], ["grammar-ma-question"], "strategy-question", "ask for method"),
      dialogueTurn("Alex", "我知道，可是还需要别人解释。", "wǒ zhīdào, kěshì hái xūyào biérén jiěshì.", "I know, but I still need someone else to explain.", ["我", "知道", "可是", "还", "需要", "别人", "解释"], [], "partial-understanding", "state realistic understanding"),
      dialogueTurn("小雨", "办完以后，我们去饭店。", "bàn wán yǐhòu, wǒmen qù fàndiàn.", "After finishing it, we will go to a restaurant.", ["办", "完", "以后", "我们", "去", "饭店"], ["grammar-qu-motion"], "reward", "connect errand to food"),
      dialogueTurn("Alex", "好。先处理事情，然后吃饭。", "hǎo. xiān chǔlǐ shìqing, ránhòu chīfàn.", "Okay. Handle the matter first, then eat.", ["好", "先", "处理", "事情", "然后", "吃饭"], [], "closure", "set practical order")
    ]
  },
  {
    id: "topic-adult-routine",
    label: "Adult routine under pressure",
    inferredDomain: "adult-routine",
    themeTags: ["work", "daily-life", "time"],
    requiredForms: ["手续", "日常", "生活", "工作", "继续", "处理"],
    supportingForms: ["紧张", "习惯", "问题", "时间"],
    turns: [
      dialogueTurn("小雨", "你现在的日常生活怎么样？", "nǐ xiànzài de rìcháng shēnghuó zěnme yàng?", "How is your daily life now?", ["你", "现在", "的", "日常", "生活", "怎么"], [], "opening-question", "ask about routine"),
      dialogueTurn("Alex", "工作、手续、生活，都比较难。", "gōngzuò, shǒuxù, shēnghuó, dōu bǐjiào nán.", "Work, procedures, and life are all fairly difficult.", ["工作", "手续", "生活", "都", "比较", "难"], [], "pressure-list", "name adult-life load"),
      dialogueTurn("小雨", "你还紧张吗？", "nǐ hái jǐnzhāng ma?", "Are you still nervous?", ["你", "还", "紧张", "吗"], ["grammar-ma-question"], "emotion-check", "ask about pressure"),
      dialogueTurn("Alex", "有时候紧张，可是我已经比较习惯了。", "yǒu shíhou jǐnzhāng, kěshì wǒ yǐjīng bǐjiào xíguàn le.", "Sometimes I am nervous, but I am already more used to it.", ["有", "时候", "紧张", "可是", "我", "已经", "比较", "习惯", "了"], ["grammar-le-completion"], "progress", "show adjustment"),
      dialogueTurn("小雨", "你怎么处理？", "nǐ zěnme chǔlǐ?", "How do you handle it?", ["你", "怎么", "处理"], [], "strategy-question", "ask strategy"),
      dialogueTurn("Alex", "我慢慢处理，也继续学中文。", "wǒ mànmàn chǔlǐ, yě jìxù xué Zhōngwén.", "I handle it slowly, and I keep studying Chinese.", ["我", "慢慢", "处理", "也", "继续", "学", "中文"], [], "closure", "connect adult life and language")
    ]
  },
  {
    id: "topic-taxi-city-repair",
    label: "Taxi and city repair language",
    inferredDomain: "transport-repair",
    themeTags: ["transport", "social", "location"],
    requiredForms: ["出租车", "路", "酒店", "问", "解释"],
    supportingForms: ["司机", "哪里", "时间", "紧张"],
    turns: [
      dialogueTurn("小雨", "你今天坐出租车了吗？", "nǐ jīntiān zuò chūzūchē le ma?", "Did you take a taxi today?", ["你", "今天", "坐", "出租车", "了", "吗"], ["grammar-le-completion", "grammar-ma-question"], "opening-question", "ask about taxi"),
      dialogueTurn("Alex", "坐了。司机说得很快。", "zuò le. sījī shuō de hěn kuài.", "I did. The driver spoke very fast.", ["坐", "了", "司机", "说", "得", "很", "快"], ["grammar-le-completion", "grammar-hen-adjective"], "difficulty", "state listening problem"),
      dialogueTurn("小雨", "你听懂了吗？", "nǐ tīng dǒng le ma?", "Did you understand?", ["你", "听", "懂", "了", "吗"], ["grammar-le-completion", "grammar-ma-question"], "comprehension-check", "ask about understanding"),
      dialogueTurn("Alex", "没有完全懂，所以我请他再解释。", "méiyǒu wánquán dǒng, suǒyǐ wǒ qǐng tā zài jiěshì.", "I did not completely understand, so I asked him to explain again.", ["没有", "完全", "懂", "所以", "我", "请", "他", "再", "解释"], ["grammar-meiyou-negation"], "repair", "use repair strategy"),
      dialogueTurn("小雨", "最后你到酒店了吗？", "zuìhòu nǐ dào jiǔdiàn le ma?", "In the end, did you get to the hotel?", ["最后", "你", "到", "酒店", "了", "吗"], ["grammar-le-completion", "grammar-ma-question"], "outcome", "ask result"),
      dialogueTurn("Alex", "到了。虽然紧张，可是我知道怎么问路了。", "dào le. suīrán jǐnzhāng, kěshì wǒ zhīdào zěnme wèn lù le.", "I arrived. Although I was nervous, I knew how to ask for directions.", ["到", "了", "虽然", "紧张", "可是", "我", "知道", "怎么", "问", "路", "了"], ["grammar-le-completion"], "closure", "end with useful transport confidence")
    ]
  },
  {
    id: "topic-taiwan-bridge",
    label: "Taiwan bridge and regional life",
    inferredDomain: "regional-reflection",
    themeTags: ["daily-life", "social", "reading"],
    requiredForms: ["台湾", "中国", "生活", "语言", "朋友"],
    supportingForms: ["比较", "习惯", "日常", "进步"],
    turns: [
      dialogueTurn("小雨", "你在台湾的时候，生活怎么样？", "nǐ zài Táiwān de shíhou, shēnghuó zěnme yàng?", "When you were in Taiwan, how was life?", ["你", "在", "台湾", "的", "时候", "生活", "怎么"], ["grammar-zai-location"], "opening-question", "ask regional life question"),
      dialogueTurn("Alex", "我比较习惯台湾的日常生活了。", "wǒ bǐjiào xíguàn Táiwān de rìcháng shēnghuó le.", "I became more used to daily life in Taiwan.", ["我", "比较", "习惯", "台湾", "的", "日常", "生活", "了"], ["grammar-le-completion"], "taiwan-life", "state regional adjustment"),
      dialogueTurn("小雨", "那去中国以后呢？", "nà qù Zhōngguó yǐhòu ne?", "Then after going to China?", ["那", "去", "中国", "以后", "呢"], ["grammar-qu-motion"], "bridge-question", "ask bridge comparison"),
      dialogueTurn("Alex", "我还要继续习惯，可是语言方面有进步。", "wǒ hái yào jìxù xíguàn, kěshì yǔyán fāngmiàn yǒu jìnbù.", "I still need to keep getting used to it, but I have improved in language.", ["我", "还", "要", "继续", "习惯", "可是", "语言", "方面", "有", "进步"], ["grammar-you-possession"], "language-progress", "connect region and language"),
      dialogueTurn("小雨", "朋友可以帮你吗？", "péngyou kěyǐ bāng nǐ ma?", "Can friends help you?", ["朋友", "可以", "帮", "你", "吗"], ["grammar-ma-question"], "support-question", "ask about support"),
      dialogueTurn("Alex", "可以。最重要的是慢慢问，慢慢生活下去。", "kěyǐ. zuì zhòngyào de shì mànmàn wèn, mànmàn shēnghuó xiàqù.", "Yes. The most important thing is to ask slowly and keep living slowly.", ["可以", "最", "重要", "的", "是", "慢慢", "问", "慢慢", "生活", "下去"], ["grammar-shi-identity"], "closure", "end with reflective practical language")
    ]
  },
  {
    id: "topic-full-reflective-review",
    label: "Full adult-life reflection",
    inferredDomain: "review-reflection",
    themeTags: ["daily-life", "social", "health"],
    requiredForms: ["手续", "包裹", "医生", "出租车", "台湾", "生活", "表达"],
    supportingForms: ["完美", "进步", "语言", "紧张", "处理"],
    turns: [
      dialogueTurn("小雨", "如果让你说现在的生活，你会怎么说？", "rúguǒ ràng nǐ shuō xiànzài de shēnghuó, nǐ huì zěnme shuō?", "If you had to describe your life now, what would you say?", ["如果", "让", "你", "说", "现在", "的", "生活", "你", "会", "怎么", "说"], ["grammar-hui-ability"], "opening-question", "ask broad reflection"),
      dialogueTurn("Alex", "我会说，我比较习惯这里了。", "wǒ huì shuō, wǒ bǐjiào xíguàn zhèlǐ le.", "I would say I am more used to being here now.", ["我", "会", "说", "我", "比较", "习惯", "这里", "了"], ["grammar-hui-ability", "grammar-le-completion"], "status", "state adjustment"),
      dialogueTurn("小雨", "比如哪些事情？", "bǐrú nǎxiē shìqing?", "For example, which things?", ["比如", "哪些", "事情"], [], "example-question", "ask for examples"),
      dialogueTurn("Alex", "比如坐出租车、看医生、办手续、拿包裹。", "bǐrú zuò chūzūchē, kàn yīshēng, bàn shǒuxù, ná bāoguǒ.", "For example, taking a taxi, seeing a doctor, handling procedures, and picking up packages.", ["比如", "坐", "出租车", "看", "医生", "办", "手续", "拿", "包裹"], [], "examples", "name concrete adult-life tasks"),
      dialogueTurn("小雨", "语言方面呢？", "yǔyán fāngmiàn ne?", "What about language?", ["语言", "方面", "呢"], [], "language-question", "ask language angle"),
      dialogueTurn("Alex", "当然还要继续学，可是我比较敢表达自己的意思了。", "dāngrán hái yào jìxù xué, kěshì wǒ bǐjiào gǎn biǎodá zìjǐ de yìsi le.", "Of course I still need to keep learning, but I dare more to express what I mean.", ["当然", "还", "要", "继续", "学", "可是", "我", "比较", "敢", "表达", "自己", "的", "意思", "了"], ["grammar-le-completion"], "language-progress", "show confidence without claiming perfection"),
      dialogueTurn("小雨", "你觉得最重要的是什么？", "nǐ juéde zuì zhòngyào de shì shénme?", "What do you think is most important?", ["你", "觉得", "最", "重要", "的", "是", "什么"], ["grammar-shi-identity"], "value-question", "ask principle"),
      dialogueTurn("Alex", "不是完美，是慢慢习惯、慢慢表达、慢慢生活下去。", "bú shì wánměi, shì mànmàn xíguàn, mànmàn biǎodá, mànmàn shēnghuó xiàqù.", "It is not perfection; it is slowly getting used to things, slowly expressing myself, and slowly continuing to live.", ["不", "是", "完美", "是", "慢慢", "习惯", "慢慢", "表达", "慢慢", "生活", "下去"], ["grammar-shi-identity", "grammar-bu-negation"], "closure", "finish with natural reflective CI")
    ]
  }
];

const islandDefinitions: IslandDefinition[] = [
  {
    id: "pan-island-alex-first-arrival",
    label: "Alex arrival: first orientation",
    unlockAtWordCount: 1000,
    themeTags: ["transport", "location", "time"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["go", "come", "arrive", "where", "here", "there", "now", "today", "school", "road", "walk", "know"],
    shortPhrases: ["我在这里。", "学校在哪里？", "我不知道。", "我走路。"],
    miniDialogueLines: ["Alex: 学校在哪里？", "Local: 在这里。", "Alex: 好，谢谢。"],
    scenarioPrompts: ["Ask where a place is.", "Say you do not know yet.", "Confirm that you understand now."],
    notes: ["Alex has arrived, but the Mandarin stays inside the first 999 known-word pool."]
  },
  {
    id: "pan-island-alex-phone-bank-hotel",
    label: "Alex first errands: phone, bank, hotel",
    unlockAtWordCount: 2000,
    themeTags: ["shopping", "daily-life", "location"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["buy", "bank", "phone", "card", "hotel", "coffee", "money", "water", "need", "want", "room"],
    shortPhrases: ["我想买手机卡。", "银行在哪里？", "我住酒店。", "这个可以吗？"],
    miniDialogueLines: ["Alex: 我想买手机卡。", "Clerk: 这个可以。", "Alex: 银行在哪里？"],
    scenarioPrompts: ["Buy a phone card.", "Ask where the bank is.", "Check into a simple hotel."],
    notes: ["Alex handles the first practical tasks: phone/card, bank, hotel, and coffee."]
  },
  {
    id: "pan-island-alex-documents-admin",
    label: "Alex documents and admin",
    unlockAtWordCount: 3000,
    themeTags: ["work", "time", "question"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["passport", "document", "problem", "ask", "answer", "bank", "phone", "card", "store", "expensive"],
    shortPhrases: ["我有护照。", "现在有问题。", "我可以问你吗？", "谢谢你。"],
    miniDialogueLines: ["Alex: 我有护照。", "Clerk: 现在有问题。", "Alex: 我可以问你吗？"],
    scenarioPrompts: ["Show a document.", "Explain that there is a problem.", "Ask for help at a counter."],
    notes: ["Admin and document pressure begins after the learner has a stronger controlled base."]
  },
  {
    id: "pan-island-alex-airport-hotel-transfer",
    label: "Alex airport and hotel transfer",
    unlockAtWordCount: 4000,
    themeTags: ["transport", "location", "time"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["airport", "hotel", "room", "station", "road", "car", "arrive", "leave", "late", "tomorrow"],
    shortPhrases: ["我到了机场。", "我想去酒店。", "车在这里。", "房间在哪里？"],
    miniDialogueLines: ["Alex: 我想去酒店。", "Driver: 车在这里。", "Alex: 好，谢谢。"],
    scenarioPrompts: ["Find transport from the airport.", "Ask for the hotel.", "Confirm the room location."],
    notes: ["Airport and hotel transfer uses explicit island-essential overrides where raw rank is too late."]
  },
  {
    id: "pan-island-alex-taxi-city-life",
    label: "Alex taxi and city life",
    unlockAtWordCount: 5000,
    themeTags: ["transport", "shopping", "daily-life"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["taxi", "restaurant", "guesthouse", "store", "coffee", "road", "street", "car", "expensive", "cheap"],
    shortPhrases: ["我坐出租车。", "我想去饭店。", "这个很贵。", "晚上我回酒店。"],
    miniDialogueLines: ["Alex: 我想去饭店。", "Driver: 可以。", "Alex: 这个很贵吗？"],
    scenarioPrompts: ["Take a taxi.", "Go to a restaurant.", "React to a price."],
    notes: ["Taxi and denser city logistics unlock with visible island-essential override metadata."]
  },
  {
    id: "pan-island-alex-appointments-food",
    label: "Alex appointments and food routines",
    unlockAtWordCount: 6000,
    themeTags: ["food", "time", "social"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["appointment", "time", "hour", "minute", "restaurant", "eat", "drink", "friend", "wait", "busy"],
    shortPhrases: ["我等朋友。", "我们去饭店。", "这个菜很好。", "我一会儿回来。"],
    miniDialogueLines: ["Alex: 我等朋友。", "Friend: 我一会儿来。", "Alex: 我们去饭店。"],
    scenarioPrompts: ["Wait for a friend.", "Arrange a meal.", "Say you will return soon."],
    notes: ["Food and appointments become a repeatable island once time and social language are stronger."]
  },
  {
    id: "pan-island-alex-work-housing",
    label: "Alex work and housing routine",
    unlockAtWordCount: 7000,
    themeTags: ["work", "home", "daily-life"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["work", "home", "room", "door", "table", "chair", "write", "read", "morning", "evening"],
    shortPhrases: ["我今天上班。", "晚上我回家。", "房间不大。", "我写这个。"],
    miniDialogueLines: ["Alex: 我今天上班。", "Friend: 晚上回来吗？", "Alex: 我晚上回家。"],
    scenarioPrompts: ["Talk about work.", "Describe a room.", "Return home in the evening."],
    notes: ["Work and housing are adult operating-life domains, so they stay after the 2000-word threshold."]
  },
  {
    id: "pan-island-alex-health-visit",
    label: "Alex simple health visit",
    unlockAtWordCount: 8000,
    themeTags: ["health", "time", "question"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["doctor", "medicine", "illness", "rest", "question", "answer", "today", "tomorrow", "can", "need"],
    shortPhrases: ["我今天不舒服。", "我想看医生。", "我需要休息。", "明天可以吗？"],
    miniDialogueLines: ["Alex: 我想看医生。", "Doctor: 你需要休息。", "Alex: 明天可以吗？"],
    scenarioPrompts: ["Say you feel unwell.", "Ask to see a doctor.", "Understand simple advice."],
    notes: ["Health is useful but not early survival content, so it stays in the later shared arc."]
  },
  {
    id: "pan-island-alex-admin-pressure",
    label: "Alex admin pressure and follow-up",
    unlockAtWordCount: 9000,
    themeTags: ["work", "question", "social"],
    allowedContent: ["sentence-stream", "dialogue", "short-reading", "story"],
    conceptHints: ["document", "answer", "ask", "because", "but", "then", "again", "problem", "work", "time"],
    shortPhrases: ["我还有问题。", "但是我没有时间。", "然后我再问。", "请你帮我。"],
    miniDialogueLines: ["Alex: 我还有问题。", "Clerk: 你明天再来。", "Alex: 好，我再问。"],
    scenarioPrompts: ["Handle a follow-up problem.", "Explain time pressure.", "Ask again politely."],
    notes: ["This island adds pressure and follow-up without promoting raw story output into learner-facing material."]
  },
  {
    id: "pan-island-alex-taiwan-to-china",
    label: "Alex Taiwan to China bridge",
    unlockAtWordCount: 10000,
    themeTags: ["daily-life", "social", "reading"],
    allowedContent: ["sentence-stream", "short-reading", "story"],
    conceptHints: ["Taiwan", "China", "Beijing", "friend", "home", "work", "morning", "evening", "because", "but", "then", "again"],
    shortPhrases: ["我在台湾。", "今天我去中国。", "我到了北京。", "我想回来。"],
    miniDialogueLines: ["Friend: 你在台湾吗？", "Alex: 今天我去中国。", "Friend: 到了以后问我。"],
    scenarioPrompts: ["Bridge Taiwan and Mainland place language.", "Track regional place names.", "Review a longer travel arc."],
    notes: ["The broader Taiwan-to-China arc sits at the end until regional/place-name handling is stronger."]
  }
];

export function buildPanMandarinIslandUnlocks(concepts: PanMandarinConcept[], candidates: PanMandarinCiCandidate[]): PanMandarinIslandUnlock[] {
  return islandDefinitions.map((definition) => {
    const eligibleConcepts = concepts
      .filter((concept) => (concept.communicationPathRank ?? Number.MAX_SAFE_INTEGER) <= definition.unlockAtWordCount)
      .filter((concept) => conceptMatchesIsland(concept, definition))
      .slice(0, 80);
    const eligibleIds = new Set(eligibleConcepts.map((concept) => concept.conceptId));
    const sentenceCandidates = candidates
      .filter((candidate) => candidate.naturalnessDisposition === "accepted-review")
      .filter((candidate) => candidate.mode === "ci-plus-one" || candidate.mode === "bootstrap")
      .filter((candidate) => (candidate.targetCommunicationPathRank <= definition.unlockAtWordCount || eligibleIds.has(candidate.conceptId)))
      .filter((candidate) => eligibleIds.has(candidate.conceptId) || candidate.grammarPointIds.length > 0)
      .slice(0, 60);
    const status = sentenceCandidates.length >= 12 && eligibleConcepts.length >= 12 ? "review-ready" : "needs-more-ci-coverage";

    return {
      id: definition.id,
      label: definition.label,
      unlockAtWordCount: definition.unlockAtWordCount,
      themeTags: definition.themeTags,
      purpose: "language-island",
      allowedContent: definition.allowedContent,
      status,
      reviewStatus: "review-only",
      eligibleConceptIds: eligibleConcepts.map((concept) => concept.conceptId),
      sentenceCandidateIds: sentenceCandidates.map((candidate) => candidate.id),
      notes: [
        ...definition.notes,
        "Review-only pan-Mandarin island queue; it does not promote content into the learner-facing stream."
      ]
    };
  });
}

export function buildPanMandarinStoryTopicPlan(concepts: PanMandarinConcept[]): PanMandarinStoryTopicPlan[] {
  const conceptByForm = conceptsByForm(concepts);
  const selectedTopicIds = new Set<string>();

  return Array.from({ length: 10 }, (_, index) => {
    const maxAllowedRank = (index + 1) * 1000;
    const availableConcepts = concepts.filter((concept) => (concept.communicationPathRank ?? Number.MAX_SAFE_INTEGER) <= maxAllowedRank);
    const practicalClusterForms = availableConcepts
      .filter((concept) => concept.sentenceReadiness.sentenceability === "sentence-target")
      .filter((concept) => !["low-value-specialist"].includes(concept.category))
      .slice(0, 80)
      .map(primaryForm);
    const candidates = dialogueTopicDefinitions.map((definition) => topicCandidate(definition, conceptByForm, maxAllowedRank));
    const supportedTopicCandidates = candidates
      .filter((candidate) => candidate.status === "supported")
      .sort((a, b) => b.supportScore - a.supportScore || a.id.localeCompare(b.id));
    const blockedTopicCandidates = candidates.filter((candidate) => candidate.status === "blocked");
    const selectedTopic = supportedTopicCandidates.find((candidate) => !selectedTopicIds.has(candidate.id));
    if (selectedTopic) selectedTopicIds.add(selectedTopic.id);

    return {
      id: `pan-story-topic-plan-${String(index + 1).padStart(2, "0")}`,
      knownVocabularyRange: [1, maxAllowedRank],
      unlockAtWordCount: maxAllowedRank + 1,
      maxAllowedCommunicationPathRank: maxAllowedRank,
      availableConceptCount: availableConcepts.length,
      practicalClusterForms,
      supportedTopicCandidates,
      blockedTopicCandidates,
      selectedTopicId: selectedTopic?.id,
      selectedTopicLabel: selectedTopic?.label,
      selectedTopicSupportScore: selectedTopic?.supportScore,
      selectedTopicEvidenceConceptIds: selectedTopic?.requiredConceptIds ?? [],
      status: selectedTopic ? "story-ready" : "blocked",
      blockingReasons: selectedTopic ? [] : ["No unused natural dialogue topic is fully supported by this known vocabulary band."]
    };
  });
}

export function buildPanMandarinStoryQueues(
  islands: PanMandarinIslandUnlock[],
  candidates: PanMandarinCiCandidate[],
  concepts: PanMandarinConcept[] = []
): PanMandarinStoryQueue[] {
  const topicPlans = buildPanMandarinStoryTopicPlan(concepts);

  return topicPlans.map((topicPlan, index) => {
    const topicDefinition = dialogueTopicDefinitions.find((definition) => definition.id === topicPlan.selectedTopicId);
    const island = islands.find((candidate) => candidate.unlockAtWordCount <= topicPlan.maxAllowedCommunicationPathRank)
      ?? islands[0];
    if (!topicDefinition || !island) {
      return blockedTopicStory(topicPlan);
    }
    const candidatePool = candidates
      .filter((candidate) => island.sentenceCandidateIds.includes(candidate.id))
      .filter((candidate) => candidate.naturalnessDisposition === "accepted-review")
      .slice(0, Math.max(topicDefinition.turns.length * 3, 12));
    const requiredKnownConceptIds = Array.from(new Set(candidatePool.flatMap((candidate) => candidate.knownConceptIds))).slice(0, 80);
    const targetNewConceptIds = Array.from(new Set(candidatePool.flatMap((candidate) => candidate.newConceptIds))).slice(0, topicDefinition.turns.length);
    const grammarPointIds = Array.from(new Set(candidatePool.flatMap((candidate) => candidate.grammarPointIds))).sort();
    const blockingReasons: string[] = [];

    if (island.status !== "review-ready") blockingReasons.push("Island needs more accepted CI sentence coverage before story authoring.");
    if (topicPlan.status !== "story-ready") blockingReasons.push(...topicPlan.blockingReasons);

    return {
      id: `pan-story-${String(index + 1).padStart(2, "0")}-${topicDefinition.id}`,
      title: topicDefinition.label,
      islandId: island.id,
      unlockAtWordCount: topicPlan.unlockAtWordCount,
      knownVocabularyRange: topicPlan.knownVocabularyRange,
      maxAllowedCommunicationPathRank: topicPlan.maxAllowedCommunicationPathRank,
      themeTags: topicDefinition.themeTags,
      storyType: "dialogue-story",
      storyFormat: "dialogue-story",
      selectedTopicId: topicDefinition.id,
      topicSupportScore: topicPlan.selectedTopicSupportScore ?? 0,
      topicEvidenceConceptIds: topicPlan.selectedTopicEvidenceConceptIds,
      targetLineCount: topicDefinition.turns.length,
      requiredKnownConceptIds,
      targetNewConceptIds,
      suggestedSentenceCandidateIds: candidatePool.map((candidate) => candidate.id),
      knownCoverageTarget: [0.95, 0.98],
      maxNewConceptsPerLine: topicPlan.maxAllowedCommunicationPathRank >= 3000 ? 2 : 1,
      grammarPointIds,
      authoringBrief: `Vocabulary-derived dialogue story selected from ranks 1-${topicPlan.maxAllowedCommunicationPathRank}: ${topicDefinition.label}.`,
      status: blockingReasons.length === 0 ? "review-ready" : "needs-more-ci-coverage",
      reviewStatus: "review-only",
      blockingReasons
    };
  });
}

export function buildPanMandarinPremadeIslands(islands: PanMandarinIslandUnlock[], stories: PanMandarinStoryQueue[], candidates: PanMandarinCiCandidate[]): PanMandarinPremadeIsland[] {
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  return islands.map((island) => {
    const sentencePack = island.sentenceCandidateIds
      .map((id) => candidateById.get(id))
      .filter(isPremadeCandidate)
      .filter((candidate) => !isThinStoryOrIslandFragment(candidate.simplified))
      .slice(0, 24)
      .map((candidate, index) => premadeLine(candidate, `${island.id}-line-${String(index + 1).padStart(2, "0")}`));

    return {
      id: `premade-${island.id}`,
      sourceIslandId: island.id,
      label: island.label,
      unlockAtWordCount: island.unlockAtWordCount,
      themeTags: island.themeTags,
      reviewStatus: "review-only",
      shortPhrases: islandDefinitions.find((definition) => definition.id === island.id)?.shortPhrases ?? [],
      miniDialogueLines: islandDefinitions.find((definition) => definition.id === island.id)?.miniDialogueLines ?? [],
      scenarioPrompts: islandDefinitions.find((definition) => definition.id === island.id)?.scenarioPrompts ?? [],
      sentencePack,
      storyIds: stories.filter((story) => story.islandId === island.id).map((story) => `premade-${story.id}`),
      notes: [
        "Deterministic pre-made island pack generated from the shared pan-Mandarin 10k list and accepted review CI candidates.",
        "Still review-only until a human accepts the Mandarin as learner-facing content."
      ]
    };
  });
}

export function buildPanMandarinPremadeStories(stories: PanMandarinStoryQueue[], candidates: PanMandarinCiCandidate[], concepts: PanMandarinConcept[] = []): PanMandarinPremadeStory[] {
  const conceptByForm = conceptsByForm(concepts);
  return stories.map((story) => {
    const topicDefinition = dialogueTopicDefinitions.find((definition) => definition.id === story.selectedTopicId);
    const lines = (topicDefinition?.turns ?? [])
      .map((turn, index) => dialogueLine(turn, conceptByForm, story, `${story.id}-turn-${String(index + 1).padStart(2, "0")}`))
      .filter((line): line is PanMandarinPremadeLine => line !== undefined);
    const notes = [
      "Deterministic pre-made dialogue story generated from the vocabulary-derived topic plan.",
      "No fallback candidate-pool story lines are promoted as proper stories.",
      "Line order is stable and suitable for shared app content, but final learner-facing promotion still requires human review."
    ];
    if (lines.length < story.targetLineCount) notes.push("Story has fewer dialogue turns than the target count because unresolved or future vocabulary is blocked.");

    return {
      id: `premade-${story.id}`,
      sourceStoryQueueId: story.id,
      islandId: story.islandId,
      title: story.title,
      unlockAtWordCount: story.unlockAtWordCount,
      knownVocabularyRange: story.knownVocabularyRange,
      maxAllowedCommunicationPathRank: story.maxAllowedCommunicationPathRank,
      themeTags: story.themeTags,
      storyType: story.storyType,
      storyFormat: story.storyFormat,
      selectedTopicId: story.selectedTopicId,
      topicSupportScore: story.topicSupportScore,
      topicEvidenceConceptIds: story.topicEvidenceConceptIds,
      reviewStatus: "review-only",
      status: lines.length >= story.targetLineCount && story.status === "review-ready" ? "review-ready" : "needs-more-ci-coverage",
      milestoneKnownWordEnd: story.maxAllowedCommunicationPathRank,
      knownCoverageTarget: story.knownCoverageTarget,
      maxNewConceptsPerLine: story.maxNewConceptsPerLine,
      lines,
      turns: lines,
      authoringBrief: story.authoringBrief,
      notes
    };
  });
}

export function buildPanMandarinContentCoverageReport(
  islands: PanMandarinIslandUnlock[],
  stories: PanMandarinStoryQueue[],
  premadeIslands: PanMandarinPremadeIsland[] = [],
  premadeStories: PanMandarinPremadeStory[] = []
): PanMandarinContentCoverageReport {
  return {
    islandCount: islands.length,
    storyQueueCount: stories.length,
    premadeIslandCount: premadeIslands.length,
    premadeStoryCount: premadeStories.length,
    premadeStoryLineCount: premadeStories.reduce((sum, story) => sum + story.lines.length, 0),
    milestoneStoryCount: new Set(premadeStories.map((story) => story.unlockAtWordCount)).size,
    islandPhrasePackCount: premadeIslands.filter((island) => island.shortPhrases.length > 0).length,
    islandMiniDialogueLineCount: premadeIslands.reduce((sum, island) => sum + island.miniDialogueLines.length, 0),
    islandScenarioPromptCount: premadeIslands.reduce((sum, island) => sum + island.scenarioPrompts.length, 0),
    storyCoherenceTaggedLineCount: premadeStories
      .flatMap((story) => story.lines)
      .filter((line) => line.islandTags.length > 0 && line.episodeBeat.length > 0 && line.scenePurpose.length > 0).length,
    overrideLineCount: premadeStories.flatMap((story) => story.lines).filter((line) => line.overrideConceptIds.length > 0).length,
    overrideConceptCount: new Set(premadeStories.flatMap((story) => story.lines.flatMap((line) => line.overrideConceptIds))).size,
    reviewReadyIslandCount: islands.filter((island) => island.status === "review-ready").length,
    reviewReadyStoryQueueCount: stories.filter((story) => story.status === "review-ready").length,
    blockedStoryQueueCount: stories.filter((story) => story.status === "blocked").length,
    earliestIslandUnlockAtWordCount: Math.min(...islands.map((island) => island.unlockAtWordCount)),
    adultIslandCountBefore2000: islands.filter((island) => island.themeTags.some((tag) => tag === "work" || tag === "health") && island.unlockAtWordCount < 2000).length,
    storyQueuesWithCoverageTargets: stories.filter((story) => story.knownCoverageTarget[0] >= 0.95 && story.knownCoverageTarget[1] <= 0.98).length
  };
}

export function buildPanMandarinContentReviewQueue(
  premadeIslands: PanMandarinPremadeIsland[],
  premadeStories: PanMandarinPremadeStory[]
): PanMandarinContentReviewQueueItem[] {
  const storyItems = premadeStories.flatMap((story) =>
    story.lines.map((line, index): PanMandarinContentReviewQueueItem => ({
      id: `review-${line.id}`,
      itemType: "story-line",
      sourceId: line.id,
      islandId: story.islandId,
      storyId: story.id,
      unlockAtWordCount: story.unlockAtWordCount,
      simplified: line.simplified,
      pinyin: line.pinyin,
      english: line.english,
      islandTags: line.islandTags,
      grammarPointIds: line.grammarPointIds,
      conceptIds: line.conceptIds,
      overrideConceptIds: line.overrideConceptIds,
      overrideReasons: line.overrideReasons,
      episodeBeat: line.episodeBeat,
      speaker: line.speaker,
      scenePurpose: line.scenePurpose,
      reviewStatus: "review-only",
      reviewDisposition: "needs-human-review",
      reviewReasons: reviewReasonsForStoryLine(line, index)
    }))
  );

  const islandItems = premadeIslands.flatMap((island) => [
    ...island.shortPhrases.map((phrase, index) => islandReviewItem(island, "island-phrase", phrase, index)),
    ...island.miniDialogueLines.map((line, index) => islandReviewItem(island, "island-dialogue-line", line, index)),
    ...island.scenarioPrompts.map((prompt, index) => islandReviewItem(island, "island-scenario-prompt", prompt, index))
  ]);

  return [...storyItems, ...islandItems].sort((a, b) => a.unlockAtWordCount - b.unlockAtWordCount || a.id.localeCompare(b.id));
}

export function buildPanMandarinContentReviewReport(queue: PanMandarinContentReviewQueueItem[]): PanMandarinContentReviewReport {
  return {
    queueItemCount: queue.length,
    storyLineItemCount: queue.filter((item) => item.itemType === "story-line").length,
    islandPhraseItemCount: queue.filter((item) => item.itemType === "island-phrase").length,
    islandDialogueLineItemCount: queue.filter((item) => item.itemType === "island-dialogue-line").length,
    islandScenarioPromptItemCount: queue.filter((item) => item.itemType === "island-scenario-prompt").length,
    needsHumanReviewCount: queue.filter((item) => item.reviewDisposition === "needs-human-review").length,
    overrideItemCount: queue.filter((item) => item.overrideConceptIds.length > 0).length,
    reviewOnlyItemCount: queue.filter((item) => item.reviewStatus === "review-only").length,
    earliestUnlockAtWordCount: Math.min(...queue.map((item) => item.unlockAtWordCount)),
    latestUnlockAtWordCount: Math.max(...queue.map((item) => item.unlockAtWordCount))
  };
}

function topicCandidate(definition: DialogueTopicDefinition, conceptByForm: Map<string, PanMandarinConcept>, maxAllowedRank: number): PanMandarinStoryTopicCandidate {
  const requiredConcepts = resolveForms(definition.requiredForms, conceptByForm);
  const supportingConcepts = resolveForms(definition.supportingForms, conceptByForm).filter((concept): concept is PanMandarinConcept => concept !== undefined);
  const turnConcepts = resolveForms(allDialogueForms(definition), conceptByForm);
  const missingForms = allDialogueForms(definition).filter((form, index) => turnConcepts[index] === undefined);
  const futureForms = turnConcepts
    .filter((concept): concept is PanMandarinConcept => concept !== undefined)
    .filter((concept) => (concept.communicationPathRank ?? Number.MAX_SAFE_INTEGER) > maxAllowedRank)
    .map(primaryForm);
  const requiredMissing = definition.requiredForms.filter((form, index) => requiredConcepts[index] === undefined);
  const blockingReasons = [
    ...requiredMissing.map((form) => `required vocabulary missing: ${form}`),
    ...missingForms.map((form) => `dialogue vocabulary missing: ${form}`),
    ...futureForms.map((form) => `dialogue vocabulary outside known band: ${form}`)
  ];
  const requiredPresent = requiredConcepts.filter((concept): concept is PanMandarinConcept => concept !== undefined);
  const requiredConceptIds = Array.from(new Set(requiredPresent.map((concept) => concept.conceptId)));
  const supportingConceptIds = Array.from(new Set(supportingConcepts.map((concept) => concept.conceptId)));

  return {
    id: definition.id,
    label: definition.label,
    inferredDomain: definition.inferredDomain,
    requiredForms: definition.requiredForms,
    supportingForms: definition.supportingForms,
    requiredConceptIds,
    supportingConceptIds,
    missingForms: Array.from(new Set([...requiredMissing, ...missingForms])),
    supportScore: requiredConceptIds.length * 10 + supportingConceptIds.length,
    status: blockingReasons.length === 0 ? "supported" : "blocked",
    blockingReasons: Array.from(new Set(blockingReasons))
  };
}

function resolveForms(forms: string[], conceptByForm: Map<string, PanMandarinConcept>): Array<PanMandarinConcept | undefined> {
  return forms.map((form) => conceptByForm.get(form));
}

function allDialogueForms(definition: DialogueTopicDefinition): string[] {
  return Array.from(new Set([
    ...definition.requiredForms,
    ...definition.supportingForms,
    ...definition.turns.flatMap((turn) => turn.forms)
  ]));
}

function conceptsByForm(concepts: PanMandarinConcept[]): Map<string, PanMandarinConcept> {
  const byForm = new Map<string, PanMandarinConcept>();
  for (const concept of concepts) {
    for (const variant of concept.variants) {
      byForm.set(variant.simplified, concept);
      if (variant.traditional) byForm.set(variant.traditional, concept);
    }
  }
  return byForm;
}

function dialogueLine(
  turn: DialogueTurnDefinition,
  conceptByForm: Map<string, PanMandarinConcept>,
  story: PanMandarinStoryQueue,
  id: string
): PanMandarinPremadeLine | undefined {
  const concepts = turn.forms.map((form) => conceptByForm.get(form));
  if (concepts.some((concept) => concept === undefined)) return undefined;
  const resolvedConcepts = concepts as PanMandarinConcept[];
  if (resolvedConcepts.some((concept) => (concept.communicationPathRank ?? Number.MAX_SAFE_INTEGER) > story.maxAllowedCommunicationPathRank)) return undefined;
  const conceptIds = Array.from(new Set(resolvedConcepts.map((concept) => concept.conceptId)));
  const targetConcept = resolvedConcepts.slice().sort((a, b) => (b.communicationPathRank ?? 0) - (a.communicationPathRank ?? 0))[0];
  const maxRank = Math.max(...resolvedConcepts.map((concept) => concept.communicationPathRank ?? Number.MAX_SAFE_INTEGER));

  return {
    id,
    sourceCandidateId: `dialogue:${story.id}:${id}`,
    conceptId: targetConcept.conceptId,
    source: "dialogue-turn",
    simplified: turn.simplified,
    pinyin: turn.pinyin,
    english: turn.english,
    knownConceptIds: conceptIds,
    newConceptIds: [],
    grammarPointIds: turn.grammarPointIds,
    conceptIds,
    maxConceptCommunicationPathRank: maxRank,
    overrideConceptIds: [],
    overrideReasons: [],
    naturalnessDisposition: "accepted-review",
    islandTags: story.themeTags,
    episodeBeat: turn.episodeBeat,
    speaker: turn.speaker,
    scenePurpose: turn.scenePurpose
  };
}

function blockedTopicStory(topicPlan: PanMandarinStoryTopicPlan): PanMandarinStoryQueue {
  return {
    id: `pan-story-blocked-${topicPlan.id}`,
    title: "Blocked vocabulary-derived story",
    islandId: "blocked",
    unlockAtWordCount: topicPlan.unlockAtWordCount,
    knownVocabularyRange: topicPlan.knownVocabularyRange,
    maxAllowedCommunicationPathRank: topicPlan.maxAllowedCommunicationPathRank,
    themeTags: [],
    storyType: "dialogue-story",
    storyFormat: "dialogue-story",
    topicSupportScore: 0,
    topicEvidenceConceptIds: [],
    targetLineCount: 0,
    requiredKnownConceptIds: [],
    targetNewConceptIds: [],
    suggestedSentenceCandidateIds: [],
    knownCoverageTarget: [0.95, 0.98],
    maxNewConceptsPerLine: topicPlan.maxAllowedCommunicationPathRank >= 3000 ? 2 : 1,
    grammarPointIds: [],
    authoringBrief: "Blocked because no natural dialogue topic was fully supported by the known vocabulary band.",
    status: "blocked",
    reviewStatus: "review-only",
    blockingReasons: topicPlan.blockingReasons
  };
}

function isPremadeCandidate(candidate: PanMandarinCiCandidate | undefined): candidate is PanMandarinCiCandidate & { simplified: string; english: string } {
  return candidate !== undefined && candidate.naturalnessDisposition === "accepted-review" && typeof candidate.simplified === "string" && typeof candidate.english === "string";
}

function isThinStoryOrIslandFragment(simplified: string): boolean {
  return ["我问你。", "你回答了。", "我知道了。"].some((fragment) => simplified.includes(fragment));
}

function premadeLine(candidate: PanMandarinCiCandidate & { simplified: string; english: string }, id: string): PanMandarinPremadeLine {
  const conceptIds = Array.from(new Set([...candidate.knownConceptIds, ...candidate.newConceptIds, candidate.conceptId]));
  return {
    id,
    sourceCandidateId: candidate.id,
    conceptId: candidate.conceptId,
    source: "ci-candidate",
    simplified: candidate.simplified,
    traditional: candidate.traditional,
    pinyin: candidate.pinyin,
    english: candidate.english,
    knownConceptIds: candidate.knownConceptIds,
    newConceptIds: candidate.newConceptIds,
    grammarPointIds: candidate.grammarPointIds,
    conceptIds,
    maxConceptCommunicationPathRank: candidate.targetCommunicationPathRank,
    overrideConceptIds: [],
    overrideReasons: [],
    naturalnessDisposition: "accepted-review",
    islandTags: [],
    episodeBeat: "candidate-review-line",
    speaker: "narrator",
    scenePurpose: "reuse an accepted CI candidate inside the island review pack"
  };
}

function islandReviewItem(
  island: PanMandarinPremadeIsland,
  itemType: PanMandarinContentReviewQueueItem["itemType"],
  text: string,
  index: number
): PanMandarinContentReviewQueueItem {
  return {
    id: `review-${island.sourceIslandId}-${itemType}-${String(index + 1).padStart(2, "0")}`,
    itemType,
    sourceId: island.id,
    islandId: island.sourceIslandId,
    unlockAtWordCount: island.unlockAtWordCount,
    simplified: text,
    islandTags: island.themeTags,
    grammarPointIds: [],
    conceptIds: [],
    overrideConceptIds: [],
    overrideReasons: [],
    reviewStatus: "review-only",
    reviewDisposition: "needs-human-review",
    reviewReasons: [
      "island pack item is review-only and must be checked for natural spoken usefulness before learner-facing promotion",
      itemType === "island-scenario-prompt" ? "scenario prompt needs conversion into controlled Mandarin before use as input" : "phrase/dialogue item needs human naturalness review"
    ]
  };
}

function reviewReasonsForStoryLine(line: PanMandarinPremadeLine, index: number): string[] {
  const reasons = [
    "story line is review-only and must be checked for natural shadowing usefulness before learner-facing promotion",
    "line passed mechanical vocabulary and dialogue-topic gates, but human naturalness review is still required"
  ];
  if (line.overrideConceptIds.length > 0) reasons.push("line uses explicit island-essential override vocabulary");
  if (index === 0) reasons.push("opening line should be checked for clear scene setup");
  if (line.simplified.length <= 4) reasons.push("short line should be checked so it is not too thin for repeated shadowing");
  return reasons;
}

function conceptMatchesIsland(concept: PanMandarinConcept, definition: IslandDefinition): boolean {
  const text = `${concept.gloss} ${concept.variants.map((variant) => `${variant.simplified} ${variant.pinyin ?? ""}`).join(" ")}`.toLowerCase();
  return definition.conceptHints.some((hint) => text.includes(hint.toLowerCase()));
}

function primaryForm(concept: PanMandarinConcept): string {
  return concept.variants[0]?.simplified ?? concept.conceptId;
}
