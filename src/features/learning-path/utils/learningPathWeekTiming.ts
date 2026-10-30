import type { LearningPathWeek } from "@features/learning-path/types/learning-path-detail.types";

const DAY_MS = 86_400_000;
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export function nextWeekOpeningTime(week: LearningPathWeek): number | null {
  if (week.days.length === 0) return null;
  const closedTimes = week.days.map((day) => day.closedAt ? Date.parse(day.closedAt) : NaN);
  if (closedTimes.some((time) => !Number.isFinite(time))) return null;
  const lastClosed = Math.max(...closedTimes);
  const midnight = Math.ceil((lastClosed + VIETNAM_OFFSET_MS) / DAY_MS) * DAY_MS - VIETNAM_OFFSET_MS;
  const weekDeadline = week.closeAt ? Date.parse(week.closeAt) : NaN;
  return Number.isFinite(weekDeadline) ? Math.min(midnight, weekDeadline) : midnight;
}
