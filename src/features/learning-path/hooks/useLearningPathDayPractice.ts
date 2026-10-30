import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { learningPathService } from "@features/learning-path/services/learningPath.service";
import { mapPracticeDay } from "@features/learning-path/utils/learningPathDay.mapper";

export function useLearningPathDayPractice(pathId: string, weekNo: string, dayNo: string) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const day = await learningPathService.startDay(pathId, weekNo, dayNo, signal);
      return { day, ...mapPracticeDay(day) };
    },
    [pathId, weekNo, dayNo],
  );
  return useFetch(load);
}
