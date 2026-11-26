import type { CefrLevel } from "./topic.types";

export type TopicCategory = "DINING" | "TRAVEL" | "BUSINESS" | "DAILY" | "HEALTH";

export type TopicStatus = "draft" | "published" | "unpublished";

export interface TopicManagementListItem {
  id: string;
  titleEn: string;
  titleVi: string;
  cefr?: CefrLevel;
  category?: TopicCategory;
  status: TopicStatus;
  itemCount: number;
  updatedAt: string;
}

export interface TopicManagementResponse {
  id: string;
  revision: number;
  titleEn: string;
  titleVi: string;
  cefr?: CefrLevel;
  category?: TopicCategory;
  description?: string;
  coverUrl?: string;
  status: TopicStatus;
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

export interface TopicItemMetadataInput {
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
}

export interface TopicItemMutationResult {
  revision: number;
  items: TopicItemManagementSummary[];
}

export interface TopicItemResourceMutationResult {
  revision: number;
  item: TopicItemManagementDetail;
}

export interface TopicReadinessResult {
  ready: boolean;
  violations: { path: string; code: string; message: string }[];
}

export interface TopicPublishItemResult {
  topicItemId: string;
  itemVersionId: string;
  version: number;
  order: number;
  title: string;
  durationMinutes: number;
}

export interface TopicPublishResult {
  topicId: string;
  revision: number;
  topicVersionId: string;
  version: number;
  items: TopicPublishItemResult[];
  itemCount: number;
  durationMinutes: number;
  publishedAt: string;
  previousTopicVersionId?: string;
  changes?: TopicPublishChange[];
}

export interface TopicUnpublishResult {
  topicId: string;
  revision: number;
  status: "unpublished";
  latestPublishedVersion: string | null;
}

export interface TopicPublishChange {
  topicItemId: string;
  previousItemVersionId: string | null;
  itemVersionId: string;
  version: number;
  changeType: "MAJOR" | "NEW";
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

export type TopicExpressionGroupType = "BASIC" | "COMMON" | "PLACEHOLDER";
export type TopicExpressionLabel = "COMMON" | "POLITE" | "SLOT_HINT";

export interface TopicExpressionExampleResource {
  type: string | null;
  label?: TopicExpressionLabel | null;
  textEn: string | null;
  textVi: string | null;
  usageNote: string | null;
  audioUrl: string | null;
  linkedVocabIds: string[] | null;
}

export interface TopicExpressionPurposeResource {
  purposeEn: string | null;
  purposeVi: string | null;
  orderIndex: number | null;
  groupType?: TopicExpressionGroupType | null;
  examples: TopicExpressionExampleResource[];
}

export interface TopicExpressionResource {
  purposes: TopicExpressionPurposeResource[];
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
  unpublished: number;
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
  tags?: string[];
}

export interface TopicUpdateRequest {
  revision: number;
  titleEn?: string;
  titleVi?: string;
  cefr?: CefrLevel | null;
  category?: TopicCategory | null;
  description?: string | null;
  coverUrl?: string | null;
  tags?: string[];
}

export interface TopicManagementListQueryParams {
  search?: string;
  cefr?: CefrLevel;
  category?: TopicCategory;
  status?: TopicStatus;
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
