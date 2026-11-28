import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope } from "@shared/services/http.service";
import type { TopicHomeSummary } from "@features/topic/types/home-summary.types";

export async function loadTopicHomeSummary(signal: AbortSignal): Promise<TopicHomeSummary> {
  const { data } = await httpService.get<ApiEnvelope<TopicHomeSummary>>("/api/v1/topics/home-summary", { signal });
  if (!data || typeof data.asOf !== "string" || !["AVAILABLE", "NO_CURRENT_LEARNING"].includes(data.state)
    || !(data.counts && Number.isInteger(data.counts.completed) && data.counts.completed >= 0 && Number.isInteger(data.counts.inProgress) && data.counts.inProgress >= 0 && (data.state !== "AVAILABLE" || !!data.currentTopic))) {
    throw new Error("Dữ liệu tổng quan học tập không hợp lệ. Vui lòng thử lại.");
  }
  return data;
}
