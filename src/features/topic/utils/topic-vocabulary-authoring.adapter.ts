import type { TopicVocabularyItem } from "@features/topic/types/topic-create.types";
import type { TopicVocabularyResource } from "@features/topic/types/topic-management.types";

export interface TopicVocabularyAuthoringDraft {
  id?: string;
  vocabId: string | null;
  senseId: string | null;
  word: string;
  pos: string;
  ipa: string;
  meaningVi: string;
  audioUrl: string | null;
  audioEnUrl: string | null;
  audioUsUrl: string | null;
  sense: string | null;
  samples: TopicVocabularyResource["samples"];
  collocations: TopicVocabularyResource["collocations"];
  quickCheck: TopicVocabularyResource["quickCheck"];
  tips: string;
  audioFile: string;
  examples: { en: string; vi: string }[];
}

export interface VocabularyQuickCheckFields {
  sentence: string;
  meaningVi: string;
  explanation: string;
}

export function mergeVocabularyQuickCheck(
  original: TopicVocabularyResource["quickCheck"],
  fields: VocabularyQuickCheckFields,
): TopicVocabularyResource["quickCheck"] {
  const originalSentence = original?.sentence?.textEn ?? "";
  const originalMeaning = original?.sentence?.meaningVi ?? "";
  const originalExplanation = original?.explanation ?? "";
  const unchanged = fields.sentence === originalSentence
    && fields.meaningVi === originalMeaning
    && fields.explanation === originalExplanation;
  if (unchanged) return original ? structuredClone(original) : null;

  if (!original && !fields.sentence && !fields.meaningVi && !fields.explanation) return null;
  return {
    sentence: {
      textEn: fields.sentence || null,
      meaningVi: fields.meaningVi || null,
      audioUrl: original?.sentence?.audioUrl ?? null,
      audioUrlSlow: original?.sentence?.audioUrlSlow ?? null,
      source: original?.sentence?.source ?? null,
      externalId: original?.sentence?.externalId ?? null,
    },
    quizData: original?.quizData ?? null,
    answerData: original?.answerData ?? null,
    explanation: fields.explanation || null,
  };
}

export function toVocabularyEditorItem(
  resource: TopicVocabularyResource,
  key: string,
): Omit<TopicVocabularyItem, "pos"> & { pos: string } {
  const audioFile = resource.snapshot?.audioUsUrl ?? resource.snapshot?.audioUrl ?? resource.snapshot?.audioEnUrl ?? "";
  return {
    id: key,
    word: resource.snapshot?.word ?? "",
    pos: resource.snapshot?.pos ?? "",
    ipa: resource.snapshot?.phonetic ?? "",
    meaningVi: resource.snapshot?.describeVi ?? "",
    audioFile,
    audioUploaded: false,
    examples: (resource.samples ?? []).map((sample) => ({ en: sample.textEn ?? "", vi: sample.textVi ?? "" })),
    collocations: (resource.collocations ?? []).map((entry) => entry.text ?? ""),
  };
}

export function toVocabularyAuthoringDraft(
  resource: TopicVocabularyResource | undefined,
): TopicVocabularyAuthoringDraft {
  return {
    vocabId: resource?.vocabId ?? null,
    senseId: resource?.senseId ?? null,
    word: resource?.snapshot?.word ?? "",
    pos: resource?.snapshot?.pos ?? "",
    ipa: resource?.snapshot?.phonetic ?? "",
    meaningVi: resource?.snapshot?.describeVi ?? "",
    audioUrl: resource?.snapshot?.audioUrl ?? null,
    audioEnUrl: resource?.snapshot?.audioEnUrl ?? null,
    audioUsUrl: resource?.snapshot?.audioUsUrl ?? null,
    sense: resource?.snapshot?.sense ?? null,
    audioFile: resource?.snapshot?.audioUsUrl ?? resource?.snapshot?.audioUrl ?? resource?.snapshot?.audioEnUrl ?? "",
    examples: (resource?.samples ?? []).map((sample) => ({ en: sample.textEn ?? "", vi: sample.textVi ?? "" })),
    samples: resource?.samples ? structuredClone(resource.samples) : [],
    collocations: resource?.collocations ? structuredClone(resource.collocations) : [],
    quickCheck: resource?.quickCheck ? structuredClone(resource.quickCheck) : null,
    tips: resource?.tips ?? "",
  };
}

export function mergeVocabularyEditorItem(
  resource: TopicVocabularyResource | undefined,
  draft: TopicVocabularyAuthoringDraft,
  orderIndex: number,
): TopicVocabularyResource {
  return {
    vocabId: draft.vocabId || null,
    senseId: draft.senseId || null,
    snapshot: {
      word: draft.word || null,
      pos: draft.pos || null,
      sense: draft.sense,
      describeVi: draft.meaningVi || null,
      phonetic: draft.ipa || null,
      audioUrl: draft.audioUrl,
      audioEnUrl: draft.audioEnUrl,
      audioUsUrl: draft.audioUsUrl,
    },
    samples: structuredClone(draft.samples),
    collocations: structuredClone(draft.collocations),
    quickCheck: structuredClone(draft.quickCheck),
    orderIndex: resource ? resource.orderIndex : orderIndex,
    tips: draft.tips || null,
  };
}
