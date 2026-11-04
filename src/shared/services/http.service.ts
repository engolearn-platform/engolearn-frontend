type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  signal?: AbortSignal;
  skipAuthRefresh?: boolean;
}

interface ApiEnvelope<T> { data: T; timestamp?: string }

type HttpError = Error & { status?: number; code?: string; fieldErrors?: { field: string; message: string }[] };

class HttpService {
  private baseUrl: string;
  private fetchImpl: typeof fetch;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl = "", fetchImpl: typeof fetch = (...args) => globalThis.fetch(...args)) {
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseUrl || window.location.origin);
    if (params) Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    return url.toString();
  }

  private async toError(response: Response): Promise<HttpError> {
    let message = `HTTP Error: ${response.status} ${response.statusText}`;
    let code: string | undefined;
    let fieldErrors: { field: string; message: string }[] | undefined;
    try {
      const problem = await response.json() as { detail?: string; title?: string; code?: string; fieldErrors?: unknown } | null;
      if (problem) {
        if (typeof problem.code === "string") code = problem.code;
        if (Array.isArray(problem.fieldErrors) && problem.fieldErrors.every((item: unknown) => item !== null && typeof item === "object" && "field" in item && typeof item.field === "string" && "message" in item && typeof item.message === "string")) {
          fieldErrors = problem.fieldErrors.map(item => ({ field: item.field, message: item.message }));
        }
        message = problem.detail || problem.title || message;
      }
    } catch { /* retain the HTTP message for non-JSON responses */ }
    return Object.assign(new Error(message), { status: response.status, code, fieldErrors });
  }

  private async refresh(signal?: AbortSignal): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const response = await this.fetchImpl(this.buildUrl("/api/v1/auth/refresh"), {
            method: "POST", credentials: "same-origin", cache: "no-store", signal,
          });
          if (response.status === 401) return false;
          if (!response.ok) throw await this.toError(response);
          return true;
        } catch (error) {
          if ((error as HttpError).status === 401) return false;
          throw error;
        }
      })().finally(() => { this.refreshPromise = null; });
    }
    return this.refreshPromise;
  }

  private async request<T>(method: HttpMethod, endpoint: string, options?: RequestOptions, body?: unknown, retry = true): Promise<T> {
    const isUnsafe = method !== "GET";
    const isAuthEndpoint = /\/api\/v1\/auth\/(login|register|refresh|logout)$/.test(endpoint);
    const headers = new Headers({ Accept: "application/json", "Content-Type": "application/json" });
    for (const [key, value] of Object.entries(options?.headers ?? {})) headers.set(key, value);
    const response = await this.fetchImpl(this.buildUrl(endpoint, options?.params), {
      method, credentials: "same-origin", cache: "no-store", headers, signal: options?.signal,
      ...(body !== undefined && isUnsafe ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 401 && retry && !options?.skipAuthRefresh && !isAuthEndpoint && !options?.signal?.aborted) {
      if (await this.refresh(options?.signal)) return this.request<T>(method, endpoint, options, body, false);
    }
    if (!response.ok) throw await this.toError(response);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return text ? JSON.parse(text) as T : undefined as T;
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> { return this.request<T>("GET", endpoint, options); }
  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> { return this.request<T>("POST", endpoint, options, body); }
  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> { return this.request<T>("PUT", endpoint, options, body); }
  patch<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> { return this.request<T>("PATCH", endpoint, options, body); }
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> { return this.request<T>("DELETE", endpoint, options); }
}

export const httpService = new HttpService();
export { HttpService };
export type { HttpError, RequestOptions, ApiEnvelope };
