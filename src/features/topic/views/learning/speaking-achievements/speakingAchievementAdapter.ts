import type { SpeakingSession } from "@features/topic/types/speaking.types";
import type { AchievementSnapshot } from "./speakingAchievementLogic";

/** Maps only fields persisted by the existing Speaking session response. */
export function toAchievementSnapshot(session: SpeakingSession): AchievementSnapshot {
  const resultByGoal = new Map(session.goalResults.map(result => [result.goalId, result]));
  const evidenceTurnByGoal = new Map<string, string>();
  for (const turn of session.turns) {
    for (const evidence of turn.assessment?.goalEvidence ?? []) {
      if (!evidenceTurnByGoal.has(evidence.goalId)) evidenceTurnByGoal.set(evidence.goalId, turn.id);
    }
  }

  return {
    sessionId: session.id,
    status: session.status,
    goals: session.content.goals.map(goal => {
      const result = resultByGoal.get(goal.id);
      return {
        id: goal.id,
        title: goal.title,
        required: goal.priority === "REQUIRED",
        achieved: result?.achieved ?? session.achievedGoalIds.includes(goal.id),
        evidenceQuote: result?.evidenceQuote ?? null,
        evidenceTurnId: evidenceTurnByGoal.get(goal.id) ?? null,
      };
    }),
    validTurns: session.validTurnCount,
    minValidTurns: session.content.minimumValidTurns,
    requiredMet: session.requiredGoalsMet,
    eligibleToFinish: session.completionEligible,
    revision: session.revision ?? null,
  };
}

export function isFinalizedSession(session: SpeakingSession) {
  return session.status === "COMPLETED" || session.status === "INCOMPLETE";
}
