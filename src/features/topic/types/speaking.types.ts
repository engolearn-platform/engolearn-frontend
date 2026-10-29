export type SpeakingSessionStatus =
  | "ACTIVE"
  | "INTERRUPTED"
  | "COMPLETED"
  | "INCOMPLETE";

export type SpeakingEndReason =
  | "GOALS_REACHED"
  | "LEARNER_ENDED"
  | "SESSION_AGE"
  | "TURN_LIMIT"
  | "DAILY_QUOTA"
  | "RECOVERY_EXPIRED"
  | "EVALUATION_FAILURES"
  | "SERVICE_RESTART"
  | "REPLACED"
  | "SOFT_DELETED";

export interface SpeakingGoal {
  id: string;
  title: string;
  description: string;
  priority: "REQUIRED" | "OPTIONAL";
}

export interface SpeakingContentSnapshot {
  topicItemId: string;
  topicItemVersionId: string;
  title: string;
  description: string;
  goals: SpeakingGoal[];
  goalPercentage?: number | null;
  completionPolicyVersion?: "REQUIRED_GOALS_V2" | "LEGACY_RATIO_V1" | null;
  minimumValidTurns: number;
  vocabulary: string[];
  expressions: string[];
  configRevision: number;
}

export interface SpeakingGoalEvidence {
  goalId: string;
  quote: string;
}

export interface SpeakingAssessment {
  id: string;
  transcript: string;
  criteriaVersion: string;
  goalEvidence: SpeakingGoalEvidence[];
  resourceEvidence: { resourceId: string; quote: string; explanation: string }[];
  corrections: { original: string; corrected: string; explanation: string }[];
  hint: string | null;
  feedback: string[];
}

export interface SpeakingTurn {
  id: string;
  sequence: number;
  transcript: string;
  committedAt: string;
  valid: boolean;
  evaluationState: "PENDING" | "INVALID" | "SUCCEEDED" | "FAILED";
  aiReply: string | null;
  assessment: SpeakingAssessment | null;
  recordingAvailable: boolean;
  aiAudioAvailable: boolean;
}

export interface SpeakingSession {
  id: string;
  content: SpeakingContentSnapshot;
  status: SpeakingSessionStatus;
  endReason: SpeakingEndReason | null;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  validTurnCount: number;
  committedTurnCount: number;
  achievedGoalIds: string[];
  goalResults: { goalId: string; priority: "REQUIRED" | "OPTIONAL";
    achieved: boolean; evidenceQuote: string | null }[];
  requiredGoalsMet: boolean;
  completionEligible: boolean;
  controllerEpoch: number;
  revision: number;
  canStartTurn: boolean;
  openingReply: string;
  turns: SpeakingTurn[];
}

export interface SpeakingItemConfig {
  itemId: string;
  itemVersionId: string;
  title: string;
  goals: SpeakingGoal[];
  minimumValidTurns: number;
}
