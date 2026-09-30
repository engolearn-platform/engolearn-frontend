import { useMemo, useState } from "react";
import type {
  QuizType,
  TopicFillBlankQuestion,
  TopicItemOverview,
  TopicQuizGroup,
  TopicQuizQuestion,
  TopicSituationalQuestion,
} from "@features/topic/types/topic-create.types";
import {
  TOPIC_ITEMS_OVERVIEW_MOCK,
  TOPIC_QUIZ_MIN_QUESTIONS,
  TOPIC_QUIZ_MOCK_CHOOSING_FOOD,
  TOPIC_QUIZ_TIPS_MAX,
} from "@features/topic/types/topic-create.types";

let questionSequence = 100;

function createQuestionId(): string {
  questionSequence += 1;
  return `quiz-custom-${questionSequence}`;
}

const OPTION_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function labelAt(index: number): string {
  return OPTION_LABELS[index] ?? `OPT${index + 1}`;
}

/**
 * Draft upsert câu situational từ dialog (không chứa title/instructions
 * của quiz — dialog chỉ biên soạn thông tin của question).
 * `optionTexts` là nội dung từng đáp án theo thứ tự hiển thị;
 * label A/B/C… do hook tự gán, đáp án đúng chọn bằng `correctIndex`.
 */
export interface SituationalQuestionUpsert {
  kind: "SITUATIONAL_CHOICE";
  prompt: string;
  audioUrl: string | null;
  optionTexts: string[];
  correctIndex: number;
  explanationOk: string;
  explanationNg: string;
}

/** Draft upsert câu fill-blank từ dialog (chỉ thông tin của question). */
export interface FillBlankQuestionUpsert {
  kind: "FILL_BLANK";
  textEn: string;
  meaningVi: string;
  audioUrl: string | null;
  sentenceWithBlank: string;
  wordBank: string[];
  correctOption: string;
  explanation: string | null;
  tips: string;
}

export type QuizQuestionUpsert =
  | SituationalQuestionUpsert
  | FillBlankQuestionUpsert;

/** Chuyển question đã lưu thành draft cho dialog ở chế độ edit. */
export function toQuestionUpsert(
  question: TopicQuizQuestion,
): QuizQuestionUpsert {
  if (question.kind === "SITUATIONAL_CHOICE") {
    const correctIndex = Math.max(
      0,
      question.options.findIndex((option) => option.label === question.correct),
    );
    return {
      kind: "SITUATIONAL_CHOICE",
      prompt: question.prompt,
      audioUrl: question.audioUrl,
      optionTexts: question.options.map((option) => option.textEn),
      correctIndex,
      explanationOk: question.explanationOk,
      explanationNg: question.explanationNg,
    };
  }
  return {
    kind: "FILL_BLANK",
    textEn: question.sentence.textEn,
    meaningVi: question.sentence.meaningVi,
    audioUrl: question.sentence.audioUrl,
    sentenceWithBlank: question.sentenceWithBlank,
    wordBank: [...question.wordBank],
    correctOption: question.correctOption,
    explanation: question.explanation,
    tips: question.tips,
  };
}

function isSituationalValid(question: TopicSituationalQuestion): boolean {
  if (question.prompt.trim().length === 0) return false;
  if (question.options.length < 2) return false;
  if (!question.options.every((option) => option.textEn.trim().length > 0)) {
    return false;
  }
  const correctOptions = question.options.filter(
    (option) => option.isCorrect && option.label === question.correct,
  );
  if (correctOptions.length !== 1) return false;
  return (
    question.explanationOk.trim().length > 0 &&
    question.explanationNg.trim().length > 0
  );
}

function isFillBlankValid(question: TopicFillBlankQuestion): boolean {
  if (question.sentence.textEn.trim().length === 0) return false;
  if (question.sentence.meaningVi.trim().length === 0) return false;
  if (!question.sentenceWithBlank.includes("___")) return false;
  if (question.wordBank.length < 2) return false;
  if (!question.wordBank.includes(question.correctOption)) return false;
  return question.tips.length <= TOPIC_QUIZ_TIPS_MAX;
}

export function isQuizQuestionValid(question: TopicQuizQuestion): boolean {
  return question.kind === "SITUATIONAL_CHOICE"
    ? isSituationalValid(question)
    : isFillBlankValid(question);
}

function buildSituationalQuestion(
  draft: SituationalQuestionUpsert,
): TopicSituationalQuestion | null {
  const prompt = draft.prompt.trim();
  const optionTexts = draft.optionTexts
    .map((text) => text.trim())
    .filter((text) => text.length > 0);
  const explanationOk = draft.explanationOk.trim();
  const explanationNg = draft.explanationNg.trim();
  if (
    !prompt ||
    optionTexts.length < 2 ||
    !explanationOk ||
    !explanationNg
  ) {
    return null;
  }
  const safeIndex = Math.min(Math.max(draft.correctIndex, 0), optionTexts.length - 1);
  const correct = labelAt(safeIndex);
  return {
    id: createQuestionId(),
    kind: "SITUATIONAL_CHOICE",
    prompt,
    audioUrl: draft.audioUrl?.trim() ? draft.audioUrl.trim() : null,
    options: optionTexts.map((textEn, index) => ({
      label: labelAt(index),
      textEn,
      isCorrect: labelAt(index) === correct,
    })),
    correct,
    explanationOk,
    explanationNg,
  };
}

function buildFillBlankQuestion(
  draft: FillBlankQuestionUpsert,
): TopicFillBlankQuestion | null {
  const textEn = draft.textEn.trim();
  const meaningVi = draft.meaningVi.trim();
  const sentenceWithBlank = draft.sentenceWithBlank.trim();
  const wordBank = [...new Set(draft.wordBank.map((word) => word.trim()))].filter(
    (word) => word.length > 0,
  );
  const correctOption = draft.correctOption.trim();
  const tips = draft.tips.trim();
  if (
    !textEn ||
    !meaningVi ||
    !sentenceWithBlank.includes("___") ||
    wordBank.length < 2 ||
    !wordBank.includes(correctOption) ||
    tips.length > TOPIC_QUIZ_TIPS_MAX
  ) {
    return null;
  }
  return {
    id: createQuestionId(),
    kind: "FILL_BLANK",
    sentence: {
      textEn,
      meaningVi,
      audioUrl: draft.audioUrl?.trim() ? draft.audioUrl.trim() : null,
    },
    sentenceWithBlank,
    wordBank,
    correctOption,
    explanation: draft.explanation?.trim() ? draft.explanation.trim() : null,
    tips,
  };
}

export function useTopicItemQuizForm(itemId: string | undefined) {
  const item: TopicItemOverview | undefined = useMemo(
    () => TOPIC_ITEMS_OVERVIEW_MOCK.find((entry) => entry.id === itemId),
    [itemId],
  );

  const [groups, setGroups] = useState<TopicQuizGroup[]>(
    TOPIC_QUIZ_MOCK_CHOOSING_FOOD,
  );

  const totalQuestions = groups.reduce(
    (sum, group) => sum + group.questions.length,
    0,
  );

  const addQuestionOfType = (
    quizType: QuizType,
    draft: QuizQuestionUpsert,
  ): boolean => {
    if (draft.kind !== quizType) return false;
    const built =
      draft.kind === "SITUATIONAL_CHOICE"
        ? buildSituationalQuestion(draft)
        : buildFillBlankQuestion(draft);
    if (!built) return false;
    const question: TopicQuizQuestion = built;
    let added = false;
    setGroups((prev) =>
      prev.map((group) => {
        if (group.quizType !== quizType) return group;
        added = true;
        return { ...group, questions: [...group.questions, question] };
      }),
    );
    return added;
  };

  const patchQuestion = (
    questionId: string,
    draft: QuizQuestionUpsert,
  ): void => {
    setGroups((prev) =>
      prev.map((group) => {
        const found = group.questions.some(
          (question) => question.id === questionId,
        );
        if (!found) return group;
        return {
          ...group,
          questions: group.questions.map((question) => {
            if (question.id !== questionId) return question;
            // Loại quiz bị khóa khi edit — chỉ patch khi cùng kind.
            if (question.kind !== draft.kind) return question;
            if (
              question.kind === "SITUATIONAL_CHOICE" &&
              draft.kind === "SITUATIONAL_CHOICE"
            ) {
              const prompt = draft.prompt.trim();
              const optionTexts = draft.optionTexts
                .map((text) => text.trim())
                .filter((text) => text.length > 0);
              if (
                !prompt ||
                optionTexts.length < 2 ||
                !draft.explanationOk.trim() ||
                !draft.explanationNg.trim()
              ) {
                return question;
              }
              const safeIndex = Math.min(
                Math.max(draft.correctIndex, 0),
                optionTexts.length - 1,
              );
              const correct = labelAt(safeIndex);
              return {
                ...question,
                prompt,
                audioUrl: draft.audioUrl?.trim()
                  ? draft.audioUrl.trim()
                  : null,
                options: optionTexts.map((textEn, index) => ({
                  label: labelAt(index),
                  textEn,
                  isCorrect: labelAt(index) === correct,
                })),
                correct,
                explanationOk: draft.explanationOk.trim(),
                explanationNg: draft.explanationNg.trim(),
              };
            }
            if (
              question.kind === "FILL_BLANK" &&
              draft.kind === "FILL_BLANK"
            ) {
              const textEn = draft.textEn.trim();
              const meaningVi = draft.meaningVi.trim();
              const sentenceWithBlank = draft.sentenceWithBlank.trim();
              const wordBank = [
                ...new Set(
                  draft.wordBank.map((word) => word.trim()),
                ),
              ].filter((word) => word.length > 0);
              const correctOption = draft.correctOption.trim();
              const tips = draft.tips.trim();
              if (
                !textEn ||
                !meaningVi ||
                !sentenceWithBlank.includes("___") ||
                wordBank.length < 2 ||
                !wordBank.includes(correctOption) ||
                tips.length > TOPIC_QUIZ_TIPS_MAX
              ) {
                return question;
              }
              return {
                ...question,
                sentence: {
                  textEn,
                  meaningVi,
                  audioUrl: draft.audioUrl?.trim()
                    ? draft.audioUrl.trim()
                    : null,
                },
                sentenceWithBlank,
                wordBank,
                correctOption,
                explanation: draft.explanation?.trim()
                  ? draft.explanation.trim()
                  : null,
                tips,
              };
            }
            return question;
          }),
        };
      }),
    );
  };

  const removeQuestion = (questionId: string) =>
    setGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.filter(
          (question) => question.id !== questionId,
        ),
      })),
    );

  const findQuestion = (
    questionId: string,
  ): { group: TopicQuizGroup; question: TopicQuizQuestion } | undefined => {
    for (const group of groups) {
      const question = group.questions.find((entry) => entry.id === questionId);
      if (question) return { group, question };
    }
    return undefined;
  };

  const isValid =
    groups.length > 0 &&
    groups.every(
      (group) =>
        group.questions.length >= TOPIC_QUIZ_MIN_QUESTIONS &&
        group.questions.every(isQuizQuestionValid),
    );

  return {
    item,
    groups,
    totalQuestions,
    minQuestions: TOPIC_QUIZ_MIN_QUESTIONS,
    addQuestionOfType,
    patchQuestion,
    removeQuestion,
    findQuestion,
    isValid,
  };
}
