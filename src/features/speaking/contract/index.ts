/** Stable Speaking capability consumed by Topic and the application router. */
export { ItemSpeakingEntry, TopicSpeakingEntry } from "@features/speaking/views/SpeakingEntry";
export { speakingV2Service, SpeakingV2ApiError } from "@features/speaking/services/speaking-v2.service";
export type {
  SpeakingAssessment,
  SpeakingAvailability,
  SpeakingContext,
  SpeakingCorrection,
  SpeakingHint,
  SpeakingPage,
  SpeakingProfile,
  SpeakingProfileState,
  SpeakingScope,
  SpeakingSession,
  SpeakingTurn,
} from "@features/speaking/types/speaking-v2.types";
