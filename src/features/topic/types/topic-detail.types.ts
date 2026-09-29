export type TopicUnitState = "completed" | "current" | "available" | "locked";

export interface TopicUnitPreview {
  vocab: string[];
  expressions: string[];
  practiceLabel: string;
}

export interface TopicUnitItem {
  id: string;
  indexLabel: string;
  title: string;
  description: string;
  durationLabel: string;
  state: TopicUnitState;
  vocabCount: number;
  expressionCount: number;
  practiceCount: number;
  preview?: TopicUnitPreview;
  stateBadge?: string;
  hasUpdates?: boolean;
  updatesLabel?: string;
}

export type TopicProgressStatIcon = "vocab" | "expressions" | "practice";

export interface TopicProgressStat {
  id: string;
  icon: TopicProgressStatIcon;
  label: string;
  value: string;
}

export interface TopicDetailOverview {
  vocabLabel: string;
  expressionLabel: string;
  practiceLabel: string;
}

export interface UnitActionLabels {
  /** Unit mới, chưa học. */
  startLabel: string;
  /** Unit đang học dở. */
  resumeLabel: string;
  /** Unit đã học xong. */
  reviewLabel: string;
  /** Unit đã học nhưng có nội dung mới từ admin. */
  restartLabel: string;
}

export interface TopicDetail {
  id: string;
  parentLabel: string;
  title: string;
  description: string;
  cefrBadge: string;
  overview: TopicDetailOverview;
  units: TopicUnitItem[];
  progressPercent: number;
  stats: TopicProgressStat[];
  continueLabel: string;
  unitActionLabels: UnitActionLabels;
}
