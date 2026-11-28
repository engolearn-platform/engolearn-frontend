import type { SpeakingAssessmentStatus, SpeakingCriterionStatus, SpeakingSessionStatus } from "./speaking-v2.types";

export interface SpeakingHomeCriterion { status: SpeakingCriterionStatus; score: number | null; maxScore: number; reason: string | null }
export interface SpeakingHomeSummary {
  asOf: string;
  state: "AVAILABLE" | "NOT_STARTED";
  sessionCount: number; speechDurationMs: number;
  latestSession: {
    sessionId: string; title: string | null; createdAt: string | null; endedAt: string | null;
    status: SpeakingSessionStatus; speechDurationMs: number; assessmentStatus: SpeakingAssessmentStatus | null;
    criteria: { pronunciation: SpeakingHomeCriterion | null; fluency: SpeakingHomeCriterion | null; grammar: SpeakingHomeCriterion | null; vocabulary: SpeakingHomeCriterion | null } | null;
  } | null;
}
