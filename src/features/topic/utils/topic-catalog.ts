import type { CefrLevelDto, TopicCardDto, TopicPageDto, MyTopicCountsDto, TopicItemSummaryDto } from "@features/topic/types/topic-api.types";

import { ROUTES } from "@shared/constants";

export const TOPIC_LEVELS: readonly CefrLevelDto[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
export type CatalogPage = TopicPageDto & { counts?: MyTopicCountsDto };
export function readTopicFilters(parameters: URLSearchParams, level: CefrLevelDto | null) {
  const raw = parameters.get("level") ?? "all";
  const selected = raw === "mine" && level ? "mine" : TOPIC_LEVELS.includes(raw as CefrLevelDto) ? raw : "all";
  return {
    keyword: parameters.get("q")?.trim() ?? "",
    selectedLevel: selected,
    level: selected === "mine" ? level ?? undefined : selected === "all" ? undefined : selected as CefrLevelDto,
    sort: parameters.get("sort") === "duration" ? "duration" as const : "recommended" as const,
  };
}
export function mergeTopicPages(previous: CatalogPage | null, page: CatalogPage, cursor: string | null): CatalogPage {
  const items = new Map<string, TopicCardDto>();
  if (cursor) for (const item of previous?.items ?? []) items.set(item.topicId, item);
  for (const item of page.items) items.set(item.topicId, item);
  return { ...page, items: [...items.values()] };
}
export function safeTopicOrigin(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return ROUTES.TOPICS;
  try {
    const url = new URL(value, "https://engolearn.invalid");
    if (url.origin !== "https://engolearn.invalid" || ![ROUTES.TOPICS as string, ROUTES.MY_TOPICS as string].includes(url.pathname)) return ROUTES.TOPICS;
    return url.pathname + url.search;
  } catch { return ROUTES.TOPICS; }
}
export function topicDetailPath(topicId: string, origin: string): string {
  return ROUTES.TOPIC_DETAIL.replace(":topicId", encodeURIComponent(topicId)) + "?from=" + encodeURIComponent(safeTopicOrigin(origin));
}
export function topicAttemptPath(topicId: string, attemptId: string, origin: string, mode: "learn" | "review" = "learn"): string {
  return ROUTES.TOPIC_ATTEMPT.replace(":topicId", encodeURIComponent(topicId)).replace(":attemptId", encodeURIComponent(attemptId)) +
    "?mode=" + mode + "&from=" + encodeURIComponent(safeTopicOrigin(origin));
}
export function topicItemResultPath(topicId: string, attemptId: string, origin: string): string {
  return ROUTES.TOPIC_ITEM_RESULT.replace(":topicId", encodeURIComponent(topicId)).replace(":attemptId", encodeURIComponent(attemptId)) +
    "?from=" + encodeURIComponent(safeTopicOrigin(origin));
}
export function topicResultPath(topicId: string, origin: string): string {
  return ROUTES.TOPIC_RESULT.replace(":topicId", encodeURIComponent(topicId)) + "?from=" + encodeURIComponent(safeTopicOrigin(origin));
}
export function primaryTopicItem(items: TopicItemSummaryDto[]) {
  return items.find(item => item.actions.continue.allowed && item.learningAttempt) ??
    items.find(item => item.actions.start.allowed) ?? null;
}
export function topicPositionLabel(stage: string, index: number) {
  const label: Record<string, string> = { CONTEXT: "Bối cảnh", VOCAB: "Từ vựng", EXPRESSIONS: "Mẫu câu", FILL_BLANK: "Điền từ", SITUATIONAL_CHOICE: "Chọn tình huống" };
  return (label[stage] ?? "Bài học") + (stage === "CONTEXT" ? "" : " · Mục " + (index + 1));
}
export function topicBlockMessage(reason: string | null | undefined) {
  const labels: Record<string, string> = {
    SIGN_IN_REQUIRED: "Đăng nhập để bắt đầu học và lưu tiến độ.",
    LEVEL_TOO_LOW: "Cần đạt level của chủ đề để bắt đầu lượt học mới.",
    PREDECESSOR_INCOMPLETE: "Hoàn thành bài trước để mở khóa.",
    OTHER_ITEM_IN_PROGRESS: "Tiếp tục bài đang học trước khi bắt đầu bài này.",
    ALREADY_COMPLETED: "Bài đã hoàn thành. Bạn có thể xem lại hoặc làm lại.",
    NOT_COMPLETED: "Hoàn thành bài học trước khi làm lại.",
    NO_RUNNING_ATTEMPT: "Chưa có lượt học để tiếp tục.",
    CONTENT_UNAVAILABLE: "Nội dung hiện chưa sẵn sàng.",
  };
  return reason ? labels[reason] ?? "Thao tác hiện chưa khả dụng." : "";
}
export function topicErrorMessage(error: { code?: string; status?: number; message?: string } | null) {
  if (!error) return "";
  const labels: Record<string, string> = {
    LOCAL_STORAGE_UNAVAILABLE: "Không lưu được yêu cầu trên trình duyệt. Vui lòng cho phép lưu trữ để thử lại.",
    NETWORK_ERROR: "Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.",
    INVALID_RESPONSE: "Dữ liệu từ máy chủ chưa hợp lệ. Vui lòng thử lại sau.",
    CONTRACT_MISMATCH: "Dữ liệu từ máy chủ chưa khớp với phiên bản hiện tại.",
    QUIZ_COMPLETION_UNAVAILABLE: "Máy chủ chưa hoàn tất trạng thái bài học sau câu cuối. Vui lòng quay lại chủ đề hoặc thử tải lại sau.",
    ATTEMPT_NOT_COMPLETED: "Bài học còn câu hỏi chưa hoàn thành. Vui lòng quay lại vị trí đang học.",
    TOPIC_NOT_COMPLETED: "Chủ đề còn bài học chưa hoàn thành. Vui lòng quay lại chủ đề để tiếp tục.",
    ITEM_HIDDEN: "Nội dung này không còn khả dụng. Vui lòng chọn bài học khác từ chủ đề.",
    SIGN_IN_REQUIRED: "Vui lòng đăng nhập để tiếp tục.",
    LEVEL_TOO_LOW: "Level hiện tại chưa đủ để bắt đầu lượt học này.",
    PREDECESSOR_INCOMPLETE: "Bạn cần hoàn thành bài trước để tiếp tục.",
    OTHER_ITEM_IN_PROGRESS: "Bạn đang có một bài học dở trong chủ đề này.",
    STATE_CHANGED: "Tiến trình vừa thay đổi. Hãy tải lại để xem trạng thái mới nhất.",
    RETRY_SESSION_CHANGED: "Lượt làm lại vừa thay đổi. Hãy tải lại chủ đề.",
    RESULT_CHANGED: "Kết quả đã được cập nhật. Hãy mở lại từ chi tiết chủ đề.",
  };
  if (error.code && labels[error.code]) return labels[error.code];
  if (error.status === 404) return "Nội dung không tồn tại hoặc đã được gỡ xuất bản.";
  if (error.status === 401) return "Vui lòng đăng nhập để tiếp tục.";
  if (error.status === 409) return "Dữ liệu vừa thay đổi. Vui lòng tải lại và thử lại.";
  return "Không tải được dữ liệu. Vui lòng thử lại.";
}
