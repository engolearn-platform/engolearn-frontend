import type { CefrLevel } from "./topic.types";

export type TopicCategory = "DINING" | "TRAVEL" | "BUSINESS" | "DAILY" | "HEALTH";

export interface TopicManagementListItem {
  id: string;
  titleEn: string;
  titleVi: string;
  cefr?: CefrLevel;
  category?: TopicCategory;
  status: "draft" | "published";
  itemCount: number;
  updatedAt: string;
}

export interface TopicManagementResponse {
  id: string;
  titleEn: string;
  titleVi: string;
  cefr?: CefrLevel;
  category?: TopicCategory;
  description?: string;
  coverUrl?: string;
  status: "draft" | "published";
  durationMinutes: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicManagementCounters {
  total: number;
  published: number;
  draft: number;
}

export interface TopicManagementListResponse {
  items: TopicManagementListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  counters: TopicManagementCounters;
}

export interface TopicCreateRequest {
  titleEn: string;
  titleVi: string;
  cefr?: CefrLevel;
  category?: TopicCategory;
  description?: string;
  coverUrl?: string;
}

export interface TopicUpdateRequest {
  titleEn?: string;
  titleVi?: string;
  cefr?: CefrLevel | null;
  category?: TopicCategory | null;
  description?: string | null;
  coverUrl?: string | null;
}

export interface TopicManagementListQueryParams {
  search?: string;
  cefr?: CefrLevel;
  category?: TopicCategory;
  status?: "draft" | "published";
  page?: number;
  size?: number;
}

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  fieldErrors?: ApiFieldError[];
}
