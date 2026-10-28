import type { AttemptDto, QuizDto, QuizAnswerDto } from "@features/topic/types/topic-api.types";

function mismatch(): never {
  throw Object.assign(new Error("Invalid quiz response"), { code: "CONTRACT_MISMATCH" });
}

export function assertQuiz(quiz: QuizDto): void {
  if (!quiz || typeof quiz.quizId !== "string" || !quiz.quizId || typeof quiz.title !== "string" ||
    !Number.isInteger(quiz.index) || !Number.isInteger(quiz.totalInType) || quiz.index < 0 || quiz.index >= quiz.totalInType ||
    !Array.isArray(quiz.options) || !quiz.options.every(option => typeof option.optionId === "string" && option.optionId && typeof option.text === "string") ||
    new Set(quiz.options.map(option => option.optionId)).size !== quiz.options.length) mismatch();
  if (quiz.type === "FILL_BLANK") {
    if (typeof quiz.sentenceBefore !== "string" || typeof quiz.sentenceAfter !== "string" || quiz.options.length < 4 || quiz.options.length > 6) mismatch();
  } else if (quiz.type === "SITUATIONAL_CHOICE") {
    if (typeof quiz.questionVi !== "string" || quiz.situationVi !== null && typeof quiz.situationVi !== "string" || quiz.options.length !== 4) mismatch();
  } else mismatch();
}

export function assertQuizAttempt(value: AttemptDto, expected: Pick<AttemptDto, "attemptId" | "topicId"> & Partial<Pick<AttemptDto, "topicItemId" | "topicItemVersionId" | "version">>): void {
  if (!value || value.attemptId !== expected.attemptId || value.topicId !== expected.topicId ||
    typeof value.topicItemId !== "string" || !value.topicItemId || typeof value.topicItemVersionId !== "string" || !value.topicItemVersionId ||
    !Number.isInteger(value.version) || value.version < 1 || !["LEARN", "RETRY"].includes(value.mode) ||
    expected.topicItemId !== undefined && value.topicItemId !== expected.topicItemId ||
    expected.topicItemVersionId !== undefined && value.topicItemVersionId !== expected.topicItemVersionId ||
    expected.version !== undefined && value.version !== expected.version ||
    !Number.isInteger(value.revision) || value.revision < 0 || !value.progress ||
    ![value.progress.completedStepCount, value.progress.totalStepCount, value.progress.completedQuizCount, value.progress.totalQuizCount,
      value.progress.learnedVocabularyCount, value.progress.learnedExpressionCount].every(count => Number.isInteger(count) && count >= 0) ||
    !Number.isFinite(value.progress.percent) || value.progress.percent < 0 || value.progress.percent > 100 ||
    (value.status === "COMPLETED" ? value.position !== null || !value.completedAt :
      value.status !== "IN_PROGRESS" || !value.position || !Number.isInteger(value.position.itemIndex) || value.position.itemIndex < 0 ||
      !["CONTEXT", "VOCAB", "EXPRESSIONS", "FILL_BLANK", "SITUATIONAL_CHOICE"].includes(value.position.stage))) mismatch();
}

export function assertQuizAnswer(answer: QuizAnswerDto, quiz: QuizDto, expected: AttemptDto, revision: number, optionId: string): void {
  assertQuizAttempt(answer?.attempt, expected);
  if (answer.quizId !== quiz.quizId || typeof answer.isCorrect !== "boolean" || answer.attempt.revision <= revision) mismatch();
  if (!answer.isCorrect) {
    if (answer.feedback !== null || answer.attempt.status !== "IN_PROGRESS" ||
      answer.attempt.position?.stage !== quiz.type || answer.attempt.position.itemIndex !== quiz.index) mismatch();
  } else {
    const feedback = answer.feedback;
    if (!feedback || typeof feedback.explanationVi !== "string" ||
      feedback.correctOptionId !== optionId ||
      !quiz.options.some(option => option.optionId === feedback.correctOptionId) ||
      answer.attempt.status === "IN_PROGRESS" && (answer.attempt.position?.stage !== quiz.type &&
        !(quiz.type === "FILL_BLANK" && answer.attempt.position?.stage === "SITUATIONAL_CHOICE") ||
        answer.attempt.position?.stage === quiz.type && answer.attempt.position.itemIndex <= quiz.index)) mismatch();
  }
}
