import { httpService } from "@shared/services";

const PLACEMENT_API = "/api/v1/placement/attempts";

interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export class PlacementApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, code: string | null, detail: string) {
    super(detail);
    this.name = "PlacementApiError";
    this.status = status;
    this.code = code;
  }
}

export async function placementRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH",
  signal?: AbortSignal,
  body?: { questionId: string; selectedOptionId: string | null },
): Promise<T> {
  const endpoint = `${PLACEMENT_API}${path}`;
  const requestOptions = { signal };
  try {
    const envelope = method === "GET"
      ? await httpService.get<ApiResponse<T>>(endpoint, requestOptions)
      : method === "PATCH"
        ? await httpService.patch<ApiResponse<T>>(endpoint, body, requestOptions)
        : await httpService.post<ApiResponse<T>>(endpoint, body, requestOptions);
    return envelope.data;
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    const problem = cause as Error & { status?: number; code?: string };
    throw new PlacementApiError(
      problem.status ?? 0,
      problem.code ?? null,
      problem.message || "Không thể xử lý yêu cầu Placement.",
    );
  }
}
