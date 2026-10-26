import type {
  ApiErrorEnvelope,
  ApiResponse,
  TopicCreateRequest,
  TopicManagementListQueryParams,
  TopicManagementListResponse,
  TopicManagementResponse,
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

export const topicManagementService = {
  fetchTopicList,
  fetchTopicById,
  createTopic,
  updateTopic,
};
