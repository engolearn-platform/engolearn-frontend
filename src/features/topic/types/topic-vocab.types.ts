import type { TopicStructureItem } from "./topic-context.types";

export type VocabStepState = "done" | "active" | "todo";

export interface VocabStep {
  id: string;
  label: string;
  state: VocabStepState;
}

export interface VocabOrderItem {
  id: string;
  label: string;
}

export interface VocabCollocation {
  id: string;
  en: string;
  vi: string;
}

export interface VocabSentence {
  id: string;
  enPrefix: string;
  highlight: string;
  enSuffix: string;
  vi: string;
}

export interface VocabOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface VocabHero {
  imageUrl: string;
  imageAlt: string;
  imageBadge: string;
  posLabel: string;
  frequencyLabel: string;
  word: string;
  ipa: string;
  meaningVi: string;
  description: string;
  collocationsHeading: string;
  collocations: VocabCollocation[];
}

export interface VocabQuickCheck {
  promptLabel: string;
  questionPrefix: string;
  questionSuffix: string;
  challengeBadge: string;
  options: VocabOption[];
  successTitle: string;
  successText: string;
  errorTitle: string;
  errorText: string;
}

export type VocabStructureItem = TopicStructureItem & {
  to?: string;
};

export interface TopicVocab {
  id: string;
  topicId: string;
  topicTitle: string;
  stageLabel: string;
  topicLabel: string;
  cefrBadge: string;
  progressText: string;
  steps: VocabStep[];
  currentIndex: number;
  totalCount: number;
  vocabOrder: VocabOrderItem[];
  prevVocabId: string | null;
  prevVocabLabel: string | null;
  nextVocabId: string | null;
  hero: VocabHero;
  sentencesTitle: string;
  sentencesCountLabel: string;
  sentences: VocabSentence[];
  quickCheck: VocabQuickCheck;
  lessonPrevLabel: string;
  lessonNextLabel: string;
  progressPercent: number;
  progressNote: string;
  structureHeading: string;
  structure: VocabStructureItem[];
  memoryTipTitle: string;
  memoryTipText: string;
}
