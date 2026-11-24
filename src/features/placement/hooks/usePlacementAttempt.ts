import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPlacementAttempt,
  savePlacementAnswer,
  submitPlacementAttempt,
} from "@features/placement/services/placement.service";
import type { PlacementAttemptDetail, PlacementSubmitResult } from "@features/placement/types/placement-attempt.types";
import { useFetch } from "@shared/hooks";
import { usePlacementCountdown } from "./usePlacementCountdown";

const SAVE_ERROR_MESSAGE =
  "Không thể lưu câu trả lời. Vui lòng kiểm tra kết nối và thử lại.";
const SUBMIT_ERROR_MESSAGE = "Không thể nộp bài. Vui lòng thử lại.";
const CLOCK_ERROR_MESSAGE = "Chưa xác nhận được thời gian với hệ thống. Đang thử kết nối lại…";

type AnswerMap = Record<string, string | null>;

export function usePlacementAttempt(attemptId: string, enabled: boolean) {
  const fetchAttempt = useCallback(
    (signal: AbortSignal) => getPlacementAttempt(attemptId, signal),
    [attemptId],
  );
  const { data: loadedData, loading, error, refetch } = useFetch(fetchAttempt, enabled);
  const [synchronized, setSynchronized] = useState<{
    source: PlacementAttemptDetail;
    snapshot: PlacementAttemptDetail;
  } | null>(null);
  const [clockError, setClockError] = useState<string | null>(null);
  const data = synchronized?.source === loadedData ? synchronized.snapshot : loadedData;

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<PlacementSubmitResult | null>(
    null,
  );

  const seededAttemptRef = useRef<string | null>(null);
  /** Latest value chosen in the UI (may not be persisted yet). */
  const desiredAnswersRef = useRef<AnswerMap>({});
  /** Last value the API confirmed — only updated after a successful save. */
  const savedAnswersRef = useRef<AnswerMap>({});
  const savingQuestionsRef = useRef<Set<string>>(new Set());
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const submittingRef = useRef(false);

  const remainingMs = usePlacementCountdown(
    data?.deadlineAt ?? null,
    data?.serverNow ?? null,
  );

  const isExpired =
    Boolean(data) && remainingMs <= 0 && data?.status === "IN_PROGRESS";

  useEffect(() => {
    if (!enabled || !loadedData || loadedData.attemptId !== attemptId
      || data?.status !== "IN_PROGRESS" || submitting || submitResult) return;

    const controller = new AbortController();
    let pending = false;
    const synchronize = async () => {
      if (pending || controller.signal.aborted || submittingRef.current) return;
      pending = true;
      try {
        // GET resolves the real server deadline; never POST merely because the local display reached zero.
        const current = await getPlacementAttempt(attemptId, controller.signal);
        if (!controller.signal.aborted && !submittingRef.current) {
          setSynchronized({ source: loadedData, snapshot: current });
          setClockError(null);
        }
      } catch {
        if (!controller.signal.aborted) setClockError(CLOCK_ERROR_MESSAGE);
      } finally {
        pending = false;
      }
    };
    const onVisible = () => { if (!document.hidden) void synchronize(); };
    const onOnline = () => { void synchronize(); };
    const timer = window.setInterval(() => {
      if (isExpired || !document.hidden) void synchronize();
    }, isExpired ? 5000 : 60000);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    if (isExpired) void synchronize();

    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [attemptId, enabled, loadedData, data?.status, isExpired, submitting, submitResult]);

  /**
   * Saves are serialized per question through a promise chain and always read
   * the latest desired value, so a slow response can never overwrite a newer
   * answer. The baseline is only advanced after the API confirms.
   */
  const enqueueSave = useCallback((targetAttemptId: string, questionId: string) => {
    if (savingQuestionsRef.current.has(questionId)) return;
    savingQuestionsRef.current.add(questionId);

    saveChainRef.current = saveChainRef.current.then(async () => {
      try {
        for (;;) {
          const desired = desiredAnswersRef.current[questionId] ?? null;
          const saved = savedAnswersRef.current[questionId] ?? null;
          if (desired === saved) break;

          await savePlacementAnswer(targetAttemptId, questionId, desired);
          savedAnswersRef.current[questionId] = desired;
          setSaveError(null);
        }
      } catch {
        setSaveError(SAVE_ERROR_MESSAGE);
      } finally {
        savingQuestionsRef.current.delete(questionId);
      }
    });
  }, []);

  useEffect(() => {
    if (!data || seededAttemptRef.current === data.attemptId) return;

    const initial: AnswerMap = {};
    data.answers.forEach((answer) => {
      initial[answer.questionId] = answer.selectedOptionId;
    });

    seededAttemptRef.current = data.attemptId;
    desiredAnswersRef.current = initial;
    savedAnswersRef.current = initial;
    savingQuestionsRef.current = new Set();
    saveChainRef.current = Promise.resolve();
    setAnswers(initial);
  }, [data]);

  useEffect(() => {
    if (!data || seededAttemptRef.current !== data.attemptId) return;

    desiredAnswersRef.current = answers;

    Object.keys(answers).forEach((questionId) => {
      const desired = answers[questionId] ?? null;
      const saved = savedAnswersRef.current[questionId] ?? null;
      if (desired !== saved) enqueueSave(data.attemptId, questionId);
    });
  }, [answers, data, enqueueSave]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value != null).length,
    [answers],
  );

  const setAnswer = useCallback(
    (questionId: string, optionId: string) => {
      if (isExpired || submittingRef.current || submitResult || data?.status !== "IN_PROGRESS") return;

      setAnswers((previous) => ({
        ...previous,
        [questionId]: previous[questionId] === optionId ? null : optionId,
      }));
    },
    [isExpired, submitResult, data?.status],
  );

  /** Waits for pending saves, retries unsaved answers once, then reports. */
  const flushPendingAnswers = useCallback(
    async (targetAttemptId: string): Promise<boolean> => {
      const isFullySaved = () =>
        Object.keys(desiredAnswersRef.current).every(
          (questionId) =>
            (desiredAnswersRef.current[questionId] ?? null) ===
            (savedAnswersRef.current[questionId] ?? null),
        );

      await saveChainRef.current;
      if (isFullySaved()) return true;

      Object.keys(desiredAnswersRef.current).forEach((questionId) => {
        if (
          (desiredAnswersRef.current[questionId] ?? null) !==
          (savedAnswersRef.current[questionId] ?? null)
        ) {
          enqueueSave(targetAttemptId, questionId);
        }
      });

      await saveChainRef.current;
      return isFullySaved();
    },
    [enqueueSave],
  );

  const submit = useCallback(async () => {
    if (!data || !loadedData || submittingRef.current || submitResult) return;

    const targetAttemptId = data.attemptId;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isExpired) {
        const current = await getPlacementAttempt(targetAttemptId);
        setSynchronized({ source: loadedData, snapshot: current });
        setClockError(null);
        return;
      }
      const flushed = await flushPendingAnswers(targetAttemptId);
      if (!flushed) {
        // Late PATCHes are rejected after BE finalizes; reconcile its status before blocking on dirty answers.
        const current = await getPlacementAttempt(targetAttemptId);
        if (current.status === "IN_PROGRESS") {
          setSubmitError(SAVE_ERROR_MESSAGE);
          return;
        }
      }

      const result = await submitPlacementAttempt(targetAttemptId);
      setSubmitResult(result);
    } catch {
      setSubmitError(SUBMIT_ERROR_MESSAGE);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [data, loadedData, isExpired, submitResult, flushPendingAnswers]);

  return {
    data,
    loading,
    error,
    refetch,
    answers,
    answeredCount,
    setAnswer,
    saveError,
    remainingMs,
    isExpired,
    submitting,
    submitError: submitError ?? (isExpired ? clockError : null),
    submitResult,
    submit,
  };
}
