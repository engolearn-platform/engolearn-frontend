import type { TopicStatus } from "@features/topic/types/topic-management.types";

export function topicStatusLabel(status: TopicStatus): string {
  if (status === "published") return "Đã xuất bản";
  if (status === "unpublished") return "Đã gỡ xuất bản";
  return "Bản nháp";
}
