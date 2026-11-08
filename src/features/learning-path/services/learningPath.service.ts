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

export const learningPathService = {
  async dayResult(pathId: string, weekNo: string, dayNo: string, signal: AbortSignal): Promise<DayResultDto> {
    const url = `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}/weeks/${encodeURIComponent(weekNo)}/days/${encodeURIComponent(dayNo)}/result`;
    const response = await httpService.get<LearningPathApiResponse<DayResultDto>>(url, { signal });
    return response.data;
  },
  async submitDay(pathId: string, weekNo: number, dayNo: number, signal: AbortSignal): Promise<SubmitDayResult> {
    const url = `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}/weeks/${weekNo}/days/${dayNo}/submit`;
    const response = await httpService.post<LearningPathApiResponse<SubmitDayResult>>(url, undefined, { signal });
    return response.data;
  },
  async startDay(pathId: string, weekNo: string, dayNo: string, signal: AbortSignal): Promise<PracticeDayDto> {
    const url = `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}/weeks/${encodeURIComponent(weekNo)}/days/${encodeURIComponent(dayNo)}/start`;
    const response = await httpService.post<LearningPathApiResponse<PracticeDayDto>>(url, undefined, { signal });
    return response.data;
  },

  async saveDraft(pathId: string, weekNo: string, dayNo: string, questionId: string, selectedOptionId: string, signal: AbortSignal): Promise<void> {
    const url = `${LEARNING_PATHS_ENDPOINT}/${encodeURIComponent(pathId)}/weeks/${encodeURIComponent(weekNo)}/days/${encodeURIComponent(dayNo)}/questions/${encodeURIComponent(questionId)}/draft`;
    await httpService.put<unknown>(url, { selectedOptionId }, { signal });
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
