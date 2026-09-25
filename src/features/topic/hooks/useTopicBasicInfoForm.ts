import { useState } from "react";
import type { CefrLevel } from "../types/topic.types";
import type { TopicBasicInfoDraft } from "../types/topic-create.types";
import { TOPIC_CREATE_DEFAULT_DRAFT } from "../types/topic-create.types";

function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#+/, "").trim();
}

export function useTopicBasicInfoForm(initial?: Partial<TopicBasicInfoDraft>) {
  const [draft, setDraft] = useState<TopicBasicInfoDraft>(() => ({
    ...TOPIC_CREATE_DEFAULT_DRAFT,
    ...initial,
  }));

  const patch = (patchValue: Partial<TopicBasicInfoDraft>) =>
    setDraft((prev) => ({ ...prev, ...patchValue }));

  const setCefr = (cefr: CefrLevel) => patch({ cefr });

  const addTag = (tag: string) => {
    const clean = normalizeTag(tag);
    if (!clean) return;
    setDraft((prev) => {
      if (prev.tags.includes(clean)) return prev;
      return { ...prev, tags: [...prev.tags, clean] };
    });
  };

  const removeTag = (tag: string) =>
    setDraft((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }));

  const descriptionCount = draft.description.length;

  const isValid =
    draft.titleEn.trim().length > 0 &&
    draft.titleVi.trim().length > 0 &&
    draft.category.trim().length > 0 &&
    draft.duration.trim().length > 0 &&
    draft.description.trim().length > 0;

  return { draft, patch, setCefr, addTag, removeTag, descriptionCount, isValid };
}
