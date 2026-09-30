import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { updateTopicProgress } from "../services/topic-progress.service";
import type {
  FurthestReached,
  TopicItemPart,
  TopicProgress,
} from "../types/topic-progress.types";
import { isAhead, PART_ORDER } from "../types/topic-progress.types";
import type {
  TopicStructureItem,
  TopicStructureState,
} from "../types/topic-context.types";

/**
 * Mock initial progress: wake-up(0) done, breakfast(1) in progress.
 * `furthest_reached` chỉ tiến, không lùi — tracking xa nhất user đã đến.
 */
const MOCK_PROGRESS: TopicProgress = {
  topic_item_id: "morning-routine",
  topic_item_version: 3,
  is_outdated: false,
  status: "IN_PROGRESS",
  furthest_reached: { stage: "EXERCISES", item_index: 1 },
};

/**
 * Module-level persistence so `furthest` survives provider remounts
 * (e.g. layout remount on route change) within the same session.
 * Keyed by topicItemId; replaced by real GET when API lands.
 */
const persistedFurthest = new Map<string, FurthestReached>();

function getInitialProgress(topicItemId: string): TopicProgress {
  const key = topicItemId || MOCK_PROGRESS.topic_item_id;
  const furthest = persistedFurthest.get(key) ?? MOCK_PROGRESS.furthest_reached;
  return { ...MOCK_PROGRESS, topic_item_id: key, furthest_reached: furthest };
}

interface TopicProgressContextValue {
  progress: TopicProgress;
  furthest: FurthestReached;
  saving: boolean;
  /** Trang hiện tại user đang đứng — có thể lùi về phía trước furthest. */
  currentStage: TopicItemPart;
  /** Set trang hiện tại — gọi khi view mount hoặc user navigate. */
  setCurrentStage: (stage: TopicItemPart) => void;
  /** Forward-only progress report. Advances furthest + PATCH. */
  reportProgress: (
    part: TopicItemPart,
    itemIndex: number,
  ) => Promise<boolean>;
}

const TopicProgressContext = createContext<TopicProgressContextValue | null>(
  null,
);

export function TopicProgressProvider({
  topicItemId,
  children,
}: {
  topicItemId: string;
  children: ReactNode;
}) {
  const [progress, setProgress] = useState<TopicProgress>(() =>
    getInitialProgress(topicItemId),
  );
  const [saving, setSaving] = useState(false);
  const [currentStage, setCurrentStage] = useState<TopicItemPart>(
    () => getInitialProgress(topicItemId).furthest_reached.stage,
  );
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Re-sync progress when navigating between topics (provider persists
  // across stages of the same topic, but topicId itself can change).
  // NOTE: never touch `currentStage` here — views own it via
  // `setCurrentStage` on mount, and child effects run BEFORE this parent
  // effect, so writing it here would clobber the view's stage on
  // refresh/direct-load and lock the very page the user is on.
  useEffect(() => {
    const next = getInitialProgress(topicItemId);
    progressRef.current = next;
    setProgress(next);
  }, [topicItemId]);

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
      persistedFurthest.set(next.topic_item_id, next.furthest_reached);
      setProgress(next);
      setSaving(true);
      try {
        const saved = await updateTopicProgress(
          topicItemId,
          { part, item_index: itemIndex },
          next,
        );
        persistedFurthest.set(saved.topic_item_id, saved.furthest_reached);
        progressRef.current = saved;
        setProgress(saved);
      } finally {
        setSaving(false);
      }
      return true;
    },
    [topicItemId],
  );

  return (
    <TopicProgressContext.Provider
      value={{
        progress,
        furthest: progress.furthest_reached,
        saving,
        currentStage,
        setCurrentStage,
        reportProgress,
      }}
    >
      {children}
    </TopicProgressContext.Provider>
  );
}

/**
 * Access the shared topic progress state. Must be used within
 * `TopicProgressProvider` (mounted by `LearningLayout`).
 */
export function useTopicProgressContext(): TopicProgressContextValue {
  const ctx = useContext(TopicProgressContext);
  if (!ctx) {
    throw new Error(
      "useTopicProgressContext must be used within TopicProgressProvider",
    );
  }
  return ctx;
}

/**
 * Derive sidebar structure states from `furthest` (tracking) + `currentStage`
 * (where user is right now). Stages before `furthest` are `done`, stage ==
 * `currentStage` is `active`, stages after `furthest` are `locked`, stages
 * between `furthest` and `currentStage` (when looking back) are `available`.
 *
 * Simplest correct behavior:
 * - order < furthestOrder → done
 * - order === currentOrder → active
 * - order > furthestOrder → locked
 * - else (furthest <= order < current, shouldn't happen normally) → available
 */
export function deriveSidebarStates<T extends TopicStructureItem>(
  structure: T[],
  stageToPart: Record<string, TopicItemPart>,
  furthest: FurthestReached,
  currentStage: TopicItemPart,
): T[] {
  const furthestOrder = PART_ORDER.indexOf(furthest.stage);
  const currentOrder = PART_ORDER.indexOf(currentStage);
  if (furthestOrder === -1 || currentOrder === -1) {
    // Invalid stage (e.g. typo "SENTENSE" vs "SENTENCES") makes indexOf
    // return -1, which silently locks everything. Warn loudly instead.
    console.warn(
      `[topic-progress] unknown stage — furthest: "${furthest.stage}", current: "${currentStage}". Expected one of: ${PART_ORDER.join(" | ")}`,
    );
  }
  return structure.map((item) => {
    const part = stageToPart[item.id];
    if (!part) return item;
    const order = PART_ORDER.indexOf(part);
    let state: TopicStructureState;
    if (order === currentOrder) {
      state = "active";
    } else if (order > furthestOrder) {
      state = "locked";
    } else if (order < furthestOrder) {
      state = "done";
    } else {
      // furthest stage but user navigated away → available
      state = "available";
    }
    return { ...item, state };
  });
}