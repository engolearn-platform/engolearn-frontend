import type {
  TopicExpressionGroupType,
  TopicExpressionLabel,
  TopicExpressionResource,
} from "@features/topic/types/topic-management.types";

const GROUP_TYPE_LABELS: Record<TopicExpressionGroupType, string> = {
  BASIC: "Cơ bản",
  COMMON: "Phổ biến",
  PLACEHOLDER: "Mẫu thế chỗ",
};

const LABEL_LABELS: Record<TopicExpressionLabel, string> = {
  COMMON: "Phổ biến",
  POLITE: "Lịch sự",
  SLOT_HINT: "Gợi ý mẫu thế chỗ",
};

const TYPE_LABELS: Record<string, string> = {
  BASIC_SUGGESTION: "Câu gợi ý cơ bản",
  POLITE_INQUIRY: "Câu hỏi lịch sự",
  SLOT_PATTERN: "Mẫu thế chỗ",
};

export function expressionGroupTypeLabel(value: string | null | undefined): string | null {
  return value && Object.prototype.hasOwnProperty.call(GROUP_TYPE_LABELS, value)
    ? GROUP_TYPE_LABELS[value as TopicExpressionGroupType]
    : null;
}

export function expressionLabel(value: string | null | undefined): string | null {
  return value && Object.prototype.hasOwnProperty.call(LABEL_LABELS, value)
    ? LABEL_LABELS[value as TopicExpressionLabel]
    : null;
}

export function expressionTypeLabel(value: string | null | undefined): string | null {
  return value && Object.prototype.hasOwnProperty.call(TYPE_LABELS, value)
    ? TYPE_LABELS[value]
    : null;
}

export function expressionVocabularyLinks(
  ids: readonly string[] | null | undefined,
  wordById: ReadonlyMap<string, string>,
): { resolved: { id: string; word: string }[]; unresolvedIds: string[] } {
  const resolved: { id: string; word: string }[] = [];
  const unresolvedIds: string[] = [];

  for (const id of ids ?? []) {
    const word = wordById.get(id);
    if (word?.trim()) resolved.push({ id, word });
    else unresolvedIds.push(id);
  }

  return { resolved, unresolvedIds };
}

export function expressionSentenceCount(resources: readonly TopicExpressionResource[]): number {
  return resources.reduce(
    (count, block) => count + block.purposes.reduce((sum, purpose) => sum + purpose.examples.length, 0),
    0,
  );
}
