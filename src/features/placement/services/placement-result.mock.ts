import type { PlacementResult } from "@features/placement/types/placement-result.types";

/** UI fixtures only; an unknown attempt ID must never generate a result. */
const RESULT_FIXTURES: Record<string, PlacementResult> = {
  "result-demo-a1": {
    attemptId: "result-demo-a1",
    status: "SUBMITTED",
    score: 4,
    totalQuestions: 20,
    placementLevel: "A1",
    completedAt: "2026-10-31T14:45:00+07:00",
  },
  "result-demo-a2": {
    attemptId: "result-demo-a2",
    status: "SUBMITTED",
    score: 8,
    totalQuestions: 20,
    placementLevel: "A2",
    completedAt: "2026-10-31T14:45:00+07:00",
  },
  "result-demo-b1": {
    attemptId: "result-demo-b1",
    status: "SUBMITTED",
    score: 13,
    totalQuestions: 20,
    placementLevel: "B1",
    completedAt: "2026-10-31T14:45:00+07:00",
    summary: { incorrectCount: 5, unansweredCount: 2 },
  },
  "result-demo-b2": {
    attemptId: "result-demo-b2",
    status: "AUTO_SUBMITTED",
    score: 18,
    totalQuestions: 20,
    placementLevel: "B2",
    completedAt: "2026-10-31T14:45:00+07:00",
  },
};

export function readMockPlacementResult(attemptId: string): PlacementResult {
  const result = Object.prototype.hasOwnProperty.call(RESULT_FIXTURES, attemptId)
    ? RESULT_FIXTURES[attemptId]
    : null;
  if (!result) throw new Error("Không tìm thấy kết quả.");

  return {
    ...result,
    ...(result.summary ? { summary: { ...result.summary } } : {}),
  };
}
