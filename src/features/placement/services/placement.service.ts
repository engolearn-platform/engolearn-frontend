import type { PlacementCurrentAttempt, PlacementStartResult } from "../types/placement.types";
import type {
  PlacementAttemptDetail,
  PlacementSubmitResult,
} from "../types/placement-attempt.types";
import type { PlacementClaimGate } from "../types/placement-claim.types";
import type { PlacementResult } from "../types/placement-result.types";
import type { PlacementReview } from "../types/placement-review.types";
import { placementRequest } from "./placement.http";

export async function startPlacementAttempt(): Promise<PlacementStartResult> {
  return placementRequest<PlacementStartResult>(
    "", "POST",
  );
}

export async function getPlacementAttempt(
  attemptId: string,
  signal?: AbortSignal,
): Promise<PlacementAttemptDetail> {
  return placementRequest<PlacementAttemptDetail>(
    `/${encodeURIComponent(attemptId)}`, "GET", signal,
  );
}

export async function savePlacementAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
  signal?: AbortSignal,
): Promise<void> {
  await placementRequest<{ questionId: string; selectedOptionId: string | null }>(
    `/${encodeURIComponent(attemptId)}/answers`,
    "PATCH",
    signal,
    { questionId, selectedOptionId },
  );
}

export async function submitPlacementAttempt(
  attemptId: string,
  signal?: AbortSignal,
): Promise<PlacementSubmitResult> {
  return placementRequest<PlacementSubmitResult>(
    `/${encodeURIComponent(attemptId)}/submit`, "POST", signal,
  );
}

export async function getPlacementClaimStatus(
  attemptId: string,
  signal?: AbortSignal,
): Promise<PlacementClaimGate> {
  return placementRequest<PlacementClaimGate>(
    `/${encodeURIComponent(attemptId)}/claim-gate`, "GET", signal,
  );
}

export async function getPlacementResult(
  attemptId: string,
  signal?: AbortSignal,
): Promise<PlacementResult> {
  return placementRequest<PlacementResult>(
    `/${encodeURIComponent(attemptId)}/result`, "GET", signal,
  );
}

export async function getPlacementReview(
  attemptId: string,
  signal?: AbortSignal,
): Promise<PlacementReview> {
  return placementRequest<PlacementReview>(
    `/${encodeURIComponent(attemptId)}/review`, "GET", signal,
  );
}

export async function getCurrentPlacementAttempt(signal?: AbortSignal): Promise<PlacementCurrentAttempt | null> {
  return placementRequest<PlacementCurrentAttempt | null>("/current", "GET", signal);
}

export async function activatePlacementLearning(attemptId: string): Promise<{ attemptId: string; profileLevel: string }> {
  return placementRequest<{ attemptId: string; profileLevel: string }>(`/${encodeURIComponent(attemptId)}/learning`, "POST");
}
