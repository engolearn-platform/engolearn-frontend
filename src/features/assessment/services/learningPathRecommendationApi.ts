import { httpService } from "@shared/services/http.service";
import type { LearningPathRecommendation } from "@features/assessment/types/learning-path-recommendation.types";

export const learningPathRecommendationApi = {
  get: (assessmentAttemptId: string, signal: AbortSignal) =>
    httpService.get<{ data: LearningPathRecommendation }>("/api/learning-paths/recommendation/by-assessment", {
      params: { assessmentAttemptId }, signal,
    }).then(response => response.data),
};
