export type LearningPathStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type LearningPathListStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface LearningPathProgress {
  assigned: number;
  answered: number;
}

export interface LearningPathListItem {
  id: string;
  sourceAttemptId: string | null;
  createdDate: string;
  level: string;
  k: number;
  microSkills: string[];
  status: LearningPathStatus;
  currentWeekNo: number | null;
  progress: LearningPathProgress | null;
}

export interface LearningPathListCounts {
  active: number;
  completed: number;
  cancelled: number;
}

export interface LearningPathListData {
  items: LearningPathListItem[];
  counts: LearningPathListCounts;
}

export interface LearningPathApiResponse<T> {
  data: T;
  timestamp: string;
}
