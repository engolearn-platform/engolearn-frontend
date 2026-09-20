export type TopicStatus = "published" | "draft";

export type CefrLevel = "A1" | "A2" | "B1" | "B2";

export interface TopicProgress {
  done: number;
  total: number;
  note: string;
}

export interface Topic {
  id: string;
  code: string;
  titleEn: string;
  titleVi: string;
  cefr: CefrLevel;
  category: string;
  itemsLabel: string;
  progress: TopicProgress;
  status: TopicStatus;
  updatedAt: string;
  thumbnail: string;
}

export interface TopicManagementFilter {
  search: string;
  cefr: "ALL" | CefrLevel;
  category: string;
  status: "ALL" | TopicStatus;
}

export interface TopicManagementStats {
  total: number;
  published: number;
  draft: number;
  inProgress: number;
}
