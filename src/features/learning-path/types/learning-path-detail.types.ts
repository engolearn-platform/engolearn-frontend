import type { LearningPathStatus } from "./learning-path.types";

export type LearningPathTab = number | "summary";
export type LearningPathWeekStatus = "OPEN" | "CLOSED" | "LOCKED";
export type LearningPathDayStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SUBMITTED"
  | "CLOSED";

export interface LearningPathMicroSkill {
  name: string;
  skill: "LISTENING" | "READING";
  initialScore: number | null;
}

export interface LearningPathDay {
  number: number;
  status: LearningPathDayStatus;
  closedAt?: string | null;
  answered: number;
  assigned: number;
  correct?: number | null;
  completionRate?: number | null;
  practiceScore?: number | null;
}

export interface LearningPathWeekMicroSkillResult {
  name: string;
  answered: number;
  assigned: number;
  correct?: number;
  completionRate?: number | null;
  practiceScore?: number | null;
  comparisonScore: number | null;
  improvementPp?: number | null;
}

export interface LearningPathWeek {
  number: number;
  status: LearningPathWeekStatus;
  startDate: string;
  endDate: string;
  closeDate: string;
  closeAt?: string | null;
  remainingDays?: number;
  answered: number;
  assigned: number;
  correct: number;
  wrong?: number;
  completionRate?: number | null;
  practiceScore?: number | null;
  days: LearningPathDay[];
  microSkillResults: LearningPathWeekMicroSkillResult[];
}

export interface LearningPathFinalMicroSkillResult {
  name: string;
  answered: number;
  assigned: number;
  correct: number;
  finalPracticeScore?: number | null;
  improvementPp?: number | null;
}

export interface LearningPathDetail {
  id: string;
  createdDate: string;
  completedDate: string | null;
  level: string;
  status: LearningPathStatus;
  currentWeekNo: number | null;
  answered: number;
  assigned: number;
  completionRate?: number | null;
  durationWeeks?: number;
  questionsPerDay?: number;
  questionsPerWeek?: number;
  microSkills: LearningPathMicroSkill[];
  weeks: LearningPathWeek[];
  finalResults: LearningPathFinalMicroSkillResult[];
}

export interface LearningPathDetailDto {
  id: string;
  createdDate: string;
  level: string;
  k: number;
  status: LearningPathStatus;
  currentWeekNo: number | null;
  config: {
    durationWeeks: number;
    questionsPerDay: number;
    questionsPerSkillPerWeek: number;
  } | null;
  microSkills: {
    microSkill: string;
    skill: "LISTENING" | "READING";
    baseline: { percent: number | null } | null;
  }[];
  progress: { assigned: number; answered: number } | null;
  weeks: {
    weekNo: number;
    status: LearningPathWeekStatus;
    openedAt: string | null;
    closeAt: string | null;
    closedAt: string | null;
    progress: { assigned: number; answered: number } | null;
    stats: {
      byMicroSkill: {
        microSkill: string;
        assigned: number;
        answered: number;
        completionRate: number | null;
        practiceScore: number | null;
        comparedTo: { type: string; weekNo: number | null; percent: number | null } | null;
        improvementPp: number | null;
      }[];
      overall: {
        assigned: number;
        answered: number;
        correct: number;
        wrong: number;
        completionRate: number | null;
        practiceScore: number | null;
      } | null;
    } | null;
    days: {
      dayNo: number;
      status: LearningPathDayStatus;
      closedAt: string | null;
      progress: { assigned: number; answered: number } | null;
      result: { completionRate: number | null; practiceScore: number | null } | null;
    }[];
  }[];
  summary: {
    byMicroSkill: {
      microSkill: string;
      baselinePercent: number | null;
      answered: number;
      correct: number;
      finalPracticeScore: number | null;
      improvementPp: number | null;
    }[];
    completion: { assigned: number; answered: number; completionRate: number | null } | null;
    computedAt: string | null;
  } | null;
}
