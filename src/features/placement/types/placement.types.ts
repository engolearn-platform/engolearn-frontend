export type PlacementAttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "AUTO_SUBMITTED"
  | "EXPIRED";

export interface PlacementInfoItem {
  id: string;
  value: string;
  label: string;
}

export interface PlacementIntroRule {
  id: string;
  text: string;
}

export interface PlacementNavItem {
  id: string;
  label: string;
  to: string;
  enabled: boolean;
}

export interface PlacementStartResult {
  attemptId: string;
  status: PlacementAttemptStatus;
  deadlineAt: string;
  claimRequired: boolean;
}

export interface PlacementCurrentAttempt {
  attemptId: string;
  status: PlacementAttemptStatus;
  deadlineAt: string;
  serverNow: string;
  totalQuestions: number;
  answeredCount: number;
  nextSection: "READING" | "LISTENING";
  resumeOrder: number | null;
  lastSavedAt: string | null;
  claimRequired: boolean;
}
