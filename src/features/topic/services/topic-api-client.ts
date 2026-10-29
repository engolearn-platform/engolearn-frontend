export class TopicApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;

  constructor(status: number, code: string, detail: string) {
    super(detail);
    this.name = "TopicApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export interface TopicApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface TopicMutationOptions {
  idempotencyKey: string;
  signal?: AbortSignal;
}

interface RequestOptions {
  signal?: AbortSignal;
  body?: unknown;
  idempotencyKey?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createTopicApiClient(options: TopicApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? "/api/v1").replace(/\/+$/, "");
  if (
    !baseUrl ||
    baseUrl.startsWith("//") ||
    /[?#]/.test(baseUrl) ||
    !(baseUrl.startsWith("/") || /^https?:\/\//.test(baseUrl))
  ) {
    throw new TypeError("Topic API baseUrl must be a root-relative path or HTTP(S) URL without query/hash.");
  }
  const fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));

  async function request<T>(method: "GET" | "POST", path: string, requestOptions: RequestOptions = {}): Promise<T> {
    requestOptions.signal?.throwIfAborted();
    const headers = new Headers({ Accept: "application/json, application/problem+json" });
    if (method === "POST") {
      const key = requestOptions.idempotencyKey;
      if (!key?.trim() || key.length > 128 || /[\r\n]/.test(key)) {
        throw new TypeError("A non-empty Idempotency-Key of at most 128 characters is required.");
      }
      headers.set("Idempotency-Key", key);
      headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
      response = await fetchImpl(baseUrl + path, {
        method,
        headers,
        credentials: "same-origin",
        signal: requestOptions.signal,
        ...(method === "POST" ? { body: JSON.stringify(requestOptions.body) } : {}),
      });
    } catch (error) {
      if (requestOptions.signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
      throw new TopicApiError(0, "NETWORK_ERROR", "Không kết nối được máy chủ. Vui lòng thử lại.");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      if (requestOptions.signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
      if (response.ok) throw new TopicApiError(response.status, "INVALID_RESPONSE", "Máy chủ trả về dữ liệu không hợp lệ.");
    }

    if (!response.ok) {
      const code = isRecord(payload) && typeof payload.code === "string" ? payload.code : "HTTP_" + response.status;
      const detail = isRecord(payload) && typeof payload.detail === "string"
        ? payload.detail
        : "Không thực hiện được yêu cầu. Vui lòng thử lại.";
      throw new TopicApiError(response.status, code, detail);
    }
    if (!isRecord(payload) || !isRecord(payload.data) || typeof payload.timestamp !== "string") {
      throw new TopicApiError(response.status, "INVALID_RESPONSE", "Máy chủ trả về dữ liệu không hợp lệ.");
    }
    requestOptions.signal?.throwIfAborted();
    return payload.data as T;
  }
  return { request };
}
