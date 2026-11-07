import { assessmentApi } from "@features/assessment/services/assessmentApi";
import { learningPathService } from "@features/learning-path/services/learningPath.service";
import type { HomePathSummary } from "@features/topic/components/learning/home/HomeProgressOverview";
import TopicHomeView from "@features/topic/views/learning/TopicHomeView";

async function loadActivePath(signal: AbortSignal): Promise<HomePathSummary | null> {
  const list = await learningPathService.list("ACTIVE", signal);
  const active = list.data.items[0];
  if (!active) return null;

  const { data: path } = await learningPathService.detail(active.id, signal);
  if (path.status !== "NOT_STARTED" && path.status !== "IN_PROGRESS") return null;

  const openWeek = path.weeks.find((week) => week.weekNo === path.currentWeekNo && week.status === "OPEN");
  return {
    id: path.id,
    title: path.microSkills.map((skill) => skill.microSkill).join(", ") || "Luyện tập micro-skill",
    currentWeek: path.currentWeekNo,
    totalWeeks: path.config?.durationWeeks ?? path.weeks.length,
    openDays: openWeek?.days.map((day) => ({ number: day.dayNo, status: day.status })) ?? [],
    progress: path.progress,
  };
}

async function loadMonthlyAssessments(signal: AbortSignal): Promise<number> {
  const vietnamOffsetHours = 7;
  const vietnamNow = new Date(Date.now() + vietnamOffsetHours * 60 * 60 * 1000);
  const year = vietnamNow.getUTCFullYear();
  const month = vietnamNow.getUTCMonth();
  const monthStart = Date.UTC(year, month, 1, -vietnamOffsetHours);
  const nextMonthStart = Date.UTC(year, month + 1, 1, -vietnamOffsetHours);
  const completed = new Set<string>();

  for (let page = 0; ; page += 1) {
    const history = await assessmentApi.history(page, signal);
    for (const attempt of history) {
      const finishedAt = Date.parse(attempt.finishedAt);
      if (finishedAt < monthStart) return completed.size;
      if (attempt.status !== "READY") continue;
      if (!Number.isFinite(finishedAt)) throw new Error("Assessment result has no valid completion date");
      if (finishedAt < nextMonthStart) completed.add(attempt.id);
    }
    if (history.length < 20) return completed.size;
  }
}

export default function LearnerHomeRoute() {
  return <TopicHomeView loadActivePath={loadActivePath} loadMonthlyAssessments={loadMonthlyAssessments} />;
}
