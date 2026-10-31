type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Development-auth storage key for the selected dev fixture user.
 * Persisted in localStorage so the choice survives reloads.
 * Default fixture key: "dev-user".
 */
export const DEV_USER_STORAGE_KEY = "engolearn.devUserId";

/**
 * Request header used by the dev auth filter (backend) to resolve the fixture user.
 * Sent by the API client in development only. Not sent for the "guest" selection
 * (unauthenticated — backend receives no identity, per the auth contract).
 */
export const DEV_USER_HEADER = "X-Dev-User-Id";

/** Dev-only selection meaning "no identity": the API client sends no header. */
export const DEV_GUEST_KEY = "guest";

const DEFAULT_DEV_USER_KEY = "dev-user";
const DEV_USER_KEYS = ["guest", "dev-user", "dev-cm", "dev-admin"] as const;
type DevUserKey = (typeof DEV_USER_KEYS)[number];

function getDevUserKey(): DevUserKey {
  if (!import.meta.env.DEV) {
    return DEFAULT_DEV_USER_KEY;
  }
  try {
    const stored = localStorage.getItem(DEV_USER_STORAGE_KEY);
    if (stored && DEV_USER_KEYS.includes(stored as DevUserKey)) {
      return stored as DevUserKey;
    }
  } catch {
    // localStorage may be unavailable in some environments
  }
  return DEFAULT_DEV_USER_KEY;
}

function getDevHeaders(): Record<string, string> {
  if (!import.meta.env.DEV) {
    return {};
  }
  const key = getDevUserKey();
  if (key === DEV_GUEST_KEY) {
    return {};
  }
  return { [DEV_USER_HEADER]: key };
}

class HttpService {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.baseUrl || window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    options?: RequestOptions,
    body?: unknown,
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);

    const config: RequestInit = {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...getDevHeaders(),
        ...options?.headers,
      },
      signal: options?.signal,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      let message = `HTTP Error: ${response.status} ${response.statusText}`;
      let code: string | undefined;
      let fieldErrors: { field: string; message: string }[] | undefined;
      // Try to read the ProblemDetail body for a friendlier message (detail/title).
      try {
        const problem = (await response.json()) as
          | { detail?: string; title?: string; code?: string; fieldErrors?: unknown }
          | null;
        if (problem) {
          if (typeof problem.code === "string") code = problem.code;
          if (Array.isArray(problem.fieldErrors) && problem.fieldErrors.every((item: unknown) => item !== null && typeof item === "object" && "field" in item && typeof item.field === "string" && "message" in item && typeof item.message === "string")) {
            fieldErrors = problem.fieldErrors.map(item => ({ field: item.field, message: item.message }));
          }
          if (problem.detail) {
            message = problem.detail;
          } else if (problem.title) {
            message = problem.title;
          }
        }
      } catch {
        // Ignore non-JSON error bodies; keep the default message.
      }

      const error = new Error(message) as Error & {
        status?: number;
        code?: string;
        fieldErrors?: { field: string; message: string }[];
      };
      error.status = response.status;
      error.code = code;
      error.fieldErrors = fieldErrors;
      throw error;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", endpoint, options);
  }

  async post<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("POST", endpoint, options, body);
  }

  async put<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("PUT", endpoint, options, body);
  }

  async patch<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("PATCH", endpoint, options, body);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", endpoint, options);
  }
}

export const httpService = new HttpService();
export { HttpService };
export type { DevUserKey };
export { getDevUserKey, DEFAULT_DEV_USER_KEY };
