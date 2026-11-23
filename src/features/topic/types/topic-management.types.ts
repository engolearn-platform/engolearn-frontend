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
  tags?: string[] | null;
  orderIndex?: number | null;
  latestPublishedVersion?: string | null;
  latestBetaVersion?: number | null;
  publicationVersion?: TopicPublicationVersion | null;
}

export interface TopicPublicationVersion {
  id: string;
  version: number | null;
  status: string | null;
  previousVersionId: string | null;
  publishedAt: string | null;
}

export interface TopicItemManagementSummary {
  id: string;
  topicId: string;
  title: string | null;
  description: string | null;
  order: number | null;
  status: string | null;
  durationMinutes: number | null;
  versionId: string | null;
  version: number | null;
  topicVersionId: string | null;
  previousItemVersionId: string | null;
  changeType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
}

export interface TopicItemManagementDetail extends TopicItemManagementSummary {
  context: TopicContextResource | null;
  vocabularies: TopicVocabularyResource[];
  expressions: TopicExpressionResource[];
  quizzes: TopicQuizResource[];
}

export interface TopicContextResource {
  prompt: string | null;
  scenarioDescription: string | null;
  dialogue: { speaker: string | null; textEn: string | null; textVi: string | null; audioUrl: string | null }[];
  durationSec: number | null;
  tips: string | null;
}

export interface TopicVocabularyResource {
  vocabId: string | null;
  senseId: string | null;
  snapshot: { word: string | null; pos: string | null; sense: string | null; describeVi: string | null; phonetic: string | null; audioUrl: string | null; audioEnUrl: string | null; audioUsUrl: string | null } | null;
  samples: { textEn: string | null; textVi: string | null; audioUrl: string | null; isManual: boolean | null }[];
  collocations: { text: string | null; example: { en: string | null; vi: string | null } | null; descriptionVi: string | null }[];
  quickCheck: { sentence: { textEn: string | null; meaningVi: string | null; audioUrl: string | null; audioUrlSlow: string | null; source: string | null; externalId: string | null } | null; quizData: Record<string, unknown> | null; answerData: Record<string, unknown> | null; explanation: string | null } | null;
  orderIndex: number | null;
  tips: string | null;
}

export interface TopicExpressionResource {
  purposes: { purposeEn: string | null; purposeVi: string | null; orderIndex: number | null; examples: { type: string | null; textEn: string | null; textVi: string | null; usageNote: string | null; audioUrl: string | null; linkedVocabIds: string[] | null }[] }[];
  tips: string | null;
}

export interface TopicQuizResource {
  quizId: string | null;
  quizType: string | null;
  title: string | null;
  instructions: string | null;
  orderIndex: number | null;
  questions: { prompt: string | null; audioUrl: string | null; options: { label: string | null; textEn: string | null; isCorrect: boolean | null }[]; correct: string | null; explanationOk: string | null; explanationNg: string | null; sentence: { textEn: string | null; meaningVi: string | null; audioUrl: string | null; audioUrlSlow: string | null; source: string | null; externalId: string | null } | null; quizData: Record<string, unknown> | null; answerData: Record<string, unknown> | null; explanation: string | null; tips: string | null }[];
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
