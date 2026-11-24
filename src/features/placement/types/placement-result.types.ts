import type { PlacementLevel } from "./placement-attempt.types";

/** Result summary returned only to a User authorized by the backend. */
export interface PlacementResult {
  attemptId: string;
  status: "SUBMITTED" | "AUTO_SUBMITTED";
  score: number;
  totalQuestions: number;
  placementLevel: PlacementLevel;
  /** Business end time of the attempt (`ended_at`). */
  completedAt: string;
  /** Optional aggregate from the result API; never derived from P02 answers. */
  summary?: {
    incorrectCount: number;
    unansweredCount: number;
  };
}
