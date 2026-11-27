import type { TopicVocabularyResource } from "@features/topic/types/topic-management.types";

export interface VocabularyPresentation {
  word: string;
  pos: string;
  ipa: string;
  meaningVi: string;
  sense: string;
  pronunciations: { label: string; url: string | null }[];
  examples: { en: string; vi: string; audioUrl: string | null; isManual: boolean | null }[];
  collocations: { text: string; exampleEn: string; exampleVi: string; descriptionVi: string }[];
  quickCheck: { question: string; options: string[]; correctAnswer: string | null; answerInconsistent: boolean; explanation: string; sentence: string; meaningVi: string; audioUrl: string | null; audioUrlSlow: string | null; source: string; externalId: string } | null;
  hasUnsupportedQuickCheck: boolean;
  showSense: boolean;
  hasUnresolvedReference: boolean;
  hasMissingPronunciation: boolean;
  sampleProvenance: { sampleIndex: number; label: string }[];
  tips: string;
  references: { vocabId: string | null; senseId: string | null };
}

export type VocabularyCollocationLayout = "none" | "chips" | "details";

type VocabularyCollocationPresentation = VocabularyPresentation["collocations"][number];

export function hasCollocationDetails(entry: VocabularyCollocationPresentation): boolean {
  return Boolean(entry.descriptionVi || entry.exampleEn || entry.exampleVi);
}

export function vocabularyCollocationLayout(collocations: VocabularyCollocationPresentation[]): VocabularyCollocationLayout {
  if (collocations.length === 0) return "none";
  return collocations.some(hasCollocationDetails) ? "details" : "chips";
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function comparableText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
}

export function partOfSpeechLabel(value: string): string {
  const labels: Record<string, string> = {
    noun: "Danh từ", verb: "Động từ", adjective: "Tính từ", adverb: "Trạng từ",
    preposition: "Giới từ", pronoun: "Đại từ", conjunction: "Liên từ",
    phrase: "Cụm từ", "verb phrase": "Cụm động từ",
  };
  return labels[value.trim().toLocaleLowerCase("en-US")] ?? value;
}

function readQuickCheck(resource: TopicVocabularyResource): VocabularyPresentation["quickCheck"] {
  const value = resource.quickCheck;
  if (!value) return null;
  const data = value.quizData;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const question = readString(data.question);
  const options = Array.isArray(data.options) ? data.options.filter((option): option is string => typeof option === "string" && Boolean(option.trim())) : [];
  if (!question || options.length < 2) return null;
  const answerData = objectRecord(value.answerData);
  const quickCheckData = objectRecord(value.quizData);
  const quickCheckRecord = value as unknown as Record<string, unknown>;
  const candidates = [
    quickCheckRecord.correctAnswer,
    quickCheckRecord.correct_answer,
    quickCheckData?.correctAnswer,
    quickCheckData?.correct_answer,
    answerData?.correctAnswer,
    answerData?.correct_answer,
  ].filter((answer): answer is string => typeof answer === "string" && Boolean(answer.trim()));
  const distinctCandidates = [...new Set(candidates)];
  const answerInconsistent = distinctCandidates.length > 1;
  const explicitAnswer = distinctCandidates.length === 1 ? distinctCandidates[0] : "";
  const correctAnswer = !answerInconsistent && explicitAnswer && options.filter((option) => option === explicitAnswer).length === 1 ? explicitAnswer : null;
  return {
    question,
    options,
    correctAnswer,
    answerInconsistent,
    explanation: readString(value.explanation),
    sentence: readString(value.sentence?.textEn),
    meaningVi: readString(value.sentence?.meaningVi),
    audioUrl: value.sentence?.audioUrl ?? null,
    audioUrlSlow: value.sentence?.audioUrlSlow ?? null,
    source: readString(value.sentence?.source),
    externalId: readString(value.sentence?.externalId),
  };
}

export function toVocabularyPresentation(resource: TopicVocabularyResource): VocabularyPresentation {
  const snapshot = resource.snapshot;
  const quickCheck = readQuickCheck(resource);
  const meaningVi = readString(snapshot?.describeVi);
  const sense = readString(snapshot?.sense);
  const pronunciations = [
    { label: "Âm thanh", url: snapshot?.audioUrl ?? null },
    { label: "Giọng Anh", url: snapshot?.audioEnUrl ?? null },
    { label: "Giọng Mỹ", url: snapshot?.audioUsUrl ?? null },
  ].filter((track) => Boolean(track.url));
  return {
    word: readString(snapshot?.word),
    pos: readString(snapshot?.pos),
    ipa: readString(snapshot?.phonetic),
    meaningVi,
    sense,
    showSense: Boolean(sense.trim() && comparableText(sense) !== comparableText(meaningVi)),
    pronunciations,
    hasUnresolvedReference: Boolean(resource.vocabId || resource.senseId),
    hasMissingPronunciation: pronunciations.length === 0,
    examples: (resource.samples ?? []).filter((sample) => Boolean(sample.textEn || sample.textVi || sample.audioUrl)).map((sample) => ({
      en: readString(sample.textEn), vi: readString(sample.textVi), audioUrl: sample.audioUrl, isManual: sample.isManual,
    })),
    collocations: (resource.collocations ?? []).filter((entry) => Boolean(entry.text || entry.descriptionVi || entry.example?.en || entry.example?.vi)).map((entry) => ({
      text: readString(entry.text), exampleEn: readString(entry.example?.en), exampleVi: readString(entry.example?.vi), descriptionVi: readString(entry.descriptionVi),
    })),
    sampleProvenance: (resource.samples ?? []).flatMap((sample, sampleIndex) => sample.isManual == null ? [] : [{
      sampleIndex: sampleIndex + 1,
      label: sample.isManual ? "Thủ công" : "Từ điển",
    }]),
    quickCheck,
    hasUnsupportedQuickCheck: Boolean(resource.quickCheck && !quickCheck),
    tips: readString(resource.tips),
    references: { vocabId: resource.vocabId, senseId: resource.senseId },
  };
}
