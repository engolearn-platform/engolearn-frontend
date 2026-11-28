import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope } from "@shared/services/http.service";
import type { SpeakingHomeSummary } from "@features/speaking/types/home-summary.types";

export async function loadSpeakingHomeSummary(signal: AbortSignal): Promise<SpeakingHomeSummary> {
  const { data } = await httpService.get<ApiEnvelope<SpeakingHomeSummary>>("/api/v1/speaking/home-summary", { signal });
  if (!data || typeof data.asOf !== "string" || !["AVAILABLE", "NOT_STARTED"].includes(data.state)
    || !(Number.isInteger(data.sessionCount) && data.sessionCount >= 0 && Number.isFinite(data.speechDurationMs) && data.speechDurationMs >= 0 && (data.state !== "AVAILABLE" || !!data.latestSession))) {
    throw new Error("Dữ liệu tổng quan học tập không hợp lệ. Vui lòng thử lại.");
  }
  return data;
}
