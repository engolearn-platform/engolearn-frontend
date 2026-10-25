import { useParams } from "react-router";
import type {
  TopicUpsertMode,
  TopicUpsertSnapshot,
} from "../types/topic-create.types";
import { getTopicUpsertSnapshot } from "../types/topic-create.types";

export interface TopicUpsertContext {
  mode: TopicUpsertMode;
  topicId?: string;
  /** Dữ liệu hiện có — chỉ có ở mode update. */
  snapshot?: TopicUpsertSnapshot;
  /** Route update nhưng không tìm thấy snapshot (UI-only mock). */
  isMissing: boolean;
}

/**
 * Resolve mode cho wizard topic dùng chung:
 * - không có `:topicId` → `create`
 * - có `:topicId` → `update` + snapshot hiện có
 */
export function useTopicUpsertContext(): TopicUpsertContext {
  const { topicId } = useParams<{ topicId?: string }>();

  if (!topicId) {
    return { mode: "create", isMissing: false };
  }

  const snapshot = getTopicUpsertSnapshot(topicId);
  return {
    mode: "update",
    topicId,
    snapshot,
    isMissing: !snapshot,
  };
}
