import type { GrammarBlock, GrammarLevel, GrammarQuestionType } from "./grammar-admin.types";

export type GrammarStudyStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface LearnerGrammarTopic {
  id: string;
  titleVi: string;
  titleEn: string;
  description: string;
  level: GrammarLevel;
  status: GrammarStudyStatus | "LOCKED";
  completedLessons: number;
  totalLessons: number;
  percent: number;
}

export interface GrammarRoadmapLevel {
  level: GrammarLevel;
  unlocked: boolean;
  completedTopics: number;
  totalTopics: number;
  percent: number;
  lockHint: string | null;
  topics: LearnerGrammarTopic[];
}

export interface GrammarRoadmap {
  currentLevel: GrammarLevel;
  newlyUnlockedLevels: GrammarLevel[];
  levels: GrammarRoadmapLevel[];
}

interface GrammarLessonSummary {
  id: string;
  number: number;
  titleVi: string;
  titleEn: string;
  objective: string;
  status: GrammarStudyStatus;
}

export interface GrammarTopicDetail {
  topic: LearnerGrammarTopic;
  lessons: (GrammarLessonSummary & {
    unlocked: boolean;
    bestScore: number | null;
    hasUpdate: boolean;
  })[];
}

export interface GrammarTheory extends GrammarLessonSummary {
  topicId: string;
  contentVersion: number;
  blocks: GrammarBlock[];
}

export interface GrammarPracticeQuestion {
  id: string;
  number: number;
  type: GrammarQuestionType;
  prompt: string;
  options: { id: string; text: string }[];
}

export interface GrammarPracticeFeedback {
  type: GrammarQuestionType;
  prompt: string;
  questionId: string;
  number: number;
  correct: boolean;
  submittedAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export interface GrammarPracticeResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  completed: boolean;
  topicCompleted: boolean;
  nextLessonId: string | null;
  archived: boolean;
  newlyUnlockedLevels: GrammarLevel[];
}

export interface GrammarPracticeSession {
  id: string;
  topicId: string;
  lessonId: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  contentVersion: number;
  answeredCount: number;
  totalQuestions: number;
  question: GrammarPracticeQuestion | null;
  feedback: GrammarPracticeFeedback[];
  result: GrammarPracticeResult | null;
  expiresAt: string | null;
}

export interface GrammarPracticeAnswer {
  requestId: string;
  questionId: string;
  answer: string;
}

export interface GrammarAnswerResponse {
  feedback: GrammarPracticeFeedback;
  session: GrammarPracticeSession;
}
