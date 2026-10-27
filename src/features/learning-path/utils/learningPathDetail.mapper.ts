import type {
  LearningPathDetail,
  LearningPathDetailDto,
  LearningPathWeek,
} from "@features/learning-path/types/learning-path-detail.types";

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

function rounded(value: number | null | undefined): number | null {
  return value == null ? null : Math.round(value);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function precedingDate(value: string | null): string {
  return value ? formatDate(new Date(new Date(value).getTime() - 1).toISOString()) : "—";
}

function remainingDays(closeAt: string | null): number | undefined {
  if (!closeAt) return undefined;
  return Math.max(0, Math.ceil((new Date(closeAt).getTime() - Date.now()) / 86_400_000));
}

function mapWeek(week: LearningPathDetailDto["weeks"][number]): LearningPathWeek {
  const overall = week.stats?.overall;
  return {
    number: week.weekNo,
    status: week.status,
    startDate: formatDate(week.openedAt),
    endDate: precedingDate(week.status === "CLOSED" ? week.closedAt ?? week.closeAt : week.closeAt),
    closeDate: formatDate(week.closeAt),
    remainingDays: week.status === "OPEN" ? remainingDays(week.closeAt) : undefined,
    assigned: overall?.assigned ?? week.progress?.assigned ?? 0,
    answered: overall?.answered ?? week.progress?.answered ?? 0,
    correct: overall?.correct ?? 0,
    wrong: overall?.wrong,
    completionRate: rounded(overall?.completionRate),
    practiceScore: rounded(overall?.practiceScore),
    days: week.days.map((day) => ({
      number: day.dayNo,
      status: day.status,
      assigned: day.progress?.assigned ?? 0,
      answered: day.progress?.answered ?? 0,
      completionRate: rounded(day.result?.completionRate),
      practiceScore: rounded(day.result?.practiceScore),
    })),
    microSkillResults: week.stats?.byMicroSkill.map((result) => ({
      name: result.microSkill,
      assigned: result.assigned,
      answered: result.answered,
      completionRate: rounded(result.completionRate),
      practiceScore: rounded(result.practiceScore),
      comparisonScore: rounded(result.comparedTo?.percent),
      improvementPp: rounded(result.improvementPp),
    })) ?? [],
  };
}

export function mapLearningPathDetail(dto: LearningPathDetailDto): LearningPathDetail {
  const completion = dto.summary?.completion;
  const durationWeeks = dto.config?.durationWeeks ?? dto.weeks.length;
  return {
    id: dto.id,
    createdDate: dto.createdDate,
    completedDate: dto.summary?.computedAt
      ? formatDate(dto.summary.computedAt).split("/").reverse().join("-")
      : null,
    level: dto.level,
    status: dto.status,
    currentWeekNo: dto.currentWeekNo,
    assigned: completion?.assigned ?? dto.progress?.assigned ?? 0,
    answered: completion?.answered ?? dto.progress?.answered ?? 0,
    completionRate: rounded(completion?.completionRate),
    durationWeeks,
    questionsPerDay: dto.config?.questionsPerDay,
    questionsPerWeek: dto.config
      ? dto.config.questionsPerSkillPerWeek * dto.microSkills.length
      : undefined,
    microSkills: dto.microSkills.map((skill) => ({
      name: skill.microSkill,
      skill: skill.skill,
      initialScore: rounded(skill.baseline?.percent),
    })),
    weeks: dto.weeks.map(mapWeek),
    finalResults: dto.summary?.byMicroSkill.map((result) => ({
      name: result.microSkill,
      answered: result.answered,
      assigned: (dto.config?.questionsPerSkillPerWeek ?? 0) * durationWeeks,
      correct: result.correct,
      finalPracticeScore: rounded(result.finalPracticeScore),
      improvementPp: rounded(result.improvementPp),
    })) ?? [],
  };
}
