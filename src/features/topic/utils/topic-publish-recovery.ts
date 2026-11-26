export type TopicPublishRecoveryState = "unchanged" | "advanced";

/** Compare the persisted release pointer before a request with the refreshed pointer after an ambiguous response. */
export function topicPublishRecoveryState(
  previousReleaseId: string | null | undefined,
  refreshedReleaseId: string | null | undefined,
): TopicPublishRecoveryState {
  return (previousReleaseId ?? null) === (refreshedReleaseId ?? null) ? "unchanged" : "advanced";
}
