import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { topicApi } from "@features/topic/services/topic-api.service";
import { runTopicMutation } from "@features/topic/services/topic-mutation-journal";
import { useTopicViewer } from "./topic-viewer.context";
import { topicAttemptPath, topicErrorMessage } from "@features/topic/utils/topic-catalog";
import type { TopicDetailDto, TopicItemSummaryDto } from "@features/topic/types/topic-api.types";

export type TopicLaunchAction = "start" | "continue" | "review" | "retry" | "resumeRetry" | "restartRetry" | "topicRetry";
type Selection = { action: TopicLaunchAction; item?: TopicItemSummaryDto };
export function useTopicLaunch(detail: TopicDetailDto | null, origin: string, refresh: () => void) {
  const viewer = useTopicViewer();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Selection | null>(null);
  const controller = useRef<AbortController | null>(null);
  const lock = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  async function perform(selection: Selection, replace = false) {
    if (!detail || lock.current) return;
    const { action, item } = selection;
    if (action === "review" && item?.completedAttemptId) {
      navigate(topicAttemptPath(detail.topicId, item.completedAttemptId, origin, "review")); return;
    }
    const existing = action === "continue" ? item?.learningAttempt : action === "resumeRetry" ? item?.retryAttempt : null;
    if (existing) { navigate(topicAttemptPath(detail.topicId, existing.attemptId, origin)); return; }
    if (!["start", "retry", "restartRetry", "topicRetry"].includes(action)) return;
    setError(""); lock.current = true; setBusy(true);
    const request = new AbortController();
    controller.current = request;
    const replaceRetrySessionId = replace ? detail.retrySession?.retrySessionId ?? null : null;
    try {
      const body = action === "topicRetry" ? { replaceRetrySessionId } : {
        mode: action === "start" ? "LEARN" as const : "RETRY" as const,
        retrySessionId: null,
        replaceRetrySessionId,
      };
      const attemptId = await runTopicMutation({
        scope: JSON.stringify([viewer.learnerId, detail.topicId, item?.topicItemId, action, body]),
        run: async idempotencyKey => {
          const options = { idempotencyKey, signal: request.signal };
          if (action === "topicRetry") {
            const session = await topicApi.startTopicRetry(detail.topicId, body, options);
            if (!session.currentAttemptId || session.topicId !== detail.topicId) throw Object.assign(new Error("Invalid retry result"), { code: "CONTRACT_MISMATCH" });
            return session.currentAttemptId;
          }
          if (!item || body.mode === undefined) throw new Error("Missing topic item");
          const attempt = await topicApi.startAttempt(item.topicItemId, { mode: body.mode, retrySessionId: null, replaceRetrySessionId }, options);
          if (!attempt.attemptId || attempt.topicItemId !== item.topicItemId || attempt.topicId !== detail.topicId) throw Object.assign(new Error("Invalid attempt result"), { code: "CONTRACT_MISMATCH" });
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
    const selection = { action, item };
    if ((action === "retry" || action === "restartRetry" || action === "topicRetry") && detail.retrySession?.status === "IN_PROGRESS") setConfirmation(selection);
    else void perform(selection);
  };
  return { busy, error, confirmation, choose, cancel: () => setConfirmation(null), confirm: () => {
    const selection = confirmation; setConfirmation(null); if (selection) void perform(selection, true);
  } };
}
