import type { GrammarLesson } from "@features/grammar/types/grammar-content.types";

export const grammarEntryCard = "rounded-xl border border-outline-variant/70 bg-surface-container-lowest";
export const grammarEditorPanel = grammarEntryCard + " p-5";
export const grammarEditorGrid = "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)]";

export const statusLabels: Record<string, string> = {
  DRAFT: "Nháp",
  IN_PROGRESS: "Đang hoàn thiện",
  READY: "Sẵn sàng",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Lưu trữ",
};

export function grammarLessonStatus(lesson: GrammarLesson) {
  return lesson.status === "DRAFT" && lesson.ready ? "READY" : lesson.status;
}
