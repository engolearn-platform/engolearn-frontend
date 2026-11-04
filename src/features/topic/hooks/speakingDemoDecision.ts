import type { SpeakingDemoDecision } from "@features/topic/types/speaking.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

export function parseSpeakingDemoDecision(value: unknown): SpeakingDemoDecision | null {
  if (!isRecord(value)
    || typeof value.outcome !== "string"
    || typeof value.reasonCode !== "string"
    || (value.acceptedAct !== null && typeof value.acceptedAct !== "string")
    || typeof value.resultingStatus !== "string"
    || !isNonNegativeInteger(value.finalizedTurnCount)
    || !isNonNegativeInteger(value.validTurnCount)
    || !isNonNegativeInteger(value.consecutiveEvaluationErrors)
    || !isStringArray(value.newlyAchievedGoalIds)
    || typeof value.completionEligible !== "boolean"
    || typeof value.autoEndEligible !== "boolean") {
    return null;
  }

  return {
    outcome: value.outcome,
    reasonCode: value.reasonCode,
    acceptedAct: value.acceptedAct,
    resultingStatus: value.resultingStatus,
    finalizedTurnCount: value.finalizedTurnCount,
    validTurnCount: value.validTurnCount,
    consecutiveEvaluationErrors: value.consecutiveEvaluationErrors,
    newlyAchievedGoalIds: value.newlyAchievedGoalIds,
    completionEligible: value.completionEligible,
    autoEndEligible: value.autoEndEligible,
  };
}
