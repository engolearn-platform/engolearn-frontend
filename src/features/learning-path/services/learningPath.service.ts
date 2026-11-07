import type {
  LearningPathApiResponse,
  LearningPathListData,
  LearningPathListStatus,
} from "@features/learning-path/types/learning-path.types";
import type { LearningPathDetailDto } from "@features/learning-path/types/learning-path-detail.types";
import { httpService } from "@shared/services/http.service";
import type { DayResultDto, PracticeDayDto, SubmitDayResult } from "@features/learning-path/types/learning-path-day.types";

const LEARNING_PATHS_ENDPOINT = "/api/learning-paths";
const LEARNING_PATHS_SEARCH_ENDPOINT = `${LEARNING_PATHS_ENDPOINT}/search`;

interface ProblemDetailResponse {
  detail?: string;
  title?: string;
}

export const learningPathService = {
  async dayResult(pathId: string, weekNo: string, dayNo: string, signal: AbortSignal): Promise<DayResultDto> {
    const userId = import.meta.env.VITE_LEARNING_PATH_USER_ID?.trim();
    if (!userId) throw new Error("Thiếu VITE_LEARNING_PATH_USER_ID trong file .env.local.");
    const params = new URLSearchParams({ userId });
    const url = `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}/weeks/${encodeURIComponent(weekNo)}/days/${encodeURIComponent(dayNo)}/result?${params}`;
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetailResponse | null;
      throw new Error(problem?.detail ?? problem?.title ?? `Không tải được kết quả luyện tập (${response.status}).`);
    }
    return ((await response.json()) as LearningPathApiResponse<DayResultDto>).data;
  },
  async submitDay(pathId: string, weekNo: number, dayNo: number): Promise<SubmitDayResult> {
    const userId = import.meta.env.VITE_LEARNING_PATH_USER_ID?.trim();
    if (!userId) throw new Error("Thiếu VITE_LEARNING_PATH_USER_ID trong file .env.local.");
    const params = new URLSearchParams({ userId });
    const url = `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}/weeks/${weekNo}/days/${dayNo}/submit?${params}`;
    const response = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetailResponse | null;
      throw new Error(problem?.detail ?? problem?.title ?? `Không nộp được bài luyện tập (${response.status}).`);
    }
    return ((await response.json()) as LearningPathApiResponse<SubmitDayResult>).data;
  },
  async startDay(pathId: string, weekNo: string, dayNo: string, signal: AbortSignal): Promise<PracticeDayDto> {
    const userId = import.meta.env.VITE_LEARNING_PATH_USER_ID?.trim();
    if (!userId) throw new Error("Thiếu VITE_LEARNING_PATH_USER_ID trong file .env.local.");
    const params = new URLSearchParams({ userId });
    const url = `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}/weeks/${encodeURIComponent(weekNo)}/days/${encodeURIComponent(dayNo)}/start?${params}`;
    const response = await fetch(url, { method: "POST", signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetailResponse | null;
      throw new Error(problem?.detail ?? problem?.title ?? `Không mở được bài luyện tập (${response.status}).`);
    }
    return ((await response.json()) as LearningPathApiResponse<PracticeDayDto>).data;
  },

  async saveDraft(pathId: string, weekNo: string, dayNo: string, questionId: string, selectedOptionId: string): Promise<void> {
    const userId = import.meta.env.VITE_LEARNING_PATH_USER_ID?.trim();
    if (!userId) throw new Error("Thiếu VITE_LEARNING_PATH_USER_ID trong file .env.local.");
    const params = new URLSearchParams({ userId });
    const url = `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}/weeks/${encodeURIComponent(weekNo)}/days/${encodeURIComponent(dayNo)}/questions/${encodeURIComponent(questionId)}/draft?${params}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ selectedOptionId }),
    });
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetailResponse | null;
      throw new Error(problem?.detail ?? problem?.title ?? `Không lưu được đáp án (${response.status}).`);
    }
  },
  async detail(
    pathId: string,
    signal: AbortSignal,
  ): Promise<LearningPathApiResponse<LearningPathDetailDto>> {
    if (!pathId) {
      throw new Error("Không tìm thấy mã Learning Path.");
    }
    return httpService.get<LearningPathApiResponse<LearningPathDetailDto>>(
      `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}`, { signal },
    );
  },

  async list(
    status: LearningPathListStatus,
    signal: AbortSignal,
  ): Promise<LearningPathApiResponse<LearningPathListData>> {
    return httpService.get<LearningPathApiResponse<LearningPathListData>>(
      LEARNING_PATHS_ENDPOINT, { signal, params: { status } },
    );
  },

  async search(
    keyword: string,
    signal: AbortSignal,
  ): Promise<LearningPathApiResponse<LearningPathListData>> {
    return httpService.get<LearningPathApiResponse<LearningPathListData>>(
      LEARNING_PATHS_SEARCH_ENDPOINT, { signal, params: { keyword } },
    );
  },
};
