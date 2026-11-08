import type { PlacementReviewQuestion } from "@features/placement/types/placement-review.types";

export type ReviewAnswerState = "CORRECT" | "INCORRECT" | "UNANSWERED";

/** Display state only — never used to recompute the saved score or level. */
export function getReviewAnswerState(
  question: PlacementReviewQuestion,
): ReviewAnswerState {
  if (question.selectedOptionId === null) return "UNANSWERED";
  return question.selectedOptionId === question.correctOptionId
    ? "CORRECT"
    : "INCORRECT";
}

/** Consecutive groups of 3, including the Reading/Listening boundary. */
export function buildReviewPages(
  questions: PlacementReviewQuestion[],
): PlacementReviewQuestion[][] {
  const ordered = [...questions].sort((left, right) => left.order - right.order);
  const pages: PlacementReviewQuestion[][] = [];

  for (let index = 0; index < ordered.length; index += 3) {
    pages.push(ordered.slice(index, index + 3));
  }

  return pages;
}
