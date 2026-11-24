import type { TopicBasicInfoDraft } from "@features/topic/types/topic-create.types";
import type {
  TopicCreateRequest,
  TopicManagementResponse,
  TopicUpdateRequest,
} from "@features/topic/types/topic-management.types";

export function topicDraftFromResponse(response: TopicManagementResponse): TopicBasicInfoDraft {
  return {
    titleEn: response.titleEn ?? "",
    titleVi: response.titleVi ?? "",
    cefr: response.cefr ?? "",
    category: response.category ?? "",
    description: response.description ?? "",
    tags: response.tags ?? [],
    duration: response.durationMinutes ? `${response.durationMinutes} phút` : "—",
    coverName: response.coverUrl ?? "",
    coverMeta: "",
  };
}

export function topicCreateBody(draft: TopicBasicInfoDraft): TopicCreateRequest {
  const body: TopicCreateRequest = {
    titleEn: draft.titleEn.trim(),
    titleVi: draft.titleVi.trim(),
  };
  if (draft.cefr) body.cefr = draft.cefr;
  if (draft.category) body.category = draft.category;
  if (draft.description.trim()) body.description = draft.description.trim();
  if (draft.coverName.trim()) body.coverUrl = draft.coverName.trim();
  if (draft.tags.length) body.tags = draft.tags;
  return body;
}

export function topicUpdateBody(original: TopicBasicInfoDraft, draft: TopicBasicInfoDraft, revision: number): TopicUpdateRequest {
  const before = topicCreateBody(original);
  const after = topicCreateBody(draft);
  const body: TopicUpdateRequest = { revision };
  if (before.titleEn !== after.titleEn) body.titleEn = after.titleEn;
  if (before.titleVi !== after.titleVi) body.titleVi = after.titleVi;
  if (before.cefr !== after.cefr) body.cefr = after.cefr ?? null;
  if (before.category !== after.category) body.category = after.category ?? null;
  if (before.description !== after.description) body.description = after.description ?? null;
  if (before.coverUrl !== after.coverUrl) body.coverUrl = after.coverUrl ?? null;
  if (JSON.stringify(before.tags) !== JSON.stringify(after.tags)) body.tags = after.tags ?? [];
  return body;
}
