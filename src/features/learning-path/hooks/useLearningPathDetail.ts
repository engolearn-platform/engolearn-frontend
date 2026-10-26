import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { learningPathService } from "@features/learning-path/services/learningPath.service";
import { mapLearningPathDetail } from "@features/learning-path/utils/learningPathDetail.mapper";

export function useLearningPathDetail(pathId: string) {
  const fetchDetail = useCallback(async (signal: AbortSignal) => {
    const response = await learningPathService.detail(pathId, signal);
    return mapLearningPathDetail(response.data);
  }, [pathId]);

  return useFetch(fetchDetail);
}
