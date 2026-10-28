import { useCallback, useEffect, useRef, useState } from "react";
import { useFetch } from "@shared/hooks";
import { topicApi } from "@features/topic/services/topic-api.service";
import { clearTopicPendingAction, readTopicPendingAction, runTopicMutation, saveTopicPendingAction } from "@features/topic/services/topic-mutation-journal";
import { isContentPosition } from "@features/topic/utils/topic-lesson";
import { assertQuiz, assertQuizAnswer, assertQuizAttempt } from "@features/topic/utils/topic-quiz";
import { topicErrorMessage } from "@features/topic/utils/topic-catalog";
import type { AnswerQuizRequestDto, AttemptDto, QuizDto, QuizFeedbackDto } from "@features/topic/types/topic-api.types";

interface PendingAnswer { quiz: QuizDto; body: AnswerQuizRequestDto }
interface QuizOptions {
  attempt: AttemptDto | null;
  learnerId: string | null;
  attemptId: string;
  onAttempt: (attempt: AttemptDto) => void;
  onHidden: () => void;
  refreshLesson: () => void;
}

export function useTopicQuiz({ attempt, learnerId, attemptId, onAttempt, onHidden, refreshLesson }: QuizOptions) {
  const scope = JSON.stringify([learnerId, attemptId, "quiz-answer"]);
  const [restored] = useState(() => {
    try {
      const value = readTopicPendingAction(scope) as PendingAnswer | null;
      if (value) {
        assertQuiz(value.quiz);
        if (!value.body || !Number.isInteger(value.body.revision) || value.body.revision < 0 ||
          !value.quiz.options.some(option => option.optionId === value.body.optionId)) throw new Error("Invalid saved answer");
      }
      return { pending: value ? { quiz: value.quiz, body: { revision: value.body.revision, optionId: value.body.optionId } } : null, error: "" };
    } catch { return { pending: null, error: "Không khôi phục được yêu cầu đang chờ trên trình duyệt. Vui lòng kiểm tra lưu trữ và tải lại trước khi trả lời tiếp." }; }
  });
  const [pending, setPending] = useState<PendingAnswer | null>(restored.pending);
  const [feedback, setFeedback] = useState<{ quiz: QuizDto; value: QuizFeedbackDto } | null>(null);
  const [selected, setSelected] = useState<string | null>(restored.pending?.body.optionId ?? null);
  const [wrongQuizId, setWrongQuizId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(restored.error);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const active = !!attempt && attempt.status === "IN_PROGRESS" && !!attempt.position && !isContentPosition(attempt.position) && !feedback && !pending && !restored.error;
  const read = useCallback(async (signal: AbortSignal) => {
    if (!attempt || !active) return null;
    try {
      const value = await topicApi.getCurrentQuiz(attemptId, signal);
      assertQuizAttempt(value.attempt, attempt);
      if (value.attempt.revision < attempt.revision) throw Object.assign(new Error("Stale quiz response"), { code: "CONTRACT_MISMATCH" });
      if (value.attempt.status === "IN_PROGRESS") {
        if (!value.quiz) throw Object.assign(new Error("Completion is not available on BE"), { code: "QUIZ_COMPLETION_UNAVAILABLE" });
        assertQuiz(value.quiz);
        if (value.quiz.type !== value.attempt.position?.stage || value.quiz.index !== value.attempt.position.itemIndex) {
          throw Object.assign(new Error("Quiz does not match frontier"), { code: "CONTRACT_MISMATCH" });
        }
      } else if (value.quiz !== null) throw Object.assign(new Error("Completed attempt exposes quiz"), { code: "CONTRACT_MISMATCH" });
      if (!signal.aborted) onAttempt(value.attempt);
      return value;
    } catch (failure) {
      const problem = failure as { code?: string; status?: number };
      if (!signal.aborted && problem.status === 410 && problem.code === "ITEM_HIDDEN") onHidden();
      throw failure;
    }
  }, [attempt, attemptId, active, onAttempt, onHidden]);
  const result = useFetch(read, active);
  const quiz = feedback?.quiz ?? pending?.quiz ?? (active && result.data?.attempt.revision === attempt?.revision ? result.data.quiz : null);

  const answer = async (optionId?: string) => {
    if (lock.current || !attempt || restored.error || feedback) return;
    const action = pending ?? (quiz && optionId ? { quiz, body: { revision: attempt.revision, optionId } } : null);
    if (!action || !pending && (!active || result.loading || !quiz?.options.some(option => option.optionId === optionId))) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setWrongQuizId(null);
    setSelected(action.body.optionId);
    const abort = new AbortController();
    controller.current = abort;
    try {
      saveTopicPendingAction(scope, action);
      setPending(action);
      const value = await runTopicMutation({
        scope: JSON.stringify([learnerId, attemptId, "answer", action.quiz.quizId, action.body]),
        run: async idempotencyKey => {
          const response = await topicApi.answerQuiz(attemptId, action.quiz.quizId, action.body, { idempotencyKey, signal: abort.signal });
          assertQuizAnswer(response, action.quiz, attempt, action.body.revision, action.body.optionId);
          return response;
        },
      });
      if (abort.signal.aborted) return;
      clearTopicPendingAction(scope);
      setPending(null);
      onAttempt(value.attempt);
      if (value.attempt.revision < attempt.revision) {
        setSelected(null);
        refreshLesson();
      } else if (value.isCorrect && value.feedback) setFeedback({ quiz: action.quiz, value: value.feedback });
      else setWrongQuizId(action.quiz.quizId);
    } catch (failure) {
      if (abort.signal.aborted) return;
      const problem = failure as { code?: string; status?: number };
      if (problem.status && problem.status >= 400 && problem.status < 500) {
        clearTopicPendingAction(scope);
        setPending(null);
        setSelected(null);
        if (problem.status === 410 && problem.code === "ITEM_HIDDEN") { setFeedback(null); onHidden(); return; }
        if (problem.status === 409) {
          setFeedback(null);
          refreshLesson();
          result.refetch();
        }
        setError(topicErrorMessage(problem));
      } else {
        setError(topicErrorMessage(problem) + " Chưa xác định máy chủ đã nhận đáp án hay chưa. Thử lại sẽ gửi đúng yêu cầu cũ; bạn cũng có thể tải lại trang.");
      }
    } finally {
      lock.current = false;
      if (!abort.signal.aborted) setBusy(false);
    }
  };

  const dismissFeedback = () => {
    setFeedback(null);
    setSelected(null);
    setWrongQuizId(null);
    setError("");
    // Refresh frontier even when another tab progressed after this receipt.
    refreshLesson();
  };
  return { quiz, feedback: feedback?.value ?? null, pending: !!pending, busy, selected, wrong: !!quiz && wrongQuizId === quiz.quizId, error,
    readError: active ? result.error : null, loading: active && (result.loading || !result.data && !result.error),
    blocked: !!restored.error, answer, dismissFeedback, refetch: () => { refreshLesson(); result.refetch(); } };
}
