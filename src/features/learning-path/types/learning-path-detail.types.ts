import type { LearningPathStatus } from "./learning-path.types";

export type LearningPathTab = 1 | 2 | 3 | "summary";
export type LearningPathWeekStatus = "OPEN" | "CLOSED" | "LOCKED";
export type LearningPathDayStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLOSED";

export interface LearningPathMicroSkill {
  name: string;
  skill: "LISTENING" | "READING";
  initialScore: number;
}

export interface LearningPathDay {
  number: number;
  status: LearningPathDayStatus;
  answered: number;
  assigned: number;
  correct: number | null;
}

export interface LearningPathWeekMicroSkillResult {
  name: string;
  answered: number;
  assigned: number;
  correct: number;
  comparisonScore: number | null;
}

export interface LearningPathWeek {
  number: 1 | 2 | 3;
  status: LearningPathWeekStatus;
  startDate: string;
  endDate: string;
  closeDate: string;
  remainingDays?: number;
  answered: number;
  assigned: number;
  correct: number;
  days: LearningPathDay[];
  microSkillResults: LearningPathWeekMicroSkillResult[];
}

export interface LearningPathFinalMicroSkillResult {
  name: string;
  answered: number;
  assigned: number;
  correct: number;
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
  microSkills: LearningPathMicroSkill[];
  weeks: LearningPathWeek[];
  finalResults: LearningPathFinalMicroSkillResult[];
}
