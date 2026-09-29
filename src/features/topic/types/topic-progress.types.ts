/** Mirrors backend `TopicItemPart`: CONTEXT, VOCAB, SENTENCES, EXERCISES. */
export type TopicItemPart = "CONTEXT" | "VOCAB" | "SENTENCES" | "EXERCISES";

export type TopicProgressStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface FurthestReached {
  stage: TopicItemPart;
  item_index: number;
}

export interface TopicProgress {
  topic_item_id: string;
  topic_item_version: number;
  is_outdated: boolean;
  status: TopicProgressStatus;
  furthest_reached: FurthestReached;
}

export interface UpdateProgressPayload {
  part: TopicItemPart;
  item_index: number;
}

/** Canonical part order — progress only ever moves forward along it. */
export const PART_ORDER: readonly TopicItemPart[] = [
  "CONTEXT",
  "VOCAB",
  "SENTENCES",
  "EXERCISES",
];

/** Sidebar stage id (see `TopicStructureItem`) -> backend part. */
export const STAGE_TO_PART: Record<string, TopicItemPart> = {
  context: "CONTEXT",
  vocab: "VOCAB",
  expressions: "SENTENCES",
  practice: "EXERCISES",
};

/** True when `candidate` is strictly ahead of `current` (forward-only). */
export function isAhead(
  current: FurthestReached,
  candidate: FurthestReached,
): boolean {
  const stageDiff =
    PART_ORDER.indexOf(candidate.stage) - PART_ORDER.indexOf(current.stage);
  if (stageDiff !== 0) {
    return stageDiff > 0;
  }
  return candidate.item_index > current.item_index;
}

/** True when the given part/item is at or behind `furthest` (unlocked). */
export function isUnlocked(
  furthest: FurthestReached,
  part: TopicItemPart,
  itemIndex: number,
): boolean {
  const stageDiff =
    PART_ORDER.indexOf(part) - PART_ORDER.indexOf(furthest.stage);
  if (stageDiff !== 0) {
    return stageDiff < 0;
  }
  return itemIndex <= furthest.item_index;
}
