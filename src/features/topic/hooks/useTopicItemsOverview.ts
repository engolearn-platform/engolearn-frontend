import { useState } from "react";
import type {
  TopicItemOverview,
  TopicScriptQuality,
} from "../types/topic-create.types";
import {
  TOPIC_ITEMS_OVERVIEW_MOCK,
  TOPIC_SCRIPT_QUALITY_MOCK,
} from "../types/topic-create.types";

export function useTopicItemsOverview() {
  const [items, setItems] = useState<TopicItemOverview[]>(
    TOPIC_ITEMS_OVERVIEW_MOCK,
  );
  const [selectedId, setSelectedId] = useState<string>("choosing-food");
  const [quality] = useState<TopicScriptQuality>(TOPIC_SCRIPT_QUALITY_MOCK);

  const selectItem = (id: string) => setSelectedId(id);

  const removeItem = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    if (id === selectedId && next.length > 0) {
      setSelectedId(next[0].id);
    }
  };

  const selectedItem = items.find((item) => item.id === selectedId);

  return { items, selectedId, selectedItem, quality, selectItem, removeItem };
}
