import { useCallback, useEffect, useState } from "react";
import { useFetch } from "@shared/hooks";
import { topicApi } from "@features/topic/services/topic-api.service";
import { assertLesson } from "@features/topic/utils/topic-lesson";
import { assertQuiz } from "@features/topic/utils/topic-quiz";

export function useTopicReview(topicId: string, attemptId: string) {
  const read = useCallback(async (signal: AbortSignal) => {
    const value = await topicApi.getItemReview(attemptId, signal);
    assertLesson(value.attempt, value.content, topicId, attemptId);
    const mismatch = () => { throw Object.assign(new Error("Invalid review response"), { code: "CONTRACT_MISMATCH" }); };
    if (value.attempt.status !== "COMPLETED" || !Array.isArray(value.quizzes) ||
      value.quizzes.length !== value.attempt.progress.totalQuizCount ||
      new Set(value.quizzes.map(entry => entry.quiz?.quizId)).size !== value.quizzes.length) mismatch();
    for (const entry of value.quizzes) {
      assertQuiz(entry.quiz);
      if (typeof entry.firstTryCorrect !== "boolean" || !entry.feedback || typeof entry.feedback.explanationVi !== "string" ||
        !entry.quiz.options.some(option => option.optionId === entry.feedback.correctOptionId)) mismatch();
    }
    return value;
  }, [topicId, attemptId]);
  const loaded = useFetch(read);
  const [accessKey] = useState(() => crypto.randomUUID());
  const [accessError, setAccessError] = useState<{ code?: string; status?: number } | null>(null);
  useEffect(() => {
    if (!loaded.data) return;
    const request = new AbortController();
    void topicApi.recordAttemptAccess(attemptId, { idempotencyKey: accessKey, signal: request.signal })
      .catch(failure => { if (!request.signal.aborted) setAccessError(failure as { code?: string; status?: number }); });
    return () => request.abort();
  }, [loaded.data, attemptId, accessKey]);
  return { ...loaded, accessError };
}
