import {
  PanMandarinCiCandidate,
  PanMandarinCiCoverageReport,
  PanMandarinConcept,
  PanMandarinGrammarPoint,
  PanMandarinNaturalnessDisposition
} from "../models";
import { grammarPointByRole, panMandarinGrammarPoints } from "./panMandarinGrammar";

type ConceptLookup = Map<string, PanMandarinConcept>;

const helperForms = ["我", "你", "他", "是", "有", "在", "不", "很", "想", "要", "去", "吗", "每天", "都", "这个"];

export function buildPanMandarinCiCandidates(concepts: PanMandarinConcept[]): PanMandarinCiCandidate[] {
  const byForm = new Map(concepts.map((concept) => [primaryForm(concept), concept]));
  const helperConcepts = helperForms.map((form) => byForm.get(form)).filter((concept): concept is PanMandarinConcept => concept !== undefined);
  const byConceptId = new Map(concepts.map((concept) => [concept.conceptId, concept]));

  return concepts
    .slice()
    .sort((a, b) => (a.communicationPathRank ?? Number.MAX_SAFE_INTEGER) - (b.communicationPathRank ?? Number.MAX_SAFE_INTEGER))
    .map((concept, index) => candidateFor(concept, index + 1, helperConcepts, byConceptId));
}

export function buildPanMandarinCiCoverageReport(concepts: PanMandarinConcept[], candidates: PanMandarinCiCandidate[]): PanMandarinCiCoverageReport {
  return {
    targetConceptCount: concepts.length,
    sentenceReadyCount: concepts.filter((concept) => concept.sentenceReadiness.sentenceability === "sentence-target").length,
    functionFrameCount: concepts.filter((concept) => concept.sentenceReadiness.sentenceability === "function-frame").length,
    needsCompanionWordCount: concepts.filter((concept) => concept.sentenceReadiness.sentenceability === "needs-companion-word").length,
    deferredCount: concepts.filter((concept) => concept.sentenceReadiness.sentenceability === "defer").length,
    blockedCount: concepts.filter((concept) => concept.sentenceReadiness.sentenceability === "blocked").length,
    candidateCount: candidates.length,
    acceptedReviewCount: candidates.filter((candidate) => candidate.naturalnessDisposition === "accepted-review").length,
    needsHumanReviewCount: candidates.filter((candidate) => candidate.naturalnessDisposition === "needs-human-review").length,
    rejectedCount: candidates.filter((candidate) => candidate.naturalnessDisposition.startsWith("rejected-")).length,
    trueCiPlusOneCount: candidates.filter((candidate) => candidate.mode === "ci-plus-one" && candidate.newConceptIds.length === 1).length,
    bootstrapCount: candidates.filter((candidate) => candidate.mode === "bootstrap").length,
    unclassifiedGrammarCount: candidates.filter((candidate) => candidate.grammarTagStatus === "unclassified").length,
    targetsWithCandidateOrReason: candidates.filter((candidate) => candidate.simplified || candidate.naturalnessReasons.length > 0).length
  };
}

function candidateFor(concept: PanMandarinConcept, sequence: number, helperConcepts: PanMandarinConcept[], byConceptId: ConceptLookup): PanMandarinCiCandidate {
  const target = targetFor(concept);
  const grammarPoints = grammarPointsFor(concept);
  const base = {
    id: `pan-ci-${String(sequence).padStart(5, "0")}`,
    conceptId: concept.conceptId,
    targetGlobalRank: concept.globalRank ?? sequence,
    targetCommunicationPathRank: concept.communicationPathRank ?? sequence,
    target,
    knownConceptIds: [] as string[],
    newConceptIds: [] as string[],
    grammarPointIds: grammarPoints.map((point) => point.id),
    grammarSourceRefs: Array.from(new Set(grammarPoints.flatMap((point) => point.sourceRefs))).sort(),
    grammarLevel: grammarLevelFor(grammarPoints),
    grammarTagStatus: grammarPoints.length > 0 ? "tagged" as const : "unclassified" as const,
    reviewStatus: "review-only" as const
  };

  const readiness = concept.sentenceReadiness.sentenceability;
  if (readiness === "blocked" || readiness === "defer" || readiness === "needs-companion-word") {
    return {
      ...base,
      mode: "blocked",
      naturalnessDisposition: readiness === "blocked" ? "rejected-semantic" : "needs-human-review",
      naturalnessReasons: concept.sentenceReadiness.cleanupNotes.length > 0 ? concept.sentenceReadiness.cleanupNotes : [`${readiness} target requires human review before sentence generation.`]
    };
  }

  if (readiness === "function-frame") {
    return functionFrameCandidate(concept, base);
  }

  const frame = sentenceTargetFrame(concept, helperConcepts, byConceptId);
  const disposition = classifyPanMandarinNaturalness(frame?.simplified, frame?.knownConceptIds ?? [], concept.gloss);
  return {
    ...base,
    mode: frame && disposition === "accepted-review" ? "ci-plus-one" : "blocked",
    naturalnessDisposition: disposition,
    naturalnessReasons: naturalnessReasonsFor(disposition, frame?.simplified, concept),
    simplified: frame?.simplified,
    traditional: frame?.traditional,
    pinyin: frame?.pinyin,
    english: frame?.english,
    knownConceptIds: frame?.knownConceptIds ?? [],
    newConceptIds: frame && disposition === "accepted-review" ? [concept.conceptId] : []
  };
}

function functionFrameCandidate(
  concept: PanMandarinConcept,
  base: Omit<PanMandarinCiCandidate, "mode" | "naturalnessDisposition" | "naturalnessReasons">
): PanMandarinCiCandidate {
  const form = primaryForm(concept);
  const examples: Record<string, [string, string, string]> = {
    "是": ["我是学生。", "wǒ shì xuéshēng.", "I am a student."],
    "有": ["我有一本书。", "wǒ yǒu yì běn shū.", "I have a book."],
    "在": ["我在家。", "wǒ zài jiā.", "I am at home."],
    "不": ["我不去。", "wǒ bù qù.", "I am not going."],
    "没有": ["我没有时间。", "wǒ méiyǒu shíjiān.", "I do not have time."],
    "吗": ["你好吗？", "nǐ hǎo ma?", "Are you well?"],
    "很": ["今天很冷。", "jīntiān hěn lěng.", "It is cold today."],
    "了": ["我知道了。", "wǒ zhīdào le.", "I understand now."],
    "想": ["我想喝水。", "wǒ xiǎng hē shuǐ.", "I want to drink water."],
    "会": ["我会说中文。", "wǒ huì shuō zhōngwén.", "I can speak Chinese."],
    "能": ["我能去吗？", "wǒ néng qù ma?", "Can I go?"],
    "去": ["我去学校。", "wǒ qù xuéxiào.", "I am going to school."],
    "每天": ["我每天喝水。", "wǒ měitiān hē shuǐ.", "I drink water every day."],
    "都": ["我们都在家。", "wǒmen dōu zài jiā.", "We are all at home."]
  };
  const example = examples[form];
  if (!example) {
    return {
      ...base,
      mode: "blocked",
      naturalnessDisposition: "needs-human-review",
      naturalnessReasons: ["Function word needs a reviewed frame before use."]
    };
  }
  return {
    ...base,
    mode: "bootstrap",
    naturalnessDisposition: "accepted-review",
    naturalnessReasons: ["Reviewed bootstrap grammar frame; not counted as normal CI+1 acquisition."],
    simplified: example[0],
    pinyin: example[1],
    english: example[2],
    knownConceptIds: [],
    newConceptIds: []
  };
}

function sentenceTargetFrame(concept: PanMandarinConcept, helperConcepts: PanMandarinConcept[], byConceptId: ConceptLookup) {
  const target = targetFor(concept);
  const helperIds = new Set(helperConcepts.map((item) => item.conceptId));
  const hasHelpers = (forms: string[]) => forms.every((form) => helperConcepts.some((concept) => primaryForm(concept) === form));
  const knownConceptIds = (forms: string[]) => forms
    .map((form) => helperConcepts.find((concept) => primaryForm(concept) === form)?.conceptId)
    .filter((id): id is string => typeof id === "string" && id !== concept.conceptId && byConceptId.has(id));

  if (target.partOfSpeech === "noun" && hasHelpers(["我", "想", "要"])) {
    return {
      simplified: `我想要${target.simplified}。`,
      traditional: target.traditional ? `我想要${target.traditional}。` : undefined,
      pinyin: `wǒ xiǎng yào ${target.pinyin ?? target.simplified}.`,
      english: `I want ${englishObject(target.gloss)}.`,
      knownConceptIds: knownConceptIds(["我", "想", "要"]).filter((id) => helperIds.has(id))
    };
  }

  if (target.partOfSpeech === "adjective" && hasHelpers(["很", "这个"])) {
    return {
      simplified: `这个很${target.simplified}。`,
      traditional: target.traditional ? `這個很${target.traditional}。` : undefined,
      pinyin: `zhège hěn ${target.pinyin ?? target.simplified}.`,
      english: `This is ${englishAdjective(target.gloss)}.`,
      knownConceptIds: knownConceptIds(["这个", "很"]).filter((id) => helperIds.has(id))
    };
  }

  return undefined;
}

export function classifyPanMandarinNaturalness(simplified: string | undefined, knownConceptIds: string[], gloss: string): PanMandarinNaturalnessDisposition {
  if (!simplified) return "needs-human-review";
  if (/^(我有|是我|我想|他来|他说|你说)$/.test(simplified.replace(/[。？！?]/g, ""))) return "rejected-robotic";
  if (knownConceptIds.length < 2) return "rejected-too-thin";
  if (/surname|variant of|radical|Buddhist|dynasty|brand/i.test(gloss)) return "rejected-semantic";
  return "accepted-review";
}

function naturalnessReasonsFor(disposition: PanMandarinNaturalnessDisposition, simplified: string | undefined, concept: PanMandarinConcept): string[] {
  if (disposition === "accepted-review") return ["Candidate is structurally CI+1 and uses a conservative spoken frame."];
  if (!simplified) return ["No high-confidence natural frame for this target yet."];
  if (disposition === "rejected-robotic") return ["Candidate matches a known robotic or fragment-like pattern."];
  if (disposition === "rejected-too-thin") return ["Candidate does not have enough known vocabulary support to count as natural CI+1."];
  if (disposition === "rejected-semantic") return ["Gloss or target semantics are too noisy for automatic sentence generation."];
  return concept.sentenceReadiness.cleanupNotes.length > 0 ? concept.sentenceReadiness.cleanupNotes : ["Needs human review for naturalness."];
}

function grammarPointsFor(concept: PanMandarinConcept): PanMandarinGrammarPoint[] {
  return concept.sentenceReadiness.grammarRoles
    .map(grammarPointByRole)
    .filter((point): point is PanMandarinGrammarPoint => point !== undefined);
}

function grammarLevelFor(points: PanMandarinGrammarPoint[]): PanMandarinGrammarPoint["level"] | undefined {
  if (points.some((point) => point.level === "core")) return "core";
  if (points.some((point) => point.level === "early")) return "early";
  if (points.some((point) => point.level === "bootstrap")) return "bootstrap";
  return undefined;
}

function targetFor(concept: PanMandarinConcept): PanMandarinCiCandidate["target"] {
  const primary = concept.variants[0];
  return {
    simplified: primary?.simplified ?? concept.conceptId,
    traditional: primary?.traditional,
    pinyin: primary?.pinyin,
    gloss: concept.gloss,
    partOfSpeech: concept.sentenceReadiness.partOfSpeech,
    sentenceability: concept.sentenceReadiness.sentenceability
  };
}

function primaryForm(concept: PanMandarinConcept): string {
  return concept.variants[0]?.simplified ?? concept.conceptId;
}

function englishObject(gloss: string): string {
  return gloss.replace(/^to\s+/i, "").replace(/\s*\([^)]*\)\s*/g, "").split(";")[0].trim() || "it";
}

function englishAdjective(gloss: string): string {
  return englishObject(gloss).replace(/^be\s+/i, "");
}
