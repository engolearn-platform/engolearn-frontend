export type DialogueSpeakerRole = "waiter" | "learner";

export type LearningStepState = "active" | "todo";

export type TopicStructureState = "active" | "locked" | "done" | "available";

export type LessonObjectiveIcon = "timer" | "mic" | "badge";

export interface DialogueLine {
  id: string;
  speakerRole: DialogueSpeakerRole;
  speakerLabel: string;
  textEn: string;
  textVi: string;
}

export interface LearningStep {
  id: string;
  label: string;
  state: LearningStepState;
}

export interface TopicStructureItem {
  id: string;
  label: string;
  state: TopicStructureState;
}

export interface LessonObjective {
  id: string;
  icon: LessonObjectiveIcon;
  text: string;
}

export interface TopicContextHero {
  stageTag: string;
  metaLabel: string;
  eyebrow: string;
  titleEn: string;
  titleVi: string;
  imageUrl: string;
  imageAlt: string;
  promptLabel: string;
  promptText: string;
  narrativeHeading: string;
  narrativeBody: string;
  tipTitle: string;
  tipText: string;
}

export interface TopicContextDialogue {
  title: string;
  subtitle: string;
  audioBadge: string;
  playAllLabel: string;
  lines: DialogueLine[];
}

export interface TopicContext {
  id: string;
  topicTitle: string;
  topicLabel: string;
  cefrBadge: string;
  stageCardLabel: string;
  stageText: string;
  steps: LearningStep[];
  hero: TopicContextHero;
  objectivesHeading: string;
  objectives: LessonObjective[];
  dialogue: TopicContextDialogue;
  readinessTitle: string;
  readinessDescription: string;
  readinessActionLabel: string;
  progressPercent: number;
  progressNote: string;
  structureHeading: string;
  structure: TopicStructureItem[];
  memoryTipTitle: string;
  memoryTipText: string;
}
