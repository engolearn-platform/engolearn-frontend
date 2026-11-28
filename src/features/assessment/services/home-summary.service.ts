import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope } from "@shared/services/http.service";
import type { AssessmentHomeSummary } from "@features/assessment/types/home-summary.types";

export async function loadAssessmentHomeSummary(signal: AbortSignal): Promise<AssessmentHomeSummary> {
  const { data } = await httpService.get<ApiEnvelope<AssessmentHomeSummary>>("/api/v1/assessment/home-summary", { signal });
  if (!data || typeof data.asOf !== "string" || !["AVAILABLE", "NO_COMPLETED_ASSESSMENT"].includes(data.state)
    || !(data.state !== "AVAILABLE" || !!data.latestResult && Array.isArray(data.latestResult.weakSkills))) {
    throw new Error("Dữ liệu tổng quan học tập không hợp lệ. Vui lòng thử lại.");
  }
  return data;
}
