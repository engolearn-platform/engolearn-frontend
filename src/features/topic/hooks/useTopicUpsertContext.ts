import { useParams } from "react-router";
import { useFetch } from "@shared/hooks";
import { useCallback, useMemo } from "react";
import type {
  TopicUpsertMode,
  TopicUpsertSnapshot,
} from "../types/topic-create.types";
import { topicManagementService } from "../services/topic-management.service";
import type { TopicManagementResponse } from "../types/topic-management.types";
import { topicDraftFromResponse } from "@features/topic/utils/topic-basic-info.adapter";
import type { NormalizedError } from "@shared/hooks/useFetch";

export interface TopicUpsertContext {
  mode: TopicUpsertMode;
  topicId?: string;
  /** Dữ liệu hiện có — chỉ có ở mode update. */
  snapshot?: TopicUpsertSnapshot;
  isMissing: boolean;
  loading?: boolean;
  error?: NormalizedError;
  response?: TopicManagementResponse;
  reload: () => void;
}

function mapResponseToSnapshot(response: TopicManagementResponse): TopicUpsertSnapshot {
  return {
    topicId: response.id,
    basicInfo: topicDraftFromResponse(response),
    items: [],
    quality: {
      score: 0,
      max: 100,
      coverageNote: "",
      checks: [],
    },
    updatedNote: response.updatedAt ? `Cập nhật lần cuối: ${response.updatedAt}` : undefined,
  };
}

/**
 * Resolve mode cho wizard topic dùng chung:
 * - không có `:topicId` → `create`
 * - có `:topicId` → `update` + snapshot hiện có
 */
export function useTopicUpsertContext(): TopicUpsertContext {
  const { topicId } = useParams<{ topicId?: string }>();

  const fetchSnapshot = useCallback(
    (signal: AbortSignal) => {
      if (!topicId) {
        return Promise.reject(new Error("No topicId"));
      }
      return topicManagementService.fetchTopicById(topicId, signal);
    },
    [topicId],
  );

  const { data, loading, error, refetch } = useFetch<TopicManagementResponse>(fetchSnapshot, !!topicId);

  // Stable identity per response so consumers (form state hydration) don't see
  // a brand-new snapshot object on every render.
  const fetchedSnapshot = useMemo(
    () => (data ? mapResponseToSnapshot(data) : undefined),
    [data],
  );

  if (!topicId) {
    return { mode: "create", isMissing: false, reload: refetch };
  }

  if (error) {
    return { mode: "update", topicId, isMissing: error.status === 404, error, reload: refetch };
  }
  if (data?.id === topicId) {
    return {
      mode: "update",
      topicId,
      snapshot: fetchedSnapshot,
      isMissing: false,
      response: data,
      reload: refetch,
    };
  }

  return {
    mode: "update",
    topicId,
    isMissing: false,
    loading: loading || !data || data.id !== topicId,
    reload: refetch,
  };
}
