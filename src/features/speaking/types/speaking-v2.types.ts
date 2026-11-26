export type SpeakingScopeType = "TOPIC" | "TOPIC_ITEM";
export interface SpeakingScope { type: SpeakingScopeType; topicId: string; topicItemId: string | null }
export type SpeakingSessionStatus = "INITIALIZING" | "ACTIVE" | "CLOSING" | "ENDED";
export type SpeakingAssessmentStatus = "PENDING" | "FINALIZING" | "READY" | "PARTIAL" | "UNAVAILABLE";
export type SpeakingCriterionStatus = "ASSESSED" | "INSUFFICIENT_DATA" | "UNAVAILABLE";
export interface SpeakingHint { exampleEn: string; explanationVi: string }
export interface SpeakingCorrection { type: "GRAMMAR" | "VOCABULARY"; original: string; suggested: string; explanationVi: string }
export interface SpeakingContext { title: string; topicTitle: string; topicItemTitle: string | null; level: string; description: string; aiRole: string; learnerRole: string }
export interface SpeakingOpening { reply: string; hint: SpeakingHint | null; audioStatus: "TEXT_READY" | "AUDIO_PENDING" | "AUDIO_READY" | "AUDIO_FAILED"; audioAvailable: boolean }
export interface SpeakingActiveTurn { turnId: string; sequence: number; clientTurnId: string; status: string }
export interface SpeakingSession {
  sessionId: string; scope: SpeakingScope; context: SpeakingContext; status: SpeakingSessionStatus; endReason: string | null;
  controllerEpoch: number; wsPath: string; limits: { maxTurns: number; maxSessionMs: number; maxTurnAudioMs: number };
  createdAt: string; startedAt: string | null; endedAt: string | null; opening: SpeakingOpening | null;
  finalizedTurnCount: number; committedTurnCount: number; speechDurationMs: number;
  assessmentStatus: SpeakingAssessmentStatus; activeTurn: SpeakingActiveTurn | null;
}
export interface SpeakingTurn {
  turnId: string; clientTurnId: string; sequence: number; status: string; transcript: string | null; reply: string | null;
  hint: SpeakingHint | null; correction: SpeakingCorrection | null; learnerAudioAvailable: boolean; assistantAudioAvailable: boolean;
  audioStatus: SpeakingOpening["audioStatus"] | null; replyDeliveredAt: string | null; speechDurationMs: number; reason: string | null;
}
export interface SpeakingPage<T> { items: T[]; page: number; size: number; hasNext: boolean }
export type SpeakingHistoryGroup = "IN_PROGRESS" | "COMPLETED" | "OTHER";
export type SpeakingLearningStatus = "IN_PROGRESS" | "COMPLETED" | "NOT_STARTED" | "UNKNOWN";
export interface SpeakingLearningProgress { completedItemCount: number; totalItemCount: number; percent: number }
export interface SpeakingHistoryTopic {
  topicId: string; title: string | null; level: string | null; coverUrl: string | null;
  learningStatus: SpeakingLearningStatus; learningProgress: SpeakingLearningProgress | null;
  sessionCount: number; latestSessionCreatedAt: string;
}
export interface SpeakingHistoryTotals { inProgress: number; completed: number; other: number }
export interface SpeakingHistoryTopicPage extends SpeakingPage<SpeakingHistoryTopic> { totals: SpeakingHistoryTotals }
export interface SpeakingHistorySessionSummary {
  sessionId: string; scope: SpeakingScope; context: Pick<SpeakingContext, "title" | "topicTitle" | "topicItemTitle">;
  createdAt: string; committedTurnCount: number; speechDurationMs: number;
  status: SpeakingSessionStatus; assessmentStatus: SpeakingAssessmentStatus;
}
export interface SpeakingParentHistoryPage extends SpeakingPage<SpeakingHistorySessionSummary> {
  topicId: string; title: string | null; sessionCount: number;
}
export interface SpeakingCriterion {
  status: SpeakingCriterionStatus | null; score: number | null; maxScore: 100 | 5; reason: string | null;
  sampleCount: number | null; wordCount: number | null; speechDurationMs: number | null;
  accuracy: { status: string; level: string | null; reasonVi: string | null } | null;
  range: { status: string; level: string | null; reasonVi: string | null } | null;
  examples: { turnId: string; original: string; suggested: string }[];
}
export interface SpeakingAssessment {
  sessionId: string; status: SpeakingAssessmentStatus;
  criteria: { pronunciation: SpeakingCriterion; fluency: SpeakingCriterion; grammar: SpeakingCriterion; vocabulary: SpeakingCriterion };
  feedback: { strengthsVi: string[]; improvementsVi: string[]; recommendationsVi: string[]; wordsToPractice: { word: string; accuracyScore: number; errorType: string }[] };
  finalizedAt: string | null;
}
export interface SpeakingAvailability { scope: SpeakingScope; available: boolean; reason: string | null; activeSession: { sessionId: string; scope: SpeakingScope; status: SpeakingSessionStatus; controllerEpoch: number } | null }
export interface SpeakingProfile {
  enabled: boolean; level: string | null; description: string; aiRole: string; learnerRole: string; suggestedTopics: string[];
  selectedResourceIds: string[]; fallbackReply: string; fallbackHint: SpeakingHint | null;
}
export interface SpeakingProfileState {
  revision: number; draft: SpeakingProfile | null; published: SpeakingProfile | null; contentVersion: string | null;
  initialProfile: SpeakingProfile | null;
  scopeTitle: string | null;
  parentTitle: string | null;
  publishedProfileVersion: number | null;
  draftMatchesPublished: boolean;
  resourceGroups: { itemId: string; itemTitle: string | null; resourceIds: string[] }[];
  publishViolations: SpeakingProfileViolation[];
  publishedViolations: SpeakingProfileViolation[];
  resources: { id: string; itemId: string; type: "VOCABULARY" | "EXPRESSION"; textEn: string }[];
}
export interface SpeakingProfileViolation { path: string; code: string; message: string }
export interface SpeakingSocketMessage<T = Record<string, unknown>> { type: string; requestId?: string; sessionId: string; turnId?: string; sequence?: number; payload: T }
