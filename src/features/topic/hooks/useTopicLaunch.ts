import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { topicApi } from "@features/topic/services/topic-api.service";
import { clearTopicGeneration, runTopicMutation } from "@features/topic/services/topic-mutation-journal";
import { useTopicViewer } from "./topic-viewer.context";
import { topicAttemptPath, topicDetailPath, topicErrorMessage } from "@features/topic/utils/topic-catalog";
import type { TopicDetailDto, TopicItemSummaryDto } from "@features/topic/types/topic-api.types";

export type TopicLaunchAction = "start" | "continue" | "review" | "retry" | "resumeRetry" | "reset" | "resumeTopicRetry";
type Selection = { action: TopicLaunchAction; item?: TopicItemSummaryDto; observedRetrySessionId: string | null; generation: number };
export function useTopicLaunch(detail: TopicDetailDto | null, origin: string, refresh: () => void) {
  const viewer = useTopicViewer();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Selection | null>(null);
  const controller = useRef<AbortController | null>(null);
  const lock = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  async function perform(selection: Selection) {
    if (!detail || lock.current) return;
    const { action, item } = selection;
    if (action === "review" && item?.completedAttemptId) {
      navigate(topicAttemptPath(detail.topicId, item.completedAttemptId, origin, "review")); return;
    }
    const existing = action === "continue" ? item?.learningAttempt : action === "resumeRetry" ? item?.retryAttempt : null;
    if (existing) { navigate(topicAttemptPath(detail.topicId, existing.attemptId, origin)); return; }
    if (action === "resumeTopicRetry" && detail.retrySession?.currentAttemptId) {
      navigate(topicAttemptPath(detail.topicId, detail.retrySession.currentAttemptId, origin)); return;
    }
    if (!["start", "retry", "reset", "resumeRetry", "resumeTopicRetry"].includes(action)) return;
    setError(""); lock.current = true; setBusy(true);
    const request = new AbortController();
    controller.current = request;
    const resuming = action === "resumeRetry" || action === "resumeTopicRetry";
    const replaceRetrySessionId = null;
    const targetItemId = action === "resumeTopicRetry" ? detail.retrySession?.nextTopicItemId : item?.topicItemId;
    const retrySessionId = resuming ? selection.observedRetrySessionId : null;
    try {
      const identity = { learnerId: viewer.learnerId, topicId: detail.topicId, generation: selection.generation };
      if (action === "reset") {
        const receipt = await runTopicMutation({ identity, scope: JSON.stringify([viewer.learnerId, detail.topicId, "reset", selection.generation]), run: idempotencyKey => topicApi.resetTopic(detail.topicId, { generation: selection.generation }, { idempotencyKey, signal: request.signal }) });
        if (request.signal.aborted) return;
        if (receipt.topicId !== detail.topicId || receipt.generation !== selection.generation + 1) throw Object.assign(new Error("Invalid reset receipt"), { code: "CONTRACT_MISMATCH" });
        clearTopicGeneration(identity, detail.items.flatMap(value => [value.learningAttempt?.attemptId, value.retryAttempt?.attemptId, value.completedAttemptId].filter((id): id is string => !!id)));
        refresh();
        navigate(topicDetailPath(detail.topicId, origin), { replace: true, state: { topicNotice: "Đã xoá tiến độ và kết quả chủ đề. Bạn có thể bắt đầu học lại." } });
        return;
      }
      const body = {
        mode: action === "start" ? "LEARN" as const : "RETRY" as const,
        retrySessionId,
        replaceRetrySessionId,
      };
      const attemptId = await runTopicMutation({
        identity,
        scope: JSON.stringify([viewer.learnerId, detail.topicId, selection.generation, targetItemId, action, body]),
        run: async idempotencyKey => {
          const options = { idempotencyKey, signal: request.signal };
          if (!targetItemId || body.mode === undefined) throw new Error("Missing topic item");
          const attempt = await topicApi.startAttempt(targetItemId, { mode: body.mode, retrySessionId, replaceRetrySessionId }, options);
          if (!attempt.attemptId || attempt.topicItemId !== targetItemId || attempt.topicId !== detail.topicId ||
            body.mode === "RETRY" && (!attempt.retrySessionId || resuming && attempt.retrySessionId !== retrySessionId)) throw Object.assign(new Error("Invalid attempt result"), { code: "CONTRACT_MISMATCH" });
          return attempt.attemptId;
        },
      });
      if (!request.signal.aborted) navigate(topicAttemptPath(detail.topicId, attemptId, origin));
    } catch (failure) {
      if (!request.signal.aborted) {
        const problem = failure as { code?: string; status?: number };
        setError(topicErrorMessage(problem));
        if (problem.status === 409 || problem.status === 422) refresh();
      }
    } finally {
      lock.current = false;
      if (!request.signal.aborted) setBusy(false);
    }
  }
  const choose = (action: TopicLaunchAction, item?: TopicItemSummaryDto) => {
    if (!detail || busy) return;
    const selection = { action, item, generation: detail.generation ?? 0, observedRetrySessionId: detail.retrySession?.status === "IN_PROGRESS" ? detail.retrySession.retrySessionId : null };
    if (action === "retry" || action === "reset") setConfirmation(selection);
    else void perform(selection);
  };
  return { busy, error, confirmation, choose, cancel: () => setConfirmation(null), confirm: () => {
    const selection = confirmation; setConfirmation(null); if (selection) void perform(selection);
  } };
}
