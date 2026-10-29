import { useEffect } from "react";
import { learningPathService } from "@features/learning-path/services/learningPath.service";
import type { LearningPathDetail } from "@features/learning-path/types/learning-path-detail.types";
import { mapLearningPathDetail } from "@features/learning-path/utils/learningPathDetail.mapper";
import { nextWeekOpeningTime } from "@features/learning-path/utils/learningPathWeekTiming";

const RETRY_MS = 30_000;

export function useWaitingWeekRefresh(path: LearningPathDetail | null, onUpdated: (path: LearningPathDetail) => void) {
  useEffect(() => {
    const week = path?.weeks.find((item) => item.status === "OPEN" && item.number < 3);
    if (!path || !week || week.days.length === 0
        || !week.days.every((day) => day.status === "COMPLETED" || day.status === "CLOSED")) return;

    const deadline = nextWeekOpeningTime(week);
    const now = Date.now();
    const delay = deadline !== null && deadline > now ? deadline - now + 1000 : RETRY_MS;
    const controller = new AbortController();
    let timer: number;
    const refresh = async () => {
      try {
        const response = await learningPathService.detail(path.id, controller.signal);
        if (!controller.signal.aborted) onUpdated(mapLearningPathDetail(response.data));
      } catch {
        if (!controller.signal.aborted) timer = window.setTimeout(refresh, RETRY_MS);
      }
    };
    timer = window.setTimeout(refresh, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [path, onUpdated]);
}
