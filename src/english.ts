const subjectEnglish = new Map<string, string>([
  ["wo", "I"],
  ["ni", "you"],
  ["ta_he", "he"],
  ["ta_she", "she"],
  ["women", "we"]
]);

const nounEnglish = new Map<string, string>([
  ["ren", "person"],
  ["pengyou", "friend"],
  ["laoshi", "teacher"],
  ["xuesheng", "student"],
  ["mama", "mom"],
  ["baba", "dad"],
  ["jia", "home"],
  ["xuexiao", "school"],
  ["gongsi", "company"],
  ["fandian", "restaurant"],
  ["yiyuan", "hospital"],
  ["shangdian", "store"],
  ["shu", "book"],
  ["zi", "characters"],
  ["hua", "Chinese"],
  ["zhongwen", "Chinese"],
  ["hanyu", "Mandarin"],
  ["shui", "water"],
  ["cha", "tea"],
  ["fan", "a meal"],
  ["mifan", "rice"],
  ["mianbao", "bread"],
  ["shuiguo", "fruit"],
  ["cai", "food"],
  ["qian", "money"],
  ["dongxi", "things"],
  ["che", "the bus"],
  ["dianhua", "a phone call"],
  ["diannao", "computer"],
  ["dianying", "movie"],
  ["dianshi", "TV"],
  ["shouji", "phone"],
  ["kafei", "coffee"],
  ["yifu", "clothes"],
  ["zhuozi", "table"],
  ["yizi", "chair"],
  ["beizi", "cup"],
  ["men", "door"],
  ["lu", "road"],
  ["jichang", "airport"],
  ["chezhan", "station"],
  ["fangjian", "room"],
  ["haizi", "child"],
  ["yisheng", "doctor"],
  ["bing", "illness"],
  ["yao_medicine", "medicine"],
  ["shijian", "time"],
  ["wenti", "question"],
  ["yisi", "meaning"],
  ["kaoshi", "exam"],
  ["ke", "class"],
  ["tianqi", "weather"],
  ["mingzi", "name"]
]);

const verbEnglish = new Map<string, string>([
  ["chi", "eat"],
  ["he", "drink"],
  ["kan", "read"],
  ["ting", "listen to"],
  ["shuo", "speak"],
  ["xue", "study"],
  ["du", "read"],
  ["xie", "write"],
  ["mai_buy", "buy"],
  ["zuo", "make"],
  ["da", "make"],
  ["deng", "wait for"],
  ["bang", "help"],
  ["ai", "love"],
  ["gongzuo_v", "work"],
  ["shuijiao", "sleep"],
  ["qichuang", "get up"],
  ["xiexie", "thank"],
  ["qing", "invite"],
  ["jiao", "call"],
  ["renshi", "know"],
  ["zhidao", "know"],
  ["juede", "feel"],
  ["hui_return", "return"],
  ["zhu", "live in"],
  ["kai", "open"],
  ["zuo_sit", "take"],
  ["zou", "walk"],
  ["xiuxi", "rest"],
  ["yundong", "exercise"],
  ["shangban", "go to work"],
  ["xiaban", "get off work"]
]);

const adjectiveEnglish = new Map<string, string>([
  ["da_adj", "big"],
  ["xiao", "small"],
  ["hao", "good"],
  ["duo", "a lot"],
  ["shao", "not much"],
  ["mang", "busy"],
  ["lei", "tired"],
  ["re", "hot"],
  ["leng", "cold"],
  ["kuai", "fast"],
  ["man", "slow"],
  ["gao", "tall"]
]);

const timeEnglish = new Map<string, string>([
  ["jin_tian", "today"],
  ["zuo_tian", "yesterday"],
  ["ming_tian", "tomorrow"],
  ["mei_tian", "every day"],
  ["xianzai", "now"],
  ["zaoshang", "this morning"],
  ["wanshang", "tonight"],
  ["xianzai2", "this afternoon"]
]);

export function enSubject(id: string): string {
  return subjectEnglish.get(id) ?? id;
}

export function enNoun(id: string): string {
  return nounEnglish.get(id) ?? id;
}

export function enVerb(id: string): string {
  return verbEnglish.get(id) ?? id;
}

export function enAdjective(id: string): string {
  return adjectiveEnglish.get(id) ?? id;
}

export function enTime(id: string): string {
  return timeEnglish.get(id) ?? id;
}

export function article(noun: string): string {
  if (/^(home|school|work|Chinese|Mandarin|water|tea|rice|bread|fruit|food|money|weather|characters|things)$/i.test(noun)) return noun;
  return /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`;
}
