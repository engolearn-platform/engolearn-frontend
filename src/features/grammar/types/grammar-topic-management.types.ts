import type {
  ManagementCefrLevel,
  ManagementCefrValue,
} from "@shared/components/management";

export type GrammarTopicStatus = "published" | "in_progress" | "draft";

export type GrammarTopicStatusFilter = "ALL" | GrammarTopicStatus;

export interface GrammarTopic {
  id: string;
  code: string;
  titleVi: string;
  titleEn: string;
  description: string;
  cefr: ManagementCefrLevel;
  lessonDone: number;
  lessonTotal: number;
  status: GrammarTopicStatus;
  updatedLabel: string;
}

export interface GrammarTopicStats {
  total: number;
  published: number;
  inProgress: number;
  draft: number;
}

export interface GrammarTopicFilter {
  search: string;
  cefr: ManagementCefrValue;
  status: GrammarTopicStatusFilter;
}

export interface GrammarTopicManagementData {
  topics: GrammarTopic[];
  stats: GrammarTopicStats;
}
