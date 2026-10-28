import { useCallback, useEffect, useRef, useState } from "react";
import { useFetch } from "@shared/hooks";
import { topicApi } from "@features/topic/services/topic-api.service";
import { runTopicMutation } from "@features/topic/services/topic-mutation-journal";
import { assertLesson, isContentPosition, samePosition } from "@features/topic/utils/topic-lesson";
import { topicErrorMessage } from "@features/topic/utils/topic-catalog";
import { useTopicViewer } from "./topic-viewer.context";
import type { AttemptDto, PositionDto } from "@features/topic/types/topic-api.types";
import { assertQuizAttempt } from "@features/topic/utils/topic-quiz";

export function useTopicLesson(topicId: string, attemptId: string) {
  const viewer = useTopicViewer();
  const read = useCallback(async (signal: AbortSignal) => {
    const attempt = await topicApi.getAttempt(attemptId, signal);
    assertQuizAttempt(attempt, { attemptId, topicId });
    // Completed content is only available through review, which belongs to slice C.
    if (attempt.status === "COMPLETED") return { attempt, content: null };
    const content = await topicApi.getAttemptContent(attemptId, signal);
    assertLesson(attempt, content, topicId, attemptId);
    return { attempt, content };
  }, [topicId, attemptId]);
  const result = useFetch(read);
  const [updated, setUpdated] = useState<AttemptDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [accessError, setAccessError] = useState(false);
  const [accessKey] = useState(() => crypto.randomUUID());
  const mutation = useRef<AbortController | null>(null);
  const locked = useRef(false);
  useEffect(() => () => mutation.current?.abort(), []);
  useEffect(() => {
    if (!result.data) return;
    const controller = new AbortController();
    void topicApi.recordAttemptAccess(attemptId, { idempotencyKey: accessKey, signal: controller.signal })
      .catch(() => { if (!controller.signal.aborted) setAccessError(true); });
    return () => controller.abort();
  }, [result.data, attemptId, accessKey]);
  const attempt = result.data
    ? (updated && updated.revision > result.data.attempt.revision ? updated : result.data.attempt) : null;
  const updateAttempt = useCallback((value: AttemptDto) => {
    setUpdated(previous => !previous || value.revision > previous.revision ? value : previous);
  }, []);

  const advance = async (source: PositionDto): Promise<AttemptDto | null> => {
    if (!attempt || !result.data?.content || locked.current || result.loading || attempt.status !== "IN_PROGRESS" ||
      !samePosition(source, attempt.position) || !isContentPosition(source)) return null;
    const content = result.data.content;
    locked.current = true;
    setBusy(true);
    setMutationError("");
    const controller = new AbortController();
    mutation.current = controller;
    const body = { revision: attempt.revision, stage: source.stage, itemIndex: source.itemIndex };
    try {
      const next = await runTopicMutation({
        scope: JSON.stringify([viewer.learnerId, attemptId, "advance", body]),
        run: async idempotencyKey => {
          const value = await topicApi.advanceContent(attemptId, body, { idempotencyKey, signal: controller.signal });
          assertLesson(value, content, topicId, attemptId);
          if (value.revision <= attempt.revision) throw Object.assign(new Error("Revision did not advance"), { code: "CONTRACT_MISMATCH" });
          return value;
        },
      });
      if (controller.signal.aborted) return null;
      setUpdated(next);
      return next;
    } catch (error) {
      if (!controller.signal.aborted) {
        const problem = error as { status?: number; code?: string };
        setMutationError(problem.status === 409 ? "Tiến độ đã thay đổi. Đang tải lại vị trí mới nhất; vui lòng kiểm tra trước khi tiếp tục." : topicErrorMessage(problem));
        if (problem.status === 409) result.refetch();
      }
      return null;
    } finally {
      locked.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  return { ...result, attempt, content: result.data?.content ?? null, busy, mutationError, accessError, advance, updateAttempt };
}
