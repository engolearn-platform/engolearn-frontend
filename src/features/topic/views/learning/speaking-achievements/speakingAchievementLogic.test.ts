import assert from "node:assert/strict";
import { test } from "node:test";
import { decideCelebration, summarizeAchievements, type AchievementSnapshot } from "./speakingAchievementLogic.ts";

function snapshot(overrides: Partial<AchievementSnapshot> = {}): AchievementSnapshot {
  return {
    sessionId: "session-1",
    status: "ACTIVE",
    validTurns: 1,
    minValidTurns: 5,
    requiredMet: false,
    eligibleToFinish: false,
    revision: 1,
    goals: [
      { id: "required-1", title: "Gọi món", required: true, achieved: false, evidenceQuote: null, evidenceTurnId: null },
      { id: "required-2", title: "Xác nhận đơn", required: true, achieved: false, evidenceQuote: null, evidenceTurnId: null },
      { id: "optional-1", title: "Hỏi gợi ý", required: false, achieved: false, evidenceQuote: null, evidenceTurnId: null },
    ],
    ...overrides,
  };
}

test("groups two newly achieved goals from one committed evaluation", () => {
  const before = snapshot();
  const after = snapshot({ revision: 2, goals: before.goals.map(goal =>
    goal.id === "required-1" || goal.id === "optional-1" ? { ...goal, achieved: true } : goal) });

  const decision = decideCelebration(before, after, { turnId: "turn-2", liveTransition: true });
  assert.equal(decision.type, "MULTIPLE_GOALS");
  assert.deepEqual(decision.newGoalIds, ["required-1", "optional-1"]);
});

test("prioritizes required, eligible, and all-goals milestones", () => {
  const before = snapshot({ validTurns: 3 });
  const requiredMet = snapshot({
    validTurns: 3,
    revision: 2,
    requiredMet: true,
    goals: before.goals.map(goal => goal.required ? { ...goal, achieved: true } : goal),
  });
  assert.equal(decideCelebration(before, requiredMet, { turnId: "turn-3", liveTransition: true }).type, "REQUIRED_MILESTONE");

  const eligible = snapshot({ ...requiredMet, validTurns: 5, revision: 3, eligibleToFinish: true });
  assert.equal(decideCelebration(requiredMet, eligible, { turnId: "turn-5", liveTransition: true }).type, "ELIGIBLE_TO_FINISH");

  const allGoals = snapshot({
    ...requiredMet,
    revision: 3,
    goals: requiredMet.goals.map(goal => ({ ...goal, achieved: true })),
  });
  assert.equal(decideCelebration(requiredMet, allGoals, { turnId: "turn-4", liveTransition: true }).type, "ALL_GOALS");
  assert.equal(summarizeAchievements(allGoals).remainingValidTurns, 2);
});

test("uses the final transition once and suppresses duplicate, late, and hydrated events", () => {
  const before = snapshot({ validTurns: 4, requiredMet: true, eligibleToFinish: false,
    goals: snapshot().goals.map(goal => ({ ...goal, achieved: true })) });
  const finalized = snapshot({ ...before, status: "COMPLETED", validTurns: 5, eligibleToFinish: true, revision: 8 });

  assert.equal(decideCelebration(before, finalized, { turnId: "turn-5", liveTransition: true }).type, "FINAL_ALL_GOALS");
  assert.equal(decideCelebration(finalized, finalized, { turnId: "turn-5", liveTransition: true }).type, "NONE");
  assert.equal(decideCelebration(before, finalized, { turnId: "turn-5", liveTransition: false }).type, "NONE");
});

test("keeps incomplete finalization distinct from its end reason", () => {
  const before = snapshot({ revision: 5 });
  const incomplete = snapshot({ ...before, status: "INCOMPLETE", revision: 6 });
  assert.equal(decideCelebration(before, incomplete, { liveTransition: true }).type, "FINAL_INCOMPLETE");
});
