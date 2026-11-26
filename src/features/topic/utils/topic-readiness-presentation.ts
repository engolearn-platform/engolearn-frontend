import type { TopicItemManagementSummary } from "@features/topic/types/topic-management.types";

type ReadinessAction = "topic-metadata" | "item-list" | "item-metadata" | "item-section";

const fieldLabels: Record<string, string> = {
  title: "Tên bài học", titleEn: "Tên tiếng Anh", titleVi: "Tên tiếng Việt", description: "Mô tả",
  duration: "Thời lượng", durationMinutes: "Thời lượng", itemCount: "Số bài học",
  cefr: "Trình độ CEFR", category: "Chủ đề phân loại", coverUrl: "Ảnh bìa",
  prompt: "Yêu cầu hội thoại", scenarioDescription: "Mô tả tình huống", dialogue: "Lời thoại",
  vocabularies: "Danh sách từ vựng", samples: "Ví dụ", collocations: "Cụm từ thường dùng",
  expressions: "Cụm diễn đạt", purposes: "Mục đích giao tiếp", quizzes: "Bài tập", questions: "Câu hỏi",
  audioUrl: "Tệp âm thanh", audioEnUrl: "Âm thanh giọng Anh", audioUsUrl: "Âm thanh giọng Mỹ",
  answerData: "Đáp án", options: "Lựa chọn trả lời", correct: "Đáp án đúng",
};

export function readinessResource(path: string) {
  const lower = path.toLowerCase();
  if (lower.includes("audio")) return "Âm thanh";
  if (lower.includes("vocab") || lower.includes("sample") || lower.includes("collocation")) return "Từ vựng và ví dụ";
  if (lower.includes("expression") || lower.includes("purpose")) return "Cụm diễn đạt và ví dụ";
  if (lower.includes("quiz") || lower.includes("question")) return "Bài tập";
  if (lower.includes("dialogue")) return "Hội thoại";
  if (lower.includes("context") || lower.includes("prompt") || lower.includes("scenario")) return "Bối cảnh";
  return "Thông tin bài học";
}

export function classifyReadinessViolation(path: string, items: TopicItemManagementSummary[]) {
  const match = path.match(/items\[([^\]]+)\]/);
  const visibleItems = items.filter((item) => item.status !== "HIDDEN").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const token = match?.[1];
  const item = token === undefined ? undefined : /^\d+$/.test(token)
    ? visibleItems[Number(token)]
    : visibleItems.find((entry) => entry.id === token);
  const lower = path.toLowerCase();
  const itemMetadata = !!item && /items\[[^\]]+\]\.(title|description|duration|durationminutes)(\.|$)/i.test(path);
  const resource = readinessResource(path);
  const fields = path.split(".");
  const field = fields[fields.length - 1]?.replace(/\[.*$/, "") ?? "";
  const label = fieldLabels[field] ?? resource;
  const action: ReadinessAction = lower.includes("itemcount") || lower.includes("items.count") || lower.includes("visibleitem")
    ? "item-list"
    : path.startsWith("topic.") ? "topic-metadata"
      : !item ? "item-list"
        : itemMetadata ? "item-metadata" : "item-section";
  const section = lower.includes("vocab") ? "vocabulary"
    : lower.includes("expression") ? "expressions"
      : lower.includes("quiz") || lower.includes("question") ? "quiz" : "context";
  const group = item
    ? `Bài học ${item.order ?? ""}: ${item.title || "Chưa có tên"} · ${resource}`
    : path.startsWith("topic.") ? "Thông tin chủ đề" : "Nội dung chủ đề";
  return { action, group, item, label, section };
}

export function readinessViolationMessage(path: string, code: string) {
  const lower = path.toLowerCase();
  if (code === "REQUIRED") return "Hãy bổ sung thông tin này trước khi xuất bản.";
  if (code === "INVALID_MEDIA") return "Chọn tệp đã tải lên cho chủ đề và đúng loại (ảnh hoặc âm thanh).";
  if (code === "ITEM_COUNT" || lower === "topic.items" || lower === "items") return "Cần có từ 5 đến 20 bài học hiển thị.";
  if (code === "COUNT_OUT_OF_RANGE") {
    if (lower.includes("examples")) return "Mỗi từ vựng cần có từ 1 đến 3 ví dụ.";
    if (lower.includes("collocations")) return "Mỗi từ vựng có thể có tối đa 5 cụm từ thường dùng.";
    if (lower.includes(".expressions")) return "Mỗi nhóm cần có từ 1 đến 3 cụm diễn đạt.";
    if (lower.includes("quizzes.")) return "Mỗi dạng bài tập cần có từ 3 đến 5 câu hỏi.";
    if (lower.includes("wordbank")) return "Cần có từ 4 đến 6 từ trong ngân hàng từ.";
    if (lower.includes(".options")) return "Câu hỏi lựa chọn tình huống cần có đúng 4 đáp án.";
    if (lower.includes("expressiongroups")) return "Mỗi bài học cần có từ 1 đến 3 nhóm diễn đạt.";
    if (lower.includes("vocabularies")) return "Mỗi bài học cần có từ 3 đến 5 từ vựng.";
    return "Số lượng mục chưa đáp ứng yêu cầu xuất bản.";
  }
  if (code === "UNSUPPORTED") return "Chọn một trong các dạng bài tập được hỗ trợ.";
  if (code === "CORRECT_ANSWER_COUNT") return "Đánh dấu đúng một đáp án đúng.";
  if (code === "BLANK_COUNT") return "Câu hoàn chỉnh cần chứa đáp án đúng đúng một lần tại vị trí chỗ trống.";
  return "Hãy kiểm tra và cập nhật mục này theo yêu cầu xuất bản.";
}
