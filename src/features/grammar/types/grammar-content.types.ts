export type GrammarLevel = "A1" | "A2" | "B1" | "B2";
export type GrammarStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type GrammarTopicStatus = GrammarStatus | "IN_PROGRESS";
export type GrammarBlockType = "EXPLANATION" | "FORMULA" | "EXAMPLE" | "RULE_QUICK_NOTE" | "COMMON_MISTAKE";
export type GrammarQuestionType = "MULTIPLE_CHOICE" | "FILL_IN_BLANK";

export interface GrammarExample {
  english: string;
  vietnamese: string;
  analysis?: string | null;
}

export interface GrammarBlock {
  id: string;
  type: GrammarBlockType;
  title?: string | null;
  text?: string | null;
  formula?: string | null;
  examples?: GrammarExample[] | null;
  ruleItems?: string[] | null;
  incorrect?: string | null;
  correct?: string | null;
  explanation?: string | null;
}

export interface GrammarQuestion {
  id: string;
  type: GrammarQuestionType;
  prompt: string;
  explanation: string;
  options: string[];
  correctIndex: number | null;
  correctAnswer: string;
  acceptedAnswers: string[];
}

export interface GrammarTopicInput {
  titleVi: string;
  titleEn: string;
  description: string;
  level: GrammarLevel;
  order?: number | null;
  version?: number;
}

export interface GrammarLessonInput {
  titleVi: string;
  titleEn: string;
  objective: string;
  tags: string[];
  order?: number | null;
  version?: number;
  blocks?: GrammarBlock[];
  questions?: GrammarQuestion[];
}

export interface GrammarLesson extends GrammarLessonInput {
  id: string;
  code: string;
  order: number | null;
  status: GrammarStatus;
  version: number;
  ready: boolean;
  contentVersion: number;
  blocks: GrammarBlock[];
  questions: GrammarQuestion[];
  hasDraft: boolean;
  firstPublishedAt: string | null;
  archiveReason: "INDIVIDUAL" | "TOPIC_ARCHIVE" | null;
}

export interface GrammarTopic extends GrammarTopicInput {
  id: string;
  code: string;
  order: number | null;
  status: GrammarTopicStatus;
  version: number;
  updatedAt: string | null;
  firstPublishedAt: string | null;
  readyCount: number;
  lessonCount: number;
  lessons: GrammarLesson[];
}

export interface GrammarTopicsQuery {
  search?: string;
  level?: GrammarLevel | "ALL" | "";
  status?: GrammarTopicStatus | "ALL" | "";
  page?: number;
  size?: number;
}

export interface GrammarTopicsPage {
  items: GrammarTopic[];
  total: number;
  stats: { total: number; published: number; inProgress: number; draft: number; archived: number };
}

export interface GrammarCheck {
  label: string;
  passed: boolean;
  detail: string | null;
}
