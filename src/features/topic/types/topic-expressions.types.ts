import type { TopicStructureItem } from "./topic-context.types";

/** Mirror backend `ExpressionExampleType`. */
export type ExpressionExampleType =
  | "BASIC_SUGGESTION"
  | "POLITE_INQUIRY"
  | "SLOT_PATTERN";

/** Single expression example (short sentence). */
export interface ExpressionExample {
  id: string;
  type: ExpressionExampleType;
  textEn: string;
  textVi: string;
  usageNote: string;
  audioUrl: string | null;
}

/** Connecting word inside a "sequence" purpose (First, Then, After that). */
export interface ConnectingWord {
  id: string;
  orderIndex: number;
  wordEn: string;
  wordVi: string;
  usageNote: string;
}

/** Long linked sentence shown above connecting words in a sequence purpose. */
export interface SequenceExample {
  textEn: string;
  textVi: string;
  audioUrl: string | null;
}

/** A purpose (group) of useful expressions. */
export interface ExpressionPurpose {
  id: string;
  purposeEn: string;
  purposeVi: string;
  orderIndex: number;
  examples: ExpressionExample[];
  /** Optional – only present on "sequence" purposes (Group 3). */
  connectingWords?: ConnectingWord[];
  /** Optional – long linked sentence accompanying `connectingWords`. */
  sequenceExample?: SequenceExample;
}

/** Step chip in the ProgressHeader (display-only, no state). */
export interface ExpressionGroupStep {
  id: string;
  label: string;
}

/** Icon name for a group pill (maps to lucide-react). */
export type ExpressionGroupPillIcon = "chat" | "tune" | "rocket";

/** Meta item in the hero card. */
export type ExpressionHeroMetaIcon =
  | "school"
  | "forum"
  | "mic"
  | "timer";

export interface ExpressionHeroMeta {
  icon: ExpressionHeroMetaIcon;
  label: string;
}

export type ExpressionStructureItem = TopicStructureItem & {
  to?: string;
};

/** Full payload returned by `useTopicExpressions`. */
export interface TopicExpressions {
  id: string;
  topicId: string;
  topicTitle: string;
  stageLabel: string;
  topicLabel: string;
  cefrBadge: string;
  progressText: string;
  steps: ExpressionGroupStep[];
  heroStageTag: string;
  heroSectionBadge: string;
  heroTitle: string;
  heroDescription: string;
  heroMeta: ExpressionHeroMeta[];
  purposes: ExpressionPurpose[];
  readinessTitle: string;
  readinessDescription: string;
  readinessQuestionCountLabel: string;
  readinessExpLabel: string;
  lessonPrevLabel: string;
  lessonNextLabel: string;
  progressPercent: number;
  progressNote: string;
  structureHeading: string;
  structure: ExpressionStructureItem[];
  memoryTipTitle: string;
  memoryTipText: string;
}