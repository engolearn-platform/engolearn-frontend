import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { learningPathService } from "@features/learning-path/services/learningPath.service";
import { mapDayResult } from "@features/learning-path/utils/learningPathDay.mapper";

export function useLearningPathDayResult(pathId: string, weekNo: string, dayNo: string) {
  const load = useCallback(async (signal: AbortSignal) => {
    const result = await learningPathService.dayResult(pathId, weekNo, dayNo, signal);
    return { result, ...mapDayResult(result) };
  }, [pathId, weekNo, dayNo]);
  return useFetch(load);
}
