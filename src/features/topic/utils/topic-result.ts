import type { ItemActionsDto, ItemResultDto, TopicResultDto } from "@features/topic/types/topic-api.types";

function requireResult(condition: unknown): asserts condition {
  if (!condition) throw Object.assign(new Error("Invalid topic result response"), { code: "CONTRACT_MISMATCH" });
}
function score(value: { firstTryCorrectCount: number; totalQuizCount: number; accuracyPercent: number }) {
  return Number.isInteger(value.firstTryCorrectCount) && value.firstTryCorrectCount >= 0 &&
    Number.isInteger(value.totalQuizCount) && value.totalQuizCount >= 1 && value.firstTryCorrectCount <= value.totalQuizCount &&
    Number.isInteger(value.accuracyPercent) && value.accuracyPercent >= 0 && value.accuracyPercent <= 100;
}
function actions(value: ItemActionsDto) {
  return value && [value.start, value.continue, value.review, value.retry, value.resumeRetry, value.restartRetry]
    .every(action => action && typeof action.allowed === "boolean");
}
export function assertItemResult(value: ItemResultDto, topicId: string, attemptId: string): void {
  requireResult(value && value.topicId === topicId && value.attemptId === attemptId && typeof value.topicItemId === "string" &&
    typeof value.title === "string" && typeof value.completedAt === "string" && score(value) &&
    (value.nextTopicItemId === null || typeof value.nextTopicItemId === "string") &&
    value.nextItemAvailability && typeof value.nextItemAvailability.allowed === "boolean");
  requireResult(!value.nextItemAvailability.allowed || !!value.nextTopicItemId);
}
export function assertTopicResult(value: TopicResultDto, topicId: string): void {
  requireResult(value && value.topicId === topicId && typeof value.titleVi === "string" && score(value) &&
    value.retryAvailability && typeof value.retryAvailability.allowed === "boolean" && Array.isArray(value.items) &&
    value.items.every(item => typeof item.topicItemId === "string" && typeof item.title === "string" &&
      typeof item.completedAttemptId === "string" && typeof item.hasNewContent === "boolean" && score(item) && actions(item.actions)));
  requireResult(new Set(value.items.map(item => item.topicItemId)).size === value.items.length);
}
