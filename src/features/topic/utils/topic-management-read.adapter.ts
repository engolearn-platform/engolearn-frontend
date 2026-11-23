import type {
  TopicExpressionResource,
  TopicQuizResource,
  TopicVocabularyResource,
} from "@features/topic/types/topic-management.types";
import type {
  TopicExpressionPurpose,
  TopicQuizGroup,
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

function occursExactlyOnce(text: string, answer: string): boolean {
  if (!answer) return false;
  const first = text.indexOf(answer);
  return first >= 0 && text.indexOf(answer, first + answer.length) === -1;
}

export function toQuizGroups(resources: TopicQuizResource[]): TopicQuizGroup[] | null {
  const groups: TopicQuizGroup[] = [];
  for (const [groupIndex, resource] of resources.entries()) {
    if (resource.quizType !== "FILL_BLANK" && resource.quizType !== "SITUATIONAL_CHOICE") return null;
    const questions: TopicQuizGroup["questions"] = [];
    for (const [questionIndex, question] of (resource.questions ?? []).entries()) {
      const id = `${resource.quizId || `quiz-${groupIndex}`}-question-${questionIndex}`;
      const options = (question.options ?? []).map((option) => ({
        label: option.label ?? "",
        textEn: option.textEn ?? "",
        isCorrect: option.isCorrect === true,
      }));
      if (question.options?.some((option) => !option.label || option.isCorrect == null)) return null;
      const correct = options.find((option) => option.isCorrect);
      if (!correct || options.filter((option) => option.isCorrect).length !== 1) return null;

      if (resource.quizType === "SITUATIONAL_CHOICE") {
        if (question.prompt == null) return null;
        questions.push({
          id,
          kind: "SITUATIONAL_CHOICE",
          prompt: question.prompt,
          audioUrl: question.audioUrl,
          options,
          correct: correct.label,
          explanationOk: question.explanationOk ?? "",
          explanationNg: question.explanationNg ?? "",
        });
      } else {
        const textEn = question.sentence?.textEn ?? "";
        if (!occursExactlyOnce(textEn, correct.textEn)) return null;
        const answerIndex = textEn.indexOf(correct.textEn);
        const sentenceWithBlank = `${textEn.slice(0, answerIndex)}___${textEn.slice(answerIndex + correct.textEn.length)}`;
        questions.push({
          id,
          kind: "FILL_BLANK",
          sentence: {
            textEn,
            meaningVi: question.sentence?.meaningVi ?? "",
            audioUrl: question.sentence?.audioUrl ?? null,
          },
          sentenceWithBlank,
          wordBank: options.map((option) => option.textEn),
          correctOption: correct.textEn,
          explanation: question.explanation,
          tips: question.tips ?? "",
        });
      }
    }
    groups.push({
      id: resource.quizId || `quiz-${groupIndex}`,
      quizType: resource.quizType,
      title: resource.title ?? "",
      instructions: resource.instructions ?? "",
      orderIndex: resource.orderIndex ?? groupIndex,
      questions,
    });
  }
  return groups;
}
