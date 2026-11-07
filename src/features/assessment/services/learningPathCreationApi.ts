import { httpService } from "@shared/services/http.service";
import type { CreateLearningPathRequest, CreateLearningPathResponse } from "@features/assessment/types/learning-path-creation.types";

export const learningPathCreationApi = {
  create: (request: CreateLearningPathRequest, signal: AbortSignal) =>
    httpService.post<{ data: CreateLearningPathResponse }>("/api/learning-paths/by-assessment", request, { signal })
      .then(response => response.data),
};
