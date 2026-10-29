import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { topicApi } from "@features/topic/services/topic-api.service";
import { assertQuiz, assertQuizAttempt } from "@features/topic/utils/topic-quiz";
import type { AttemptDto } from "@features/topic/types/topic-api.types";

export function useTopicQuizNavigation(attempt: AttemptDto | null, onAttempt: (value: AttemptDto) => void) {
  const read = useCallback(async (signal: AbortSignal) => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return null;
    const value = await topicApi.getQuizNavigation(attempt.attemptId, signal);
    assertQuizAttempt(value.attempt, attempt);
    const invalid = () => { throw Object.assign(new Error("Invalid quiz navigation"), { code: "CONTRACT_MISMATCH" }); };
    if (value.attempt.revision < attempt.revision || !Array.isArray(value.entries) || value.entries.length !== value.attempt.progress.totalQuizCount) invalid();
    const ids = new Set<string>();
    for (const entry of value.entries) {
      if (!entry.quizId || ids.has(entry.quizId) || !Number.isInteger(entry.index) || entry.index < 0 || !["FILL_BLANK", "SITUATIONAL_CHOICE"].includes(entry.type)) invalid();
      ids.add(entry.quizId);
      if (entry.status === "LOCKED") { if (entry.quiz !== null || entry.feedback !== null || entry.firstTryCorrect !== null) invalid(); }
      else {
        if (!["CURRENT", "COMPLETED"].includes(entry.status) || !entry.quiz) invalid();
        assertQuiz(entry.quiz!);
        if (entry.quiz!.quizId !== entry.quizId || entry.quiz!.type !== entry.type || entry.quiz!.index !== entry.index) invalid();
        if (entry.status === "CURRENT" ? entry.feedback !== null || entry.firstTryCorrect !== null : !entry.feedback || typeof entry.firstTryCorrect !== "boolean") invalid();
        if (entry.status === "CURRENT" && (entry.type !== value.attempt.position?.stage || entry.index !== value.attempt.position.itemIndex)) invalid();
        if (entry.feedback && (typeof entry.feedback.explanationVi !== "string" || !entry.quiz!.options.some(option => option.optionId === entry.feedback!.correctOptionId))) invalid();
      }
    }
    if (!signal.aborted) onAttempt(value.attempt);
    return value;
  }, [attempt, onAttempt]);
  return useFetch(read, attempt?.status === "IN_PROGRESS");
}
