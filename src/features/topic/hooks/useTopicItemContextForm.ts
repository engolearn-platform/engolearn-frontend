import { useMemo, useState } from "react";
import type {
  ContextDialogueTurn,
  TopicItemContextDraft,
  TopicItemOverview,
} from "../types/topic-create.types";
import { TOPIC_ITEMS_OVERVIEW_MOCK } from "../types/topic-create.types";
import { TOPIC_ITEM_CONTEXT_DEFAULT_DRAFT } from "../types/topic-create.types";

let turnSequence = 2;

function createTurn(role: ContextDialogueTurn["role"]): ContextDialogueTurn {
  turnSequence += 1;
  return {
    id: `turn-custom-${turnSequence}`,
    role,
    speaker: role === "waiter" ? "Waiter" : "You",
    textEn: "",
    textVi: "",
  };
}

export function useTopicItemContextForm(itemId: string | undefined) {
  const item: TopicItemOverview | undefined = useMemo(
    () => TOPIC_ITEMS_OVERVIEW_MOCK.find((entry) => entry.id === itemId),
    [itemId],
  );

  const [draft, setDraft] = useState<TopicItemContextDraft>(
    TOPIC_ITEM_CONTEXT_DEFAULT_DRAFT,
  );

  const patch = (patchValue: Partial<TopicItemContextDraft>) =>
    setDraft((prev) => ({ ...prev, ...patchValue }));

  const updateTurn = (id: string, turnPatch: Partial<ContextDialogueTurn>) =>
    setDraft((prev) => ({
      ...prev,
      turns: prev.turns.map((turn) =>
        turn.id === id ? { ...turn, ...turnPatch } : turn,
      ),
    }));

  const addTurn = () =>
    setDraft((prev) => {
      const lastRole = prev.turns[prev.turns.length - 1]?.role;
      const nextRole = lastRole === "waiter" ? "learner" : "waiter";
      return { ...prev, turns: [...prev.turns, createTurn(nextRole)] };
    });

  const removeTurn = (id: string) =>
    setDraft((prev) => {
      if (prev.turns.length <= 1) return prev;
      return { ...prev, turns: prev.turns.filter((turn) => turn.id !== id) };
    });

  const titleCount = draft.title.length;
  const descriptionCount = draft.description.length;

  const isValid =
    draft.title.trim().length > 0 &&
    draft.description.trim().length > 0 &&
    draft.turns.length > 0 &&
    draft.turns.every(
      (turn) =>
        turn.speaker.trim().length > 0 && turn.textEn.trim().length > 0,
    );

  return {
    item,
    draft,
    patch,
    updateTurn,
    addTurn,
    removeTurn,
    titleCount,
    descriptionCount,
    isValid,
  };
}
