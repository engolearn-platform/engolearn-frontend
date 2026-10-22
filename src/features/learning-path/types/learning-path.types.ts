export type LearningPathStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface LearningPathMicroSkill {
  microSkill: string;
  skill: string;
  baselinePercent: number | null;
}

export interface LearningPathProgress {
  assigned: number;
  answered: number;
  correct: number;
}

/** Mirrors the current GET /api/learning-paths response contract. */
export interface LearningPathListItem {
  id: string;
  createdDate: string;
  level: string;
  k: number;
  microSkills: LearningPathMicroSkill[];
  status: LearningPathStatus;
  currentWeekNo: number | null;
  progress: LearningPathProgress | null;
  cancelReason: string | null;
}
