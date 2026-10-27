import type {
  LearningPathApiResponse,
  LearningPathListData,
  LearningPathListStatus,
} from "../types/learning-path.types";
import type { LearningPathDetailDto } from "../types/learning-path-detail.types";

const LEARNING_PATHS_ENDPOINT = "/api/learning-paths";
const LEARNING_PATHS_SEARCH_ENDPOINT = `${LEARNING_PATHS_ENDPOINT}/search`;

interface ProblemDetailResponse {
  detail?: string;
  title?: string;
}

export const learningPathService = {
  async detail(
    pathId: string,
    signal: AbortSignal,
  ): Promise<LearningPathApiResponse<LearningPathDetailDto>> {
    const userId = import.meta.env.VITE_LEARNING_PATH_USER_ID?.trim();

    if (!userId) {
      throw new Error("Thiếu VITE_LEARNING_PATH_USER_ID trong file .env.local.");
    }

    if (!pathId) {
      throw new Error("Không tìm thấy mã Learning Path.");
    }

    const params = new URLSearchParams({ userId });
    const response = await fetch(
      `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}?${params}`,
      { signal, headers: { Accept: "application/json" } },
    );

    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetailResponse | null;
      throw new Error(
        problem?.detail ?? problem?.title ??
          `Không tải được Learning Path (${response.status}).`,
      );
    }

    return (await response.json()) as LearningPathApiResponse<LearningPathDetailDto>;
  },

  async list(
    status: LearningPathListStatus,
    signal: AbortSignal,
  ): Promise<LearningPathApiResponse<LearningPathListData>> {
    const userId = import.meta.env.VITE_LEARNING_PATH_USER_ID?.trim();

    if (!userId) {
      throw new Error(
        "Thiếu VITE_LEARNING_PATH_USER_ID trong file .env.local.",
      );
    }

    const params = new URLSearchParams({ userId, status });
    const response = await fetch(`${LEARNING_PATHS_ENDPOINT}?${params}`, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as
        | ProblemDetailResponse
        | null;
      throw new Error(
        problem?.detail ??
          problem?.title ??
          `Không tải được Learning Path (${response.status}).`,
      );
    }

    return (await response.json()) as LearningPathApiResponse<LearningPathListData>;
  },

  async search(
    keyword: string,
    signal: AbortSignal,
  ): Promise<LearningPathApiResponse<LearningPathListData>> {
    const userId = import.meta.env.VITE_LEARNING_PATH_USER_ID?.trim();

    if (!userId) {
      throw new Error(
        "Thiếu VITE_LEARNING_PATH_USER_ID trong file .env.local.",
      );
    }

    const params = new URLSearchParams({ userId, keyword });
    const response = await fetch(`${LEARNING_PATHS_SEARCH_ENDPOINT}?${params}`, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as
        | ProblemDetailResponse
        | null;
      throw new Error(
        problem?.detail ??
          problem?.title ??
          `Không tìm kiếm được Learning Path (${response.status}).`,
      );
    }

    return (await response.json()) as LearningPathApiResponse<LearningPathListData>;
  },
};
