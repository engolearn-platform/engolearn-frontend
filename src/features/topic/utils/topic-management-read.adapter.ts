import type {
  TopicExpressionResource,
  TopicVocabularyResource,
} from "@features/topic/types/topic-management.types";
import type {
  TopicExpressionPurpose,
  TopicVocabularyItem,
} from "@features/topic/types/topic-create.types";

const EXPRESSION_TYPES = ["BASIC_SUGGESTION", "POLITE_INQUIRY", "SLOT_PATTERN"] as const;

export function toVocabularyCardItem(
  resource: TopicVocabularyResource,
  index: number,
): Omit<TopicVocabularyItem, "pos"> & { pos: string } {
  const audioFile = resource.snapshot?.audioUrl ?? resource.snapshot?.audioUsUrl ?? resource.snapshot?.audioEnUrl ?? "";
  return {
    id: resource.vocabId || `vocabulary-${index}`,
    word: resource.snapshot?.word ?? "",
    pos: resource.snapshot?.pos ?? "",
    ipa: resource.snapshot?.phonetic ?? "",
    meaningVi: resource.snapshot?.describeVi ?? "",
    audioFile,
    audioUploaded: Boolean(audioFile),
    examples: (resource.samples ?? []).map((sample) => ({
      en: sample.textEn ?? "",
      vi: sample.textVi ?? "",
    })),
    collocations: (resource.collocations ?? []).map((collocation) => collocation.text ?? ""),
  };
}

export function toExpressionPurposes(
  resources: TopicExpressionResource[],
): TopicExpressionPurpose[] | null {
  const purposes: TopicExpressionPurpose[] = [];
  let exampleIndex = 0;
  for (const group of resources) {
    for (const [purposeIndex, purpose] of (group.purposes ?? []).entries()) {
      const examples = [];
      for (const example of purpose.examples ?? []) {
        if (!EXPRESSION_TYPES.includes(example.type as typeof EXPRESSION_TYPES[number])) return null;
        examples.push({
          id: `expression-${exampleIndex++}`,
          type: example.type as typeof EXPRESSION_TYPES[number],
          textEn: example.textEn ?? "",
          textVi: example.textVi ?? "",
          usageNote: example.usageNote ?? "",
          audioFile: example.audioUrl,
          linkedVocabIds: example.linkedVocabIds ?? [],
        });
      }
      purposes.push({
        id: `expression-purpose-${purposes.length}`,
        purposeEn: purpose.purposeEn ?? "",
        purposeVi: purpose.purposeVi ?? "",
        orderIndex: purpose.orderIndex ?? purposeIndex,
        examples,
      });
    }
  }
  return purposes;
}
