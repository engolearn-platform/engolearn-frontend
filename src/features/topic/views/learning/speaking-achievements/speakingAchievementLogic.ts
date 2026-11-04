export type AchievementStatus = "ACTIVE" | "INTERRUPTED" | "COMPLETED" | "INCOMPLETE";

export interface AchievementGoal {
  id: string;
  title: string;
  required: boolean;
  achieved: boolean;
  evidenceQuote: string | null;
  evidenceTurnId: string | null;
}

export interface AchievementSnapshot {
  sessionId: string;
  status: AchievementStatus;
  goals: AchievementGoal[];
  validTurns: number;
  minValidTurns: number;
  requiredMet: boolean;
  eligibleToFinish: boolean;
  revision: number | null;
}

export type CelebrationType =
  | "NONE"
  | "SINGLE_GOAL"
  | "MULTIPLE_GOALS"
  | "REQUIRED_MILESTONE"
  | "ELIGIBLE_TO_FINISH"
  | "ALL_GOALS"
  | "FINAL_ALL_GOALS"
  | "FINAL_COMPLETED"
  | "FINAL_INCOMPLETE";

export interface CelebrationDecision {
  type: CelebrationType;
  sessionId: string;
  anchorTurnId: string | null;
  newGoalIds: string[];
  eventKey: string;
  remainingValidTurns: number;
}

export interface AchievementSummary {
  requiredTotal: number;
  requiredAchieved: number;
  optionalTotal: number;
  optionalAchieved: number;
  allGoalsMet: boolean;
  turnsMet: boolean;
  remainingValidTurns: number;
}

export function summarizeAchievements(snapshot: AchievementSnapshot): AchievementSummary {
  const required = snapshot.goals.filter(goal => goal.required);
  const optional = snapshot.goals.filter(goal => !goal.required);
  const requiredAchieved = required.filter(goal => goal.achieved).length;
  const optionalAchieved = optional.filter(goal => goal.achieved).length;

  return {
    requiredTotal: required.length,
    requiredAchieved,
    optionalTotal: optional.length,
    optionalAchieved,
    allGoalsMet: snapshot.goals.length > 0 && snapshot.goals.every(goal => goal.achieved),
    turnsMet: snapshot.validTurns >= snapshot.minValidTurns,
    remainingValidTurns: Math.max(0, snapshot.minValidTurns - snapshot.validTurns),
  };
}

function isFinal(status: AchievementStatus) {
  return status === "COMPLETED" || status === "INCOMPLETE";
}

/**
 * Chooses one UI response for a new, server-authoritative transition. This is
 * intentionally independent from React so snapshots from the socket and REST
 * actions can share the same idempotent rules.
 */
export function decideCelebration(
  before: AchievementSnapshot | null,
  after: AchievementSnapshot,
  options: { turnId?: string; liveTransition: boolean },
): CelebrationDecision {
  const afterSummary = summarizeAchievements(after);
  const newGoalIds = before?.sessionId === after.sessionId
    ? after.goals.filter(goal => goal.achieved && !before.goals.some(previous =>
      previous.id === goal.id && previous.achieved)).map(goal => goal.id)
    : [];
  const keySuffix = options.turnId ?? (isFinal(after.status) ? `final:${after.revision ?? after.status}` : "snapshot");
  const decision = (type: CelebrationType): CelebrationDecision => ({
    type,
    sessionId: after.sessionId,
    anchorTurnId: options.turnId ?? null,
    newGoalIds,
    eventKey: `${after.sessionId}:${keySuffix}:${type}:${newGoalIds.slice().sort().join(",")}`,
    remainingValidTurns: afterSummary.remainingValidTurns,
  });

  if (!options.liveTransition || !before || before.sessionId !== after.sessionId || isFinal(before.status)) {
    return decision("NONE");
  }

  const beforeSummary = summarizeAchievements(before);
  if (after.status === "COMPLETED") return decision(afterSummary.allGoalsMet ? "FINAL_ALL_GOALS" : "FINAL_COMPLETED");
  if (after.status === "INCOMPLETE") return decision("FINAL_INCOMPLETE");
  if (!beforeSummary.allGoalsMet && afterSummary.allGoalsMet) return decision("ALL_GOALS");
  if (!before.eligibleToFinish && after.eligibleToFinish) return decision("ELIGIBLE_TO_FINISH");
  if (!before.requiredMet && after.requiredMet) return decision("REQUIRED_MILESTONE");
  if (newGoalIds.length > 1) return decision("MULTIPLE_GOALS");
  if (newGoalIds.length === 1) return decision("SINGLE_GOAL");
  return decision("NONE");
}
