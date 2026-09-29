import type {
  TopicProgress,
  UpdateProgressPayload,
} from "../types/topic-progress.types";

/**
 * Mock of `PATCH /api/topic-items/:topicItemId/progress`.
 *
 * Real backend is not wired yet: logs the payload and resolves with the
 * locally advanced progress so the UI flow works end to end. Swap the body
 * for `httpService.patch` once the API contract lands.
 */
export async function updateTopicProgress(
  topicItemId: string,
  payload: UpdateProgressPayload,
  current: TopicProgress,
): Promise<TopicProgress> {
  console.info("[topic-progress] PATCH", {
    topicItemId,
    ...payload,
  });
  return {
    ...current,
    furthest_reached: {
      stage: payload.part,
      item_index: payload.item_index,
    },
  };
}
