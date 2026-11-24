import type { PlacementAttemptStatus } from "./placement.types";

export type PlacementSection = "READING" | "LISTENING";

export type PlacementLevel = "A1" | "A2" | "B1" | "B2";

export type PlacementOptionLabel = "A" | "B" | "C" | "D";

export interface PlacementOption {
  id: string;
  label: PlacementOptionLabel;
  text: string;
}

export interface PlacementQuestionAudio {
  /** The sample backend currently has no audio file URL. */
  url: string | null;
  durationSeconds: number;
}

export interface PlacementQuestion {
  id: string;
  order: number;
  section: PlacementSection;
  level: PlacementLevel;
  /** Reading skill/label, e.g. "Ngữ pháp cơ bản". Listening has none. */
  label?: string | null;
  prompt: string;
  /** Reading-only stimulus; null/absent for Listening. */
  passage?: string | null;
  options: PlacementOption[];
  audio?: PlacementQuestionAudio | null;
}

export interface PlacementAnswer {
  questionId: string;
  selectedOptionId: string | null;
}

export interface PlacementAttemptDetail {
  attemptId: string;
  status: PlacementAttemptStatus;
  startedAt: string;
  deadlineAt: string;
  /** Server clock at response time; used to offset the client countdown. */
  serverNow: string;
  totalQuestions: number;
  /** Ordered: every READING question before the first LISTENING question. */
  questions: PlacementQuestion[];
  answers: PlacementAnswer[];
  /** Backend-owned: Guest attempts must authenticate before seeing results. */
  claimRequired: boolean;
}

export type PlacementSubmitStatus = Extract<
  PlacementAttemptStatus,
  "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED"
>;

export interface PlacementSubmitResult {
  attemptId: string;
  status: PlacementSubmitStatus;
  answeredCount: number;
  claimRequired: boolean;
}

export interface PlacementAttemptPage {
  index: number;
  section: PlacementSection;
  questions: PlacementQuestion[];
  firstOrder: number;
  lastOrder: number;
}
