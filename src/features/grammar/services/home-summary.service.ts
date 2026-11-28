import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope } from "@shared/services/http.service";
import type { GrammarHomeSummary } from "@features/grammar/types/home-summary.types";

export async function loadGrammarHomeSummary(signal: AbortSignal): Promise<GrammarHomeSummary> {
  const { data } = await httpService.get<ApiEnvelope<GrammarHomeSummary>>("/api/v1/grammar/home-summary", { signal });
  if (!data || typeof data.asOf !== "string" || !["AVAILABLE", "NOT_STARTED", "NO_CURRENT_LEARNING"].includes(data.state)
    || !(data.counts && Number.isInteger(data.counts.completedLessons) && data.counts.completedLessons >= 0 && Number.isInteger(data.counts.inProgressLessons) && data.counts.inProgressLessons >= 0 && (data.state !== "AVAILABLE" || !!data.currentTopic?.lesson))) {
    throw new Error("Dữ liệu tổng quan học tập không hợp lệ. Vui lòng thử lại.");
  }
  return data;
}
