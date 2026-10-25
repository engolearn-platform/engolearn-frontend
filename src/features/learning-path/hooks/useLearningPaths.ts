import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import type { LearningPathListStatus } from "../types/learning-path.types";
import { learningPathService } from "../services/learningPath.service";

export function useLearningPaths(
  status: LearningPathListStatus,
  immediate = true,
) {
  const fetchLearningPaths = useCallback(
    (signal: AbortSignal) => learningPathService.list(status, signal),
    [status],
  );

  return useFetch(fetchLearningPaths, immediate);
}
