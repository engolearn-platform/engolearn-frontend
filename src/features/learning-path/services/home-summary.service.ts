import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope } from "@shared/services/http.service";
import type { LearningPathHomeSummary } from "@features/learning-path/types/home-summary.types";

export async function loadLearningPathHomeSummary(signal: AbortSignal): Promise<LearningPathHomeSummary> {
  const { data } = await httpService.get<ApiEnvelope<LearningPathHomeSummary>>("/api/learning-paths/home-summary", { signal });
  if (!data || typeof data.asOf !== "string" || !["AVAILABLE", "ASSESSMENT_REQUIRED", "PAST_PATHS_ONLY", "RECOMMENDATION_AVAILABLE", "NO_WEAK_SKILLS", "NO_ELIGIBLE_SKILLS"].includes(data.state)
    || !(data.counts && [data.counts.active, data.counts.completed, data.counts.cancelled].every(value => Number.isInteger(value) && value >= 0) && (data.state !== "AVAILABLE" || !!data.currentPath))) {
    throw new Error("Dữ liệu tổng quan học tập không hợp lệ. Vui lòng thử lại.");
  }
  return data;
}
