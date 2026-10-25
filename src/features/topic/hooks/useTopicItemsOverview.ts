import { useState } from "react";
import type {
  TopicItemOverview,
  TopicScriptQuality,
} from "../types/topic-create.types";
import {
  TOPIC_ITEMS_DEFAULT_SELECTED_ID,
  TOPIC_ITEMS_OVERVIEW_MOCK,
  TOPIC_SCRIPT_QUALITY_MOCK,
} from "../types/topic-create.types";

interface TopicItemsOverviewOptions {
  /** Items hiện có (mode update); bỏ trống → mock create. */
  items?: TopicItemOverview[];
  /** Quality sidebar hiện có (mode update); bỏ trống → mock create. */
  quality?: TopicScriptQuality;
  /** Item được chọn mặc định; fallback item đầu tiên. */
  selectedItemId?: string;
}

export function useTopicItemsOverview({
  items: initialItems = TOPIC_ITEMS_OVERVIEW_MOCK,
  quality: initialQuality = TOPIC_SCRIPT_QUALITY_MOCK,
  selectedItemId,
}: TopicItemsOverviewOptions = {}) {
  const [items, setItems] = useState<TopicItemOverview[]>(initialItems);
  const fallbackSelectedId = initialItems.some(
    (item) => item.id === TOPIC_ITEMS_DEFAULT_SELECTED_ID,
  )
    ? TOPIC_ITEMS_DEFAULT_SELECTED_ID
    : (initialItems[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string>(
    selectedItemId ?? fallbackSelectedId,
  );
  const [quality] = useState<TopicScriptQuality>(initialQuality);

  const selectItem = (id: string) => setSelectedId(id);

  const removeItem = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    if (id === selectedId) {
      setSelectedId(next[0]?.id ?? "");
    }
  };

  const selectedItem = items.find((item) => item.id === selectedId);

  return { items, selectedId, selectedItem, quality, selectItem, removeItem };
}
