import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { topicCatalogService } from "@features/topic/services/topic-catalog.service";

export function useTopicDetail(topicId: string) {
  return useFetch(useCallback((signal: AbortSignal) => topicCatalogService.detail(topicId, signal), [topicId]));
}
export function useTopicProgress(topicId: string, learner: boolean) {
  return useFetch(useCallback((signal: AbortSignal) => topicCatalogService.progress(topicId, signal), [topicId]), learner);
}
