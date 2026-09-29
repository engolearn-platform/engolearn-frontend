import { useCallback, useRef, useState } from "react";
import { updateTopicProgress } from "../services/topic-progress.service";
import type {
  FurthestReached,
  TopicItemPart,
  TopicProgress,
} from "../types/topic-progress.types";
import { isAhead } from "../types/topic-progress.types";

/** Mock initial progress: wake-up(0) + breakfast(1) done, get-dressed(2) in progress. */
const MOCK_PROGRESS: TopicProgress = {
  topic_item_id: "morning-routine",
  topic_item_version: 3,
  is_outdated: false,
  status: "IN_PROGRESS",
  furthest_reached: { stage: "VOCAB", item_index: 1 },
};

export function useTopicProgress(topicItemId: string) {
  const [progress, setProgress] = useState<TopicProgress>(() => ({
    ...MOCK_PROGRESS,
    topic_item_id: topicItemId || MOCK_PROGRESS.topic_item_id,
  }));
  const [saving, setSaving] = useState(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  /**
   * Forward-only progress report. Advances `furthest_reached` (and fires the
   * PATCH) only when `candidate` is strictly ahead; returns true on advance.
   */
  const reportProgress = useCallback(
    async (part: TopicItemPart, itemIndex: number): Promise<boolean> => {
      const prev = progressRef.current;
      const candidate: FurthestReached = {
        stage: part,
        item_index: itemIndex,
      };
      if (!isAhead(prev.furthest_reached, candidate)) {
        return false;
      }
      const next: TopicProgress = { ...prev, furthest_reached: candidate };
      setProgress(next);
      setSaving(true);
      try {
        const saved = await updateTopicProgress(
          topicItemId,
          { part, item_index: itemIndex },
          next,
        );
        progressRef.current = saved;
        setProgress(saved);
      } finally {
        setSaving(false);
      }
      return true;
    },
    [topicItemId],
  );

  return {
    progress,
    furthest: progress.furthest_reached,
    saving,
    reportProgress,
  };
}
