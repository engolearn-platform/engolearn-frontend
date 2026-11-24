/** Authorized, read-only review. Never reuse the IN_PROGRESS question type. */
export interface PlacementReview {
  attemptId: string;
  status: "SUBMITTED" | "AUTO_SUBMITTED";
  totalQuestions: number;
  score: number;
  placementLevel: "A1" | "A2" | "B1" | "B2";
  incorrectCount: number;
  unansweredCount: number;
  questions: PlacementReviewQuestion[];
}

export interface PlacementReviewQuestion {
  id: string;
  order: number;
  section: "READING" | "LISTENING";
  prompt: string;
  /** Reading-only stimulus; null/absent for Listening. */
  passage?: string | null;
  options: PlacementReviewOption[];
  selectedOptionId: string | null;
  correctOptionId: string;
  explanation?: string | null;
  audio?: {
    url: string | null;
    durationSeconds: number;
  } | null;
}

export interface PlacementReviewOption {
  id: string;
  label: "A" | "B" | "C" | "D";
  text: string;
}
