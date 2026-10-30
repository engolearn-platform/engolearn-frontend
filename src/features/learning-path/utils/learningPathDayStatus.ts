import type { LearningPathDayStatus } from "@features/learning-path/types/learning-path-detail.types";

export function isFinishedDay(status: LearningPathDayStatus): boolean {
  return status === "COMPLETED" || status === "SUBMITTED" || status === "CLOSED";
}
