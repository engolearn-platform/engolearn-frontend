export { useSpeakingStream, type SpeakingSnapshotEvent } from "@features/speaking/hooks/useSpeakingStream";
export { speakingEnabled, speakingService } from "@features/speaking/services/speaking.service";
export type {
  SpeakingAssessment,
  SpeakingEndReason,
  SpeakingGoal,
  SpeakingItemConfig,
  SpeakingSession,
  SpeakingTurn,
} from "@features/speaking/types/speaking.types";

export { speakingDemoService, SpeakingApiError as SpeakingDemoApiError } from "@features/speaking/services/speaking-demo.service";
export type {
  DemoSpeakingItem,
  SpeakingSession as DemoSpeakingSession,
} from "@features/speaking/types/speaking-demo.types";
