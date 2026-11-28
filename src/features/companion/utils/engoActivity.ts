import type { CompanionState } from "@features/companion/types/companion.types";

export type EngoActivity = { label: string; thinking: boolean };

/** Presentation only: do not infer tool activity from prompts or elapsed time. */
export function getEngoActivity(state: Pick<CompanionState, "stream" | "pendingQuestion" | "statusCode" | "partialText" | "isSending">): EngoActivity | null {
  if (state.stream === "reconciling") return { label: "Đang đồng bộ tin nhắn…", thinking: false };
  if (state.stream === "idle" && !state.isSending) return null;
  if (state.pendingQuestion || state.stream === "connecting") return { label: "Đang gửi câu hỏi…", thinking: false };
  if (state.stream === "streaming" && state.statusCode === "ASSESSMENT_LOOKUP") return { label: "Engo đang xem kết quả học tập…", thinking: true };
  if (state.partialText) return { label: "Engo đang trả lời…", thinking: false };
  return { label: "Engo đang suy nghĩ…", thinking: true };
}
