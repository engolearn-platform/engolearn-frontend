import { useMemo, useState } from "react";
import type {
  TopicItemOverview,
  TopicVocabularyItem,
} from "@features/topic/types/topic-create.types";
import {
  TOPIC_ITEMS_OVERVIEW_MOCK,
  TOPIC_VOCAB_MAX,
  TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD,
} from "@features/topic/types/topic-create.types";

let vocabSequence = 4;

function createId(): string {
  vocabSequence += 1;
  return `vocab-custom-${vocabSequence}`;
}

export type TopicVocabularyUpsert =
  Omit<TopicVocabularyItem, "id" | "audioUploaded">;

export function useTopicItemVocabularyForm(itemId: string | undefined) {
  const item: TopicItemOverview | undefined = useMemo(
    () => TOPIC_ITEMS_OVERVIEW_MOCK.find((entry) => entry.id === itemId),
    [itemId],
  );

  const [items, setItems] = useState<TopicVocabularyItem[]>(
    TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD,
  );

  const patchItem = (id: string, patch: Partial<TopicVocabularyItem>) =>
    setItems((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );

  const addItem = (draft: TopicVocabularyUpsert) => {
    if (items.length >= TOPIC_VOCAB_MAX) return;
    setItems((prev) => [
      ...prev,
      { ...draft, id: createId(), audioUploaded: true },
    ]);
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((entry) => entry.id !== id));

  const moveItem = (id: string, direction: "up" | "down") =>
    setItems((prev) => {
      const index = prev.findIndex((entry) => entry.id === id);
      if (index < 0) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      if (!moved) return prev;
      next.splice(target, 0, moved);
      return next;
    });

  const isValid =
    items.length > 0 &&
    items.length <= TOPIC_VOCAB_MAX &&
    items.every(
      (entry) =>
        entry.word.trim().length > 0 &&
        entry.meaningVi.trim().length > 0 &&
        entry.examples.length > 0 &&
        entry.examples.every((example) => example.en.trim().length > 0),
    );

  return {
    item,
    items,
    count: items.length,
    max: TOPIC_VOCAB_MAX,
    canAdd: items.length < TOPIC_VOCAB_MAX,
    patchItem,
    addItem,
    removeItem,
    moveItem,
    isValid,
  };
}
