import type {
  ApiErrorEnvelope,
  ApiResponse,
  TopicCreateRequest,
  TopicManagementListQueryParams,
  TopicManagementListResponse,
  TopicManagementResponse,
  TopicItemManagementDetail,
  TopicItemManagementSummary,
  TopicItemMetadataInput,
  TopicItemMutationResult,
  TopicItemResourceMutationResult,
  TopicContextResource,
  TopicVocabularyResource,
  TopicExpressionResource,
  TopicQuizResource,
  TopicReadinessResult,
  TopicUpdateRequest,
} from "../types/topic-management.types";

export class TopicApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: ApiErrorEnvelope["fieldErrors"];

  constructor(status: number, envelope: ApiErrorEnvelope) {
    super(envelope.message);
    this.name = "TopicApiError";
    this.status = status;
    this.code = envelope.code;
    this.fieldErrors = envelope.fieldErrors;
  }
}

function buildQueryString(params?: TopicManagementListQueryParams): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  if (params.search && params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params.cefr) {
    searchParams.set("cefr", params.cefr);
  }
  if (params.category) {
    searchParams.set("category", params.category);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (typeof params.page === "number") {
    searchParams.set("page", String(params.page));
  }
  if (typeof params.size === "number") {
    searchParams.set("size", String(params.size));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function parseErrorEnvelope(response: Response): Promise<ApiErrorEnvelope> {
  try {
    const data = (await response.json()) as ApiErrorEnvelope;
    if (data && typeof data.code === "string" && typeof data.message === "string") {
      return data;
    }
  } catch {
    // ignore
  }
  return {
    code: "UNKNOWN_ERROR",
    message: response.statusText || "Request failed",
  };
}

export async function fetchTopicList(
  params?: TopicManagementListQueryParams,
  signal?: AbortSignal,
): Promise<TopicManagementListResponse> {
  const query = buildQueryString(params);
  const response = await fetch(`/api/management/topics${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
  });

  if (!response.ok) {
    const envelope = await parseErrorEnvelope(response);
    throw new TopicApiError(response.status, envelope);
  }

  const envelope = (await response.json()) as ApiResponse<TopicManagementListResponse>;
  return envelope.data;
}

export async function fetchTopicById(
  id: string,
  signal?: AbortSignal,
): Promise<TopicManagementResponse> {
  const response = await fetch(`/api/management/topics/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
  });

  if (!response.ok) {
    const envelope = await parseErrorEnvelope(response);
    throw new TopicApiError(response.status, envelope);
  }

  const envelope = (await response.json()) as ApiResponse<TopicManagementResponse>;
  return envelope.data;
}

export async function fetchTopicItems(
  topicId: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<TopicItemManagementSummary[]> {
  const response = await fetchImpl(`/api/management/topics/${encodeURIComponent(topicId)}/items`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new TopicApiError(response.status, await parseErrorEnvelope(response));
  }

  const envelope = (await response.json()) as ApiResponse<TopicItemManagementSummary[]>;
  return envelope.data;
}

export async function fetchTopicItemById(
  topicId: string,
  itemId: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<TopicItemManagementDetail> {
  const response = await fetchImpl(
    `/api/management/topics/${encodeURIComponent(topicId)}/items/${encodeURIComponent(itemId)}`,
    { method: "GET", headers: { "Content-Type": "application/json" }, signal },
  );

  if (!response.ok) {
    throw new TopicApiError(response.status, await parseErrorEnvelope(response));
  }

  const envelope = (await response.json()) as ApiResponse<TopicItemManagementDetail>;
  return envelope.data;
}

export async function createTopic(
  body: TopicCreateRequest,
  signal?: AbortSignal,
): Promise<TopicManagementResponse> {
  const response = await fetch("/api/management/topics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const envelope = await parseErrorEnvelope(response);
    throw new TopicApiError(response.status, envelope);
  }

  const envelope = (await response.json()) as ApiResponse<TopicManagementResponse>;
  return envelope.data;
}

export async function updateTopic(
  id: string,
  body: TopicUpdateRequest,
  signal?: AbortSignal,
): Promise<TopicManagementResponse> {
  const response = await fetch(`/api/management/topics/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const envelope = await parseErrorEnvelope(response);
    throw new TopicApiError(response.status, envelope);
  }

  const envelope = (await response.json()) as ApiResponse<TopicManagementResponse>;
  return envelope.data;
}

async function mutateTopicItems(topicId: string, method: string, path: string, body?: object): Promise<TopicItemMutationResult> {
  const response = await fetch(`/api/management/topics/${encodeURIComponent(topicId)}/items${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new TopicApiError(response.status, await parseErrorEnvelope(response));
  const envelope = (await response.json()) as ApiResponse<TopicItemMutationResult>;
  return envelope.data;
}

export function createTopicItem(topicId: string, revision: number, body: TopicItemMetadataInput) {
  return mutateTopicItems(topicId, "POST", "", { ...body, revision });
}

export function updateTopicItem(topicId: string, itemId: string, revision: number, body: TopicItemMetadataInput) {
  return mutateTopicItems(topicId, "PATCH", `/${encodeURIComponent(itemId)}`, { ...body, revision });
}

export function reorderTopicItems(topicId: string, revision: number, itemIds: string[]) {
  return mutateTopicItems(topicId, "PATCH", "/order", { revision, itemIds });
}

export function setTopicItemVisibility(topicId: string, itemId: string, revision: number, hidden: boolean) {
  return mutateTopicItems(topicId, "PATCH", `/${encodeURIComponent(itemId)}/visibility`, { revision, hidden });
}

export function deleteTopicItem(topicId: string, itemId: string, revision: number) {
  return mutateTopicItems(topicId, "DELETE", `/${encodeURIComponent(itemId)}?revision=${revision}`);
}

async function saveItemSection(topicId: string, itemId: string, section: string, body: object) {
  const response = await fetch(`/api/management/topics/${encodeURIComponent(topicId)}/items/${encodeURIComponent(itemId)}/${section}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new TopicApiError(response.status, await parseErrorEnvelope(response));
  const envelope = (await response.json()) as ApiResponse<TopicItemResourceMutationResult>;
  return envelope.data;
}

export function saveItemContext(topicId: string, itemId: string, revision: number, context: TopicContextResource | null) {
  return saveItemSection(topicId, itemId, "context", { revision, context });
}

export function saveItemVocabulary(topicId: string, itemId: string, revision: number, vocabularies: TopicVocabularyResource[]) {
  return saveItemSection(topicId, itemId, "vocabulary", { revision, vocabularies });
}

export function saveItemExpressions(topicId: string, itemId: string, revision: number, expressions: TopicExpressionResource[]) {
  return saveItemSection(topicId, itemId, "expressions", { revision, expressions });
}

export function saveItemQuizzes(topicId: string, itemId: string, revision: number, quizzes: TopicQuizResource[]) {
  return saveItemSection(topicId, itemId, "quizzes", { revision, quizzes });
}

export async function fetchTopicReadiness(topicId: string, signal?: AbortSignal) {
  const response = await fetch(`/api/management/topics/${encodeURIComponent(topicId)}/readiness`, { signal });
  if (!response.ok) throw new TopicApiError(response.status, await parseErrorEnvelope(response));
  const envelope = (await response.json()) as ApiResponse<TopicReadinessResult>;
  return envelope.data;
}

export async function uploadTopicMedia(topicId: string, kind: "image" | "audio", file: File) {
  const form = new FormData();
  form.set("file", file);
  const response = await fetch(`/api/management/topics/${encodeURIComponent(topicId)}/media/${kind}`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new TopicApiError(response.status, await parseErrorEnvelope(response));
  const envelope = (await response.json()) as ApiResponse<{ reference: string }>;
  return envelope.data.reference;
}

export const topicManagementService = {
  fetchTopicList,
  fetchTopicById,
  fetchTopicItems,
  fetchTopicItemById,
  createTopic,
  updateTopic,
  createTopicItem,
  updateTopicItem,
  reorderTopicItems,
  setTopicItemVisibility,
  deleteTopicItem,
  saveItemContext,
  saveItemVocabulary,
  saveItemExpressions,
  saveItemQuizzes,
  fetchTopicReadiness,
};
