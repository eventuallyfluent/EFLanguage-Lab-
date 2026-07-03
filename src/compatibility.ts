import { LexiconEntry } from "./models";

export type CombinationKind = "verb-object" | "adjective-noun" | "subject-predicate";

const compatibleVerbObjects = new Map<string, Set<string>>([
  ["chi", set("fan", "mifan", "mianbao", "shuiguo", "cai")],
  ["he", set("shui", "cha", "kafei")],
  ["kan", set("shu", "zhongwen", "hanyu", "zi", "dianying", "dianshi", "shouji")],
  ["ting", set("zhongwen", "hanyu", "hua")],
  ["shuo", set("zhongwen", "hanyu", "hua")],
  ["xue", set("zhongwen", "hanyu", "zi")],
  ["du", set("shu", "zhongwen", "hanyu", "zi")],
  ["xie", set("zi", "zhongwen", "hanyu", "mingzi")],
  ["mai_buy", set("shu", "shui", "cha", "kafei", "fan", "mianbao", "shuiguo", "dongxi", "yifu", "shouji", "beizi")],
  ["zuo", set("fan", "cai")],
  ["da", set("dianhua")],
  ["deng", set("che", "pengyou", "laoshi")],
  ["bang", set("pengyou", "mama", "baba", "xuesheng", "laoshi")],
  ["ai", set("mama", "baba", "pengyou")],
  ["xihuan", set("zhongwen", "hanyu", "shu", "shui", "cha", "kafei", "fan", "mifan", "mianbao", "shuiguo", "cai", "pengyou", "dianying", "dianshi")],
  ["hui_return", set("jia", "xuexiao", "gongsi")],
  ["zhu", set("jia", "fangjian")],
  ["kai", set("che", "men")],
  ["zuo_sit", set("che", "yizi")],
  ["qu", set("xuexiao", "gongsi", "fandian", "yiyuan", "shangdian", "jichang", "chezhan")],
  ["zai", set("jia", "xuexiao", "gongsi", "fandian", "yiyuan", "shangdian", "jichang", "chezhan", "fangjian")]
]);

const noObjectVerbs = new Set(["gongzuo_v", "shuijiao", "qichuang"]);

const compatibleNounAdjectives = new Map<string, Set<string>>([
  ["tianqi", set("hao", "re", "leng")],
  ["ren", set("hao", "mang", "lei", "gao")],
  ["pengyou", set("hao", "mang", "lei", "gao")],
  ["laoshi", set("hao", "mang", "lei", "gao")],
  ["xuesheng", set("hao", "mang", "lei", "gao")],
  ["mama", set("hao", "mang", "lei")],
  ["baba", set("hao", "mang", "lei")],
  ["xuexiao", set("da_adj", "xiao", "hao")],
  ["gongsi", set("da_adj", "xiao", "hao", "mang")],
  ["fandian", set("da_adj", "xiao", "hao")],
  ["shangdian", set("da_adj", "xiao", "hao")],
  ["yiyuan", set("da_adj", "xiao", "hao")],
  ["jia", set("da_adj", "xiao", "hao")],
  ["shu", set("hao", "da_adj", "xiao", "duo", "shao")],
  ["zi", set("da_adj", "xiao", "duo", "shao")],
  ["zhongwen", set("hao")],
  ["hanyu", set("hao")],
  ["fan", set("hao", "re", "leng", "duo", "shao")],
  ["mifan", set("hao", "re", "leng", "duo", "shao")],
  ["mianbao", set("hao", "re", "leng", "duo", "shao")],
  ["shuiguo", set("hao", "duo", "shao")],
  ["cai", set("hao", "re", "leng", "duo", "shao")],
  ["shui", set("hao", "re", "leng", "duo", "shao")],
  ["cha", set("hao", "re", "leng", "duo", "shao")],
  ["dongxi", set("duo", "shao", "da_adj", "xiao", "hao")],
  ["qian", set("duo", "shao")],
  ["che", set("da_adj", "xiao", "kuai", "man")],
  ["dianying", set("hao")],
  ["dianshi", set("hao", "da_adj", "xiao")],
  ["shouji", set("hao", "da_adj", "xiao", "kuai", "man")],
  ["kafei", set("hao", "re", "leng", "duo", "shao")],
  ["yifu", set("hao", "da_adj", "xiao", "duo", "shao")],
  ["zhuozi", set("da_adj", "xiao")],
  ["yizi", set("da_adj", "xiao", "hao")],
  ["beizi", set("da_adj", "xiao")],
  ["fangjian", set("da_adj", "xiao", "hao", "re", "leng")],
  ["haizi", set("hao", "mang", "lei", "gao")],
  ["yisheng", set("hao", "mang", "lei")]
]);

const compatibleSubjectPredicates = new Map<string, Set<string>>([
  ["wo", set("hao", "mang", "lei", "gao")],
  ["ni", set("hao", "mang", "lei", "gao")],
  ["ta_he", set("hao", "mang", "lei", "gao")],
  ["ta_she", set("hao", "mang", "lei", "gao")],
  ["women", set("hao", "mang", "lei")]
]);

export function compatibleObjectsForVerb(verbId: string): Set<string> {
  return compatibleVerbObjects.get(verbId) ?? new Set<string>();
}

export function compatibleAdjectivesForNoun(nounId: string): Set<string> {
  return compatibleNounAdjectives.get(nounId) ?? new Set<string>();
}

export function isValidCombination(kind: CombinationKind, left: LexiconEntry | string, right?: LexiconEntry | string): boolean {
  const leftId = typeof left === "string" ? left : left.id;
  const rightId = typeof right === "string" ? right : right?.id;

  if (kind === "verb-object") {
    if (!rightId) return noObjectVerbs.has(leftId);
    return compatibleVerbObjects.get(leftId)?.has(rightId) ?? false;
  }

  if (!rightId) return false;

  if (kind === "adjective-noun") {
    return compatibleNounAdjectives.get(leftId)?.has(rightId) ?? false;
  }

  return compatibleSubjectPredicates.get(leftId)?.has(rightId) ?? false;
}

function set(...ids: string[]): Set<string> {
  return new Set(ids);
}
