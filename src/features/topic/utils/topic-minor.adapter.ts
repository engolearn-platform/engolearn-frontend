import type { TopicItemStepKey } from "@features/topic/types/topic-create.types";
import type {
  TopicContextResource,
  TopicExpressionResource,
  TopicItemManagementDetail,
  TopicQuizResource,
  TopicVocabularyResource,
} from "@features/topic/types/topic-management.types";
import type { TopicMinorChange } from "@features/topic/services/topic-management.service";

export type MinorComposeResult = { change: TopicMinorChange } | { error: string };

const MAJOR_MESSAGE = "Thay đổi này cần MAJOR vì ảnh hưởng cấu trúc hoặc ý nghĩa bài học. Nội dung bạn sửa vẫn được giữ; hãy quay lại danh sách Item để tiếp tục sau khi luồng MAJOR sẵn sàng.";

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function unsupported(): MinorComposeResult {
  return { error: MAJOR_MESSAGE };
}

function contextChange(original: TopicContextResource | null, edited: TopicContextResource | null): MinorComposeResult {
  if (!original || !edited || !same([original.prompt, original.scenarioDescription, original.durationSec, original.tips], [edited.prompt, edited.scenarioDescription, edited.durationSec, edited.tips]) || original.dialogue.length !== edited.dialogue.length) return unsupported();
  const context = structuredClone(original);
  for (let i = 0; i < original.dialogue.length; i++) {
    const before = original.dialogue[i];
    const after = edited.dialogue[i];
    if (!before || !after || !same([before.speaker, before.textEn], [after.speaker, after.textEn])) return unsupported();
    context.dialogue[i] = { ...context.dialogue[i], textVi: after.textVi, audioUrl: after.audioUrl };
  }
  return { change: { context } };
}

function vocabularyChange(original: TopicVocabularyResource[], edited: TopicVocabularyResource[]): MinorComposeResult {
  if (original.length !== edited.length) return unsupported();
  const vocabularies = structuredClone(original);
  for (let i = 0; i < original.length; i++) {
    const before = original[i]; const after = edited[i]; const target = vocabularies[i];
    if (!before || !after || !target || before.vocabId !== after.vocabId || before.senseId !== after.senseId || before.orderIndex !== after.orderIndex) return unsupported();
    if (Boolean(before.snapshot) !== Boolean(after.snapshot) || before.samples.length !== after.samples.length || !same(before.collocations, after.collocations) || !same(before.quickCheck, after.quickCheck) || before.tips !== after.tips) return unsupported();
    if (before.snapshot && after.snapshot && target.snapshot) {
      const changedSpelling = before.snapshot.word !== after.snapshot.word;
      if (changedSpelling && !(before.vocabId?.trim() && before.senseId?.trim())) return unsupported();
      if (!same([before.snapshot.pos ?? "", before.snapshot.sense], [after.snapshot.pos ?? "", after.snapshot.sense])) return unsupported();
      target.snapshot.word = after.snapshot.word;
      target.snapshot.describeVi = after.snapshot.describeVi;
      target.snapshot.phonetic = after.snapshot.phonetic;
      target.snapshot.audioUrl = after.snapshot.audioUrl;
      target.snapshot.audioEnUrl = after.snapshot.audioEnUrl;
      target.snapshot.audioUsUrl = after.snapshot.audioUsUrl;
    }
    for (let sampleIndex = 0; sampleIndex < before.samples.length; sampleIndex++) {
      const oldSample = before.samples[sampleIndex]; const newSample = after.samples[sampleIndex]; const targetSample = target.samples[sampleIndex];
      if (!oldSample || !newSample || !targetSample || !same([oldSample.textEn, oldSample.isManual], [newSample.textEn, newSample.isManual])) return unsupported();
      targetSample.textVi = newSample.textVi;
      targetSample.audioUrl = newSample.audioUrl;
    }
  }
  return { change: { vocabularies } };
}

function expressionChange(original: TopicExpressionResource[], edited: TopicExpressionResource[]): MinorComposeResult {
  if (original.length !== edited.length) return unsupported();
  const expressions = structuredClone(original);
  for (let blockIndex = 0; blockIndex < original.length; blockIndex++) {
    const beforeBlock = original[blockIndex]; const afterBlock = edited[blockIndex]; const targetBlock = expressions[blockIndex];
    if (!beforeBlock || !afterBlock || !targetBlock || beforeBlock.purposes.length !== afterBlock.purposes.length || beforeBlock.tips !== afterBlock.tips) return unsupported();
    for (let purposeIndex = 0; purposeIndex < beforeBlock.purposes.length; purposeIndex++) {
      const before = beforeBlock.purposes[purposeIndex]; const after = afterBlock.purposes[purposeIndex]; const target = targetBlock.purposes[purposeIndex];
      if (!before || !after || !target || !same([before.purposeEn, before.orderIndex, before.groupType], [after.purposeEn, after.orderIndex, after.groupType]) || before.examples.length !== after.examples.length) return unsupported();
      target.purposeVi = after.purposeVi;
      for (let exampleIndex = 0; exampleIndex < before.examples.length; exampleIndex++) {
        const oldExample = before.examples[exampleIndex]; const newExample = after.examples[exampleIndex]; const targetExample = target.examples[exampleIndex];
        if (!oldExample || !newExample || !targetExample || !same([oldExample.type, oldExample.label, oldExample.textEn, oldExample.linkedVocabIds], [newExample.type, newExample.label, newExample.textEn, newExample.linkedVocabIds])) return unsupported();
        targetExample.textVi = newExample.textVi;
        targetExample.usageNote = newExample.usageNote;
        targetExample.audioUrl = newExample.audioUrl;
      }
    }
  }
  return { change: { expressions } };
}

function quizChange(original: TopicQuizResource[], edited: TopicQuizResource[]): MinorComposeResult {
  if (original.length !== edited.length) return unsupported();
  const quizzes = structuredClone(original);
  for (let quizIndex = 0; quizIndex < original.length; quizIndex++) {
    const beforeQuiz = original[quizIndex]; const afterQuiz = edited[quizIndex]; const targetQuiz = quizzes[quizIndex];
    if (!beforeQuiz || !afterQuiz || !targetQuiz || !same([beforeQuiz.quizId, beforeQuiz.quizType, beforeQuiz.title, beforeQuiz.instructions, beforeQuiz.orderIndex], [afterQuiz.quizId, afterQuiz.quizType, afterQuiz.title, afterQuiz.instructions, afterQuiz.orderIndex]) || beforeQuiz.questions.length !== afterQuiz.questions.length) return unsupported();
    for (let questionIndex = 0; questionIndex < beforeQuiz.questions.length; questionIndex++) {
      const before = beforeQuiz.questions[questionIndex]; const after = afterQuiz.questions[questionIndex]; const target = targetQuiz.questions[questionIndex];
      if (!before || !after || !target || !same([before.prompt, before.options, before.correct, before.explanationOk, before.explanationNg, before.tips, before.quizData, before.answerData], [after.prompt, after.options, after.correct, after.explanationOk, after.explanationNg, after.tips, after.quizData, after.answerData])) return unsupported();
      target.explanation = after.explanation;
      if (Boolean(before.sentence) !== Boolean(after.sentence)) return unsupported();
      if (before.sentence && after.sentence && target.sentence) {
        if (!same([before.sentence.textEn, before.sentence.meaningVi, before.sentence.source, before.sentence.externalId], [after.sentence.textEn, after.sentence.meaningVi, after.sentence.source, after.sentence.externalId])) return unsupported();
        target.sentence.audioUrl = after.sentence.audioUrl;
        target.sentence.audioUrlSlow = after.sentence.audioUrlSlow;
      }
      target.audioUrl = after.audioUrl;
    }
  }
  return { change: { quizzes } };
}

export function composeMinorChange(section: TopicItemStepKey, original: TopicItemManagementDetail, edited: unknown): MinorComposeResult {
  switch (section) {
    case "context": return contextChange(original.context, edited as TopicContextResource | null);
    case "vocabulary": return vocabularyChange(original.vocabularies, edited as TopicVocabularyResource[]);
    case "expressions": return expressionChange(original.expressions, edited as TopicExpressionResource[]);
    case "quiz": return quizChange(original.quizzes, edited as TopicQuizResource[]);
  }
}

export const MINOR_REQUIRES_MAJOR_MESSAGE = MAJOR_MESSAGE;
