import { useCallback, useEffect, useReducer, useState } from "react";
import { useFetch } from "@shared/hooks";
import { topicCatalogService } from "@features/topic/services/topic-catalog.service";
import { mergeTopicPages } from "@features/topic/utils/topic-catalog";
import type { CatalogPage } from "@features/topic/utils/topic-catalog";
import type { TopicBrowseQuery } from "@features/topic/services/topic-api.service";

export function useTopicCatalog(query: TopicBrowseQuery, mineStatus?: "IN_PROGRESS" | "COMPLETED") {
  const [cursor, setCursor] = useState<string | null>(null);
  const [committed, commit] = useReducer(
    (previous: CatalogPage | null, next: { page: CatalogPage; cursor: string | null }) => mergeTopicPages(previous, next.page, next.cursor), null,
  );
  const { keyword, level, sort } = query;
  const fetchPage = useCallback(async (signal: AbortSignal) => {
    const page = mineStatus
      ? await topicCatalogService.mine({ status: mineStatus, limit: 12, cursor: cursor ?? undefined }, signal)
      : await topicCatalogService.discover({ keyword, level, sort, limit: 12, cursor: cursor ?? undefined }, signal);
    return { page, cursor };
  }, [cursor, keyword, level, sort, mineStatus]);
  const result = useFetch(fetchPage);
  useEffect(() => { if (result.data) commit(result.data); }, [result.data]);
  const page: CatalogPage | null = committed ?? result.data?.page ?? null;
  const loading = result.loading || (!!result.data && result.data.cursor !== cursor);
  return {
    page, loading, error: result.error, refetch: result.refetch,
    loadMore: () => { if (!loading && page?.hasMore && page.nextCursor) setCursor(page.nextCursor); },
  };
}
