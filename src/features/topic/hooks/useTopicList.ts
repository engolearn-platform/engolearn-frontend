import { useCallback, useState } from "react";
import { useFetch } from "@shared/hooks";
import type { TopicManagementListQueryParams, TopicManagementListResponse } from "../types/topic-management.types";
import { topicManagementService } from "../services/topic-management.service";

export interface TopicListParams extends TopicManagementListQueryParams {
  page: number;
  size: number;
}

const DEFAULT_PARAMS: TopicListParams = {
  search: "",
  cefr: undefined,
  category: undefined,
  status: undefined,
  page: 0,
  size: 20,
};

export function useTopicList(initialParams: Partial<TopicListParams> = {}) {
  const [params, setParams] = useState<TopicListParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });

  const fetchList = useCallback(
    (signal: AbortSignal) => {
      const query: TopicManagementListQueryParams = {
        page: params.page,
        size: params.size,
      };
      if (params.search && params.search.trim()) {
        query.search = params.search.trim();
      }
      if (params.cefr && (params.cefr as string) !== "ALL") {
        query.cefr = params.cefr as TopicManagementListQueryParams["cefr"];
      }
      if (params.category && (params.category as string) !== "ALL") {
        query.category = params.category as TopicManagementListQueryParams["category"];
      }
      if (params.status && (params.status as string) !== "ALL") {
        query.status = params.status as TopicManagementListQueryParams["status"];
      }
      return topicManagementService.fetchTopicList(query, signal);
    },
    [params],
  );

  const { data, loading, error, refetch } = useFetch<TopicManagementListResponse>(fetchList);

  const setFilter = (patch: Partial<TopicListParams>) => {
    setParams((prev) => ({
      ...prev,
      ...patch,
      page: 0,
    }));
  };

  const setPage = (page: number) => {
    setParams((prev) => ({
      ...prev,
      page,
    }));
  };

  return { data, loading, error, refetch, params, setFilter, setPage };
}
