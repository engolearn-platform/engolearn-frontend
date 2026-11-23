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
  _resource: TopicVocabularyResource | undefined,
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
    orderIndex,
    tips: draft.tips || null,
  };
}
