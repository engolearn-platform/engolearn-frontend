import { useMemo, useState } from "react";
import type {
  ExpressionExampleType,
  TopicExpressionExample,
  TopicExpressionPurpose,
  TopicItemOverview,
} from "@features/topic/types/topic-create.types";
import {
  TOPIC_EXPRESSION_MAX_EXAMPLES,
  TOPIC_EXPRESSION_MAX_PURPOSES,
  TOPIC_EXPRESSIONS_MOCK_CHOOSING_FOOD,
  TOPIC_ITEMS_OVERVIEW_MOCK,
  TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD,
} from "@features/topic/types/topic-create.types";

let purposeSequence = 2;
let exampleSequence = 100;

function createPurposeId(): string {
  purposeSequence += 1;
  return `purpose-custom-${purposeSequence}`;
}

function createExampleId(): string {
  exampleSequence += 1;
  return `expr-custom-${exampleSequence}`;
}

function normalizePurpose(value: string): string {
  return value.trim().toLowerCase();
}

export interface ExpressionExampleUpsert {
  purposeEn: string;
  purposeVi: string;
  type: ExpressionExampleType;
  textEn: string;
  textVi: string;
  usageNote: string;
  audioFile: string | null;
  linkedVocabIds: string[];
}

export interface ExpressionPurposeOption {
  en: string;
  vi: string;
}

export interface ExpressionVocabOption {
  id: string;
  word: string;
}

export function useTopicItemExpressionsForm(itemId: string | undefined) {
  const item: TopicItemOverview | undefined = useMemo(
    () => TOPIC_ITEMS_OVERVIEW_MOCK.find((entry) => entry.id === itemId),
    [itemId],
  );

  const [purposes, setPurposes] = useState<TopicExpressionPurpose[]>(
    TOPIC_EXPRESSIONS_MOCK_CHOOSING_FOOD,
  );

  const vocabOptions: ExpressionVocabOption[] = useMemo(
    () =>
      TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD.map((entry) => ({
        id: entry.id,
        word: entry.word,
      })),
    [],
  );

  const vocabWordById = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD) {
      map.set(entry.id, entry.word);
    }
    return map;
  }, []);

  const purposeOptions: ExpressionPurposeOption[] = useMemo(
    () => {
      const seen = new Map<string, ExpressionPurposeOption>();
      for (const purpose of purposes) {
        const key = normalizePurpose(purpose.purposeEn);
        if (!key || seen.has(key)) continue;
        seen.set(key, {
          en: purpose.purposeEn,
          vi: purpose.purposeVi,
        });
      }
      return [...seen.values()];
    },
    [purposes],
  );

  const lookupPurposeVi = (purposeEn: string): string | null => {
    const key = normalizePurpose(purposeEn);
    if (!key) return null;
    const found = purposeOptions.find(
      (option) => normalizePurpose(option.en) === key,
    );
    return found ? found.vi : null;
  };

  const totalExamples = purposes.reduce(
    (sum, purpose) => sum + purpose.examples.length,
    0,
  );

  const canAddPurpose = purposes.length < TOPIC_EXPRESSION_MAX_PURPOSES;

  const canAddExample = (purposeId: string): boolean => {
    const purpose = purposes.find((entry) => entry.id === purposeId);
    if (!purpose) return false;
    return purpose.examples.length < TOPIC_EXPRESSION_MAX_EXAMPLES;
  };

  const sanitizeLinkedIds = (ids: string[]): string[] => {
    const valid = new Set(vocabOptions.map((option) => option.id));
    return [...new Set(ids)].filter((id) => valid.has(id));
  };

  const addExampleToPurpose = (draft: ExpressionExampleUpsert): boolean => {
    const purposeEn = draft.purposeEn.trim();
    const purposeVi = draft.purposeVi.trim();
    const textEn = draft.textEn.trim();
    const textVi = draft.textVi.trim();
    if (!purposeEn || !purposeVi || !textEn || !textVi) return false;

    const example: TopicExpressionExample = {
      id: createExampleId(),
      type: draft.type,
      textEn,
      textVi,
      usageNote: draft.usageNote.trim(),
      audioFile: draft.audioFile,
      linkedVocabIds: sanitizeLinkedIds(draft.linkedVocabIds),
    };

    let added = false;
    setPurposes((prev) => {
      const key = normalizePurpose(purposeEn);
      const index = prev.findIndex(
        (entry) => normalizePurpose(entry.purposeEn) === key,
      );
      if (index >= 0) {
        const target = prev[index];
        if (!target || target.examples.length >= TOPIC_EXPRESSION_MAX_EXAMPLES) {
          return prev;
        }
        added = true;
        return prev.map((entry, i) =>
          i === index ? { ...entry, examples: [...entry.examples, example] } : entry,
        );
      }
      if (prev.length >= TOPIC_EXPRESSION_MAX_PURPOSES) return prev;
      added = true;
      const orderIndex =
        prev.reduce((max, entry) => Math.max(max, entry.orderIndex), 0) + 1;
      return [
        ...prev,
        {
          id: createPurposeId(),
          purposeEn,
          purposeVi,
          orderIndex,
          examples: [example],
        },
      ];
    });
    return added;
  };

  const patchExample = (
    exampleId: string,
    patch: Partial<Omit<TopicExpressionExample, "id">> & {
      purposeEn?: string;
      purposeVi?: string;
    },
  ) => {
    setPurposes((prev) =>
      prev.map((purpose) => {
        const found = purpose.examples.some(
          (example) => example.id === exampleId,
        );
        if (!found) return purpose;
        return {
          ...purpose,
          purposeEn: patch.purposeEn?.trim() || purpose.purposeEn,
          purposeVi: patch.purposeVi?.trim() || purpose.purposeVi,
          examples: purpose.examples.map((example) =>
            example.id === exampleId
              ? {
                  ...example,
                  ...patch,
                  textEn: patch.textEn?.trim() ?? example.textEn,
                  textVi: patch.textVi?.trim() ?? example.textVi,
                  usageNote: patch.usageNote?.trim() ?? example.usageNote,
                  linkedVocabIds: patch.linkedVocabIds
                    ? sanitizeLinkedIds(patch.linkedVocabIds)
                    : example.linkedVocabIds,
                }
              : example,
          ),
        };
      }),
    );
  };

  const removeExample = (exampleId: string) =>
    setPurposes((prev) =>
      prev.map((purpose) => ({
        ...purpose,
        examples: purpose.examples.filter(
          (example) => example.id !== exampleId,
        ),
      })),
    );

  const removePurpose = (purposeId: string) =>
    setPurposes((prev) =>
      prev
        .filter((purpose) => purpose.id !== purposeId)
        .map((purpose, index) => ({ ...purpose, orderIndex: index + 1 })),
    );

  const duplicateExample = (exampleId: string) =>
    setPurposes((prev) =>
      prev.map((purpose) => {
        const source = purpose.examples.find(
          (example) => example.id === exampleId,
        );
        if (!source) return purpose;
        if (purpose.examples.length >= TOPIC_EXPRESSION_MAX_EXAMPLES) {
          return purpose;
        }
        return {
          ...purpose,
          examples: [...purpose.examples, { ...source, id: createExampleId() }],
        };
      }),
    );

  const findExample = (
    exampleId: string,
  ): { purpose: TopicExpressionPurpose; example: TopicExpressionExample } | undefined => {
    for (const purpose of purposes) {
      const example = purpose.examples.find((entry) => entry.id === exampleId);
      if (example) return { purpose, example };
    }
    return undefined;
  };

  const isValid =
    purposes.length > 0 &&
    purposes.length <= TOPIC_EXPRESSION_MAX_PURPOSES &&
    purposes.every(
      (purpose) =>
        purpose.purposeEn.trim().length > 0 &&
        purpose.purposeVi.trim().length > 0 &&
        purpose.examples.length > 0 &&
        purpose.examples.length <= TOPIC_EXPRESSION_MAX_EXAMPLES &&
        purpose.examples.every(
          (example) =>
            example.textEn.trim().length > 0 &&
            example.textVi.trim().length > 0,
        ),
    );

  return {
    item,
    purposes,
    purposeOptions,
    vocabOptions,
    vocabWordById,
    totalExamples,
    maxPurposes: TOPIC_EXPRESSION_MAX_PURPOSES,
    maxExamples: TOPIC_EXPRESSION_MAX_EXAMPLES,
    canAddPurpose,
    canAddExample,
    lookupPurposeVi,
    addExampleToPurpose,
    patchExample,
    removeExample,
    removePurpose,
    duplicateExample,
    findExample,
    isValid,
  };
}
