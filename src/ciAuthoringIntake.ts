import { AcquisitionVocabPath, AuthoredCiSentence, AuthoredCiValidationIssue, AuthoredCiValidationReport, CompactCiAuthoringPacket, SentenceStreamItem } from "./models";

export function validateAuthoredCiSentences(sentences: AuthoredCiSentence[], packets: CompactCiAuthoringPacket[]): AuthoredCiValidationReport {
  const slots = slotIndex(packets);
  const issues: AuthoredCiValidationIssue[] = [];

  for (const sentence of sentences) {
    const slot = slots.get(sentence.slotId);
    if (!slot) {
      issues.push(issue(sentence, "error", `Unknown authoring slot: ${sentence.slotId}`));
      continue;
    }

    if (sentence.packetId !== slot.packetId) issues.push(issue(sentence, "error", `Sentence packetId ${sentence.packetId} does not match slot packet ${slot.packetId}.`));
    if (sentence.targetId !== slot.targetId) issues.push(issue(sentence, "error", `Sentence targetId ${sentence.targetId} does not match slot target ${slot.targetId}.`));
    if (sentence.requiredNewWordId !== slot.requiredNewWordId) {
      issues.push(issue(sentence, "error", `Required new word must be ${slot.requiredNewWordId}, got ${sentence.requiredNewWordId}.`));
    }

    const vocabularyIds = new Set(sentence.vocabularyIds);
    if (!vocabularyIds.has(slot.requiredNewWordId)) issues.push(issue(sentence, "error", `Sentence does not include required new word ${slot.requiredNewWordId}.`));

    const allowedIds = new Set([...slot.allowedKnownVocabularyIds, slot.requiredNewWordId]);
    const unallowedIds = sentence.vocabularyIds.filter((id) => !allowedIds.has(id));
    if (unallowedIds.length > 0) issues.push(issue(sentence, "error", `Sentence uses vocabulary outside the slot allowance: ${Array.from(new Set(unallowedIds)).join(", ")}.`));

    const otherNewIds = sentence.vocabularyIds.filter((id) => id !== slot.requiredNewWordId && !slot.allowedKnownVocabularyIds.includes(id));
    if (otherNewIds.length > 0) issues.push(issue(sentence, "error", `Sentence contains extra new words: ${Array.from(new Set(otherNewIds)).join(", ")}.`));

    if (!sentence.simplified.trim()) issues.push(issue(sentence, "error", "Missing simplified Chinese."));
    if (!sentence.pinyin.trim()) issues.push(issue(sentence, "error", "Missing pinyin."));
    if (!sentence.english.trim()) issues.push(issue(sentence, "error", "Missing English rendering."));
    if (sentence.reviewStatus !== "authored" && sentence.reviewStatus !== "curated") issues.push(issue(sentence, "error", "Invalid reviewStatus."));
    for (const message of naturalnessIssues(sentence, slot.mode)) {
      issues.push(issue(sentence, "error", message));
    }
  }

  const rejectedSentenceIds = new Set(issues.filter((item) => item.severity === "error").map((item) => item.sentenceId));
  const acceptedSentenceIds = sentences.filter((sentence) => !rejectedSentenceIds.has(sentence.id)).map((sentence) => sentence.id);
  return {
    sentenceCount: sentences.length,
    acceptedCount: acceptedSentenceIds.length,
    rejectedCount: rejectedSentenceIds.size,
    issues,
    acceptedSentenceIds,
    rejectedSentenceIds: Array.from(rejectedSentenceIds)
  };
}

export function promoteAuthoredCiSentencesToStream(sentences: AuthoredCiSentence[], packets: CompactCiAuthoringPacket[], path: AcquisitionVocabPath): SentenceStreamItem[] {
  const report = validateAuthoredCiSentences(sentences, packets);
  if (report.rejectedCount > 0) {
    throw new Error(`Cannot promote invalid authored CI sentences: ${report.issues.filter((issue) => issue.severity === "error").map((issue) => `${issue.sentenceId}: ${issue.message}`).join("; ")}`);
  }

  const slotMap = slotIndex(packets);
  const pathOrder = new Map(path.entries.map((entry) => [entry.vocabularyId, entry.wordIndex]));
  return sentences
    .map((sentence, index): SentenceStreamItem => {
      const slot = slotMap.get(sentence.slotId);
      if (!slot) throw new Error(`Missing slot after validation: ${sentence.slotId}`);
      const newWordIndex = pathOrder.get(slot.requiredNewWordId);
      if (newWordIndex === undefined) throw new Error(`Required new word is not in acquisition path: ${slot.requiredNewWordId}`);
      const knownVocabularyIds = sentence.vocabularyIds.filter((id) => id !== slot.requiredNewWordId);
      return {
        id: `authored-stream-${String(index + 1).padStart(5, "0")}`,
        sentenceId: sentence.id,
        simplified: sentence.simplified,
        pinyin: sentence.pinyin,
        english: sentence.english,
        knownWordThreshold: Math.max(0, newWordIndex - 1),
        knownVocabularyIds,
        newWordIds: [slot.requiredNewWordId],
        vocabularyIds: sentence.vocabularyIds,
        repetitionFamilyId: `${sentence.packetId}:${sentence.targetId}`,
        templateId: sentence.slotId,
        sourceStatus: "curated",
        qualityScore: sentence.reviewStatus === "curated" ? 100 : 90,
        islandTags: [],
        reviewStatus: "curated"
      };
    })
    .sort((a, b) => a.knownWordThreshold - b.knownWordThreshold || a.id.localeCompare(b.id));
}

function slotIndex(packets: CompactCiAuthoringPacket[]) {
  const out = new Map<
    string,
    {
      packetId: string;
      targetId: string;
      requiredNewWordId: string;
      allowedKnownVocabularyIds: string[];
      mode: "bootstrap-seed" | "ci-plus-one";
    }
  >();

  for (const packet of packets) {
    for (const item of packet.items) {
      for (const slot of item.sentenceSlots) {
        out.set(slot.id, {
          packetId: packet.id,
          targetId: item.targetId,
          requiredNewWordId: slot.requiredNewWordId,
          allowedKnownVocabularyIds: slot.allowedKnownVocabularyIds,
          mode: slot.mode
        });
      }
    }
  }

  return out;
}

function naturalnessIssues(sentence: AuthoredCiSentence, slotMode: "bootstrap-seed" | "ci-plus-one"): string[] {
  const issues: string[] = [];
  const text = sentence.simplified.trim();
  const english = sentence.english.trim();
  const uniqueVocabularyCount = new Set(sentence.vocabularyIds).size;

  if (slotMode === "bootstrap-seed") {
    issues.push("Bootstrap seed slots are not promoted as learner-facing acquisition sentences.");
  }
  if (text.length < 3 || uniqueVocabularyCount < 3) {
    issues.push("Authored CI sentence is too short to be useful learner-facing input.");
  }
  if (/(^我$|^好$|^是我$|^我有$|^我在$|^他来$|^他说$|^你说$|^我想$|^我要$|^他来看$|^我们来$)/.test(text)) {
    issues.push("Authored CI sentence is a known weak fragment or unnatural early line.");
  }
  if (/^(Me\.|Okay\.|I have some\.|I want to\.|I want it\.|He says it\.|You say it\.|He is coming to look\.)$/.test(english)) {
    issues.push("English rendering indicates the Mandarin line is too vague or fragment-like.");
  }

  return issues;
}

function issue(sentence: AuthoredCiSentence, severity: AuthoredCiValidationIssue["severity"], message: string): AuthoredCiValidationIssue {
  return {
    sentenceId: sentence.id,
    slotId: sentence.slotId,
    severity,
    message
  };
}
