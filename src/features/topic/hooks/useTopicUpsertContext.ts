import { useParams } from "react-router";
import { useFetch } from "@shared/hooks";
import { useCallback, useMemo } from "react";
import type {
  TopicUpsertMode,
  TopicUpsertSnapshot,
} from "../types/topic-create.types";
import { getTopicUpsertSnapshot } from "../types/topic-create.types";
import { topicManagementService } from "../services/topic-management.service";
import type { TopicManagementResponse } from "../types/topic-management.types";

export interface TopicUpsertContext {
  mode: TopicUpsertMode;
  topicId?: string;
  /** Dữ liệu hiện có — chỉ có ở mode update. */
  snapshot?: TopicUpsertSnapshot;
  /** Route update nhưng không tìm thấy snapshot (UI-only mock). */
  isMissing: boolean;
  loading?: boolean;
  error?: unknown;
}

function mapResponseToSnapshot(response: TopicManagementResponse): TopicUpsertSnapshot {
  return {
    topicId: response.id,
    basicInfo: {
      titleEn: response.titleEn ?? "",
      titleVi: response.titleVi ?? "",
      cefr: response.cefr ?? "A1",
      category: response.category ?? "DINING",
      duration: response.durationMinutes ? `${response.durationMinutes} phút` : "—",
      description: response.description ?? "",
      tags: [],
      coverName: response.coverUrl ?? "",
      coverMeta: "",
    },
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

  const { data, loading, error } = useFetch<TopicManagementResponse>(fetchSnapshot, !!topicId);

  // Stable identity per response so consumers (form state hydration) don't see
  // a brand-new snapshot object on every render.
  const fetchedSnapshot = useMemo(
    () => (data ? mapResponseToSnapshot(data) : undefined),
    [data],
  );

  if (!topicId) {
    return { mode: "create", isMissing: false };
  }

  if (loading) {
    return { mode: "update", topicId, isMissing: false, loading: true };
  }

  if (error) {
    const status = (error as { status?: number }).status;
    if (status === 404) {
      return { mode: "update", topicId, isMissing: true, error };
    }
    // Fallback to mock if available
    const mockSnapshot = getTopicUpsertSnapshot(topicId);
    if (mockSnapshot) {
      return { mode: "update", topicId, snapshot: mockSnapshot, isMissing: false, error };
    }
    return { mode: "update", topicId, isMissing: true, error };
  }

  if (data) {
    return {
      mode: "update",
      topicId,
      snapshot: fetchedSnapshot,
      isMissing: false,
    };
  }

  const mockSnapshot = getTopicUpsertSnapshot(topicId);
  return {
    mode: "update",
    topicId,
    snapshot: mockSnapshot,
    isMissing: !mockSnapshot,
  };
}
