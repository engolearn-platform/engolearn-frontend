export type CefrLevel = "A1" | "A2" | "B1";

export type UnitStatus = "completed" | "active" | "locked";

export interface TopicLink {
  label: string;
  to: string;
}

export interface GrammarUnit {
  id: string;
  title: string;
  description?: string;
  status: UnitStatus;
  /** 0–100 */
  progress: number;
  topicLink?: TopicLink;
}

export interface CefrTab {
  level: CefrLevel;
  label: string;
  disabled?: boolean;
}

export interface WeeklyGoal {
  completed: number;
  total: number;
}

export interface NextLessonSuggestion {
  title: string;
  description: string;
}

export interface GrammarRoadmap {
  currentLevel: CefrLevel;
  /** 0–100 */
  overallProgress: number;
  units: GrammarUnit[];
  goal: WeeklyGoal;
  suggestion: NextLessonSuggestion;
}
