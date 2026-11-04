export interface SpeakingGoal {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

export interface SpeakingFeedback {
  type: string;
  message: string;
}

export interface SpeakingTurn {
  id: string;
  number: number;
  transcript: string | null;
  payloadAvailability?: "PENDING" | "UNAVAILABLE" | (string & {});
  valid: boolean;
  achievedGoalIds: string[];
  goalEvidence: { goalId: string; quote: string }[];
  feedback: SpeakingFeedback[];
  aiReply: string;
  committedAt: string;
}

export interface DemoSpeakingItem {
  itemId: string;
  itemVersionId: string;
  title: string;
  goals: SpeakingGoal[];
  minimumValidTurns: number;
  requiredGoalCount: number;
}

export interface SpeakingSession {
  id: string;
  itemId: string;
  itemVersionId: string;
  itemTitle: string;
  status: "ACTIVE" | "INTERRUPTED" | "COMPLETED" | "INCOMPLETE";
  endReason: string | null;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  goals: SpeakingGoal[];
  requiredGoalCount: number;
  minimumValidTurns: number;
  validTurnCount: number;
  achievedGoalIds: string[];
  committedTurnCount: number;
  canStartTurn: boolean;
  controllerEpoch: number;
  revision: number;
  turns: SpeakingTurn[];
}

export interface SpeakingTurnResult {
  turn: SpeakingTurn;
  session: SpeakingSession;
}
