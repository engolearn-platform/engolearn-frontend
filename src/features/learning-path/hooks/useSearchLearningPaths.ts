import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { learningPathService } from "@features/learning-path/services/learningPath.service";

export function useSearchLearningPaths(keyword: string) {
  const fetchLearningPaths = useCallback(
    (signal: AbortSignal) => learningPathService.search(keyword, signal),
    [keyword],
  );

  return useFetch(fetchLearningPaths, keyword.length > 0);
}
