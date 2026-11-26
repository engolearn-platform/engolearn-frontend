import type { TopicStatus } from "@features/topic/types/topic-management.types";

export type TopicRepublishOutcome = "published" | "new-release" | "reused-release";

export function topicRepublishOutcome(
  previousStatus: TopicStatus,
  previousReleaseId: string | null | undefined,
  committedReleaseId: string,
): TopicRepublishOutcome {
  if (previousStatus !== "unpublished") return "published";
  return (previousReleaseId ?? null) === committedReleaseId ? "reused-release" : "new-release";
}
