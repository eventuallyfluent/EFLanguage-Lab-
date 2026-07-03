import { PanMandarinGrammarPoint } from "../models";

export const panMandarinGrammarPoints: PanMandarinGrammarPoint[] = [
  { id: "grammar-shi-identity", label: "是 identity sentence", simplified: "是", level: "bootstrap", sourceRefs: ["template:identity-01", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "identity-copula" },
  { id: "grammar-you-possession", label: "有 possession/existence", simplified: "有", level: "bootstrap", sourceRefs: ["template:identity-03", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "existence-possession" },
  { id: "grammar-zai-location", label: "在 location state", simplified: "在", level: "bootstrap", sourceRefs: ["template:location-01", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "location-state" },
  { id: "grammar-bu-negation", label: "不 present negation", simplified: "不", level: "bootstrap", sourceRefs: ["template:action-02", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "present-negation" },
  { id: "grammar-meiyou-negation", label: "没有 completion negation", simplified: "没有", level: "early", sourceRefs: ["template:completion-02", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "completion-negation" },
  { id: "grammar-ma-question", label: "吗 yes/no question", simplified: "吗", level: "bootstrap", sourceRefs: ["template:question-01", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "yes-no-question" },
  { id: "grammar-hen-adjective", label: "很 adjective predicate", simplified: "很", level: "bootstrap", sourceRefs: ["template:description-01", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "adjective-link" },
  { id: "grammar-le-completion", label: "了 completed action", simplified: "了", level: "early", sourceRefs: ["template:completion-01", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "completion-particle" },
  { id: "grammar-xiang-desire", label: "想 desire modal", simplified: "想", level: "early", sourceRefs: ["template:preference-03", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "desire-modal" },
  { id: "grammar-hui-ability", label: "会 learned ability", simplified: "会", level: "early", sourceRefs: ["template:ability-01", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "learned-ability-modal" },
  { id: "grammar-neng-possibility", label: "能 possibility/permission", simplified: "能", level: "early", sourceRefs: ["template:ability-03", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "permission-possibility-modal" },
  { id: "grammar-qu-motion", label: "去 motion to location", simplified: "去", level: "bootstrap", sourceRefs: ["template:location-02", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "motion-to-location" },
  { id: "grammar-meitian-habit", label: "每天 habitual time", simplified: "每天", level: "early", sourceRefs: ["template:repetition-01", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "habitual-time" },
  { id: "grammar-dou-inclusive", label: "都 inclusive adverb", simplified: "都", level: "early", sourceRefs: ["template:repetition-02", "HSK_3_0_REFERENCE", "TBCL_TOCFL_REFERENCE"], role: "inclusive-adverb" }
];

export function grammarPointByRole(role: string): PanMandarinGrammarPoint | undefined {
  return panMandarinGrammarPoints.find((point) => point.role === role);
}
