import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useFetch } from "@shared/hooks";
import { topicApi } from "@features/topic/services/topic-api.service";
import { topicCatalogService } from "@features/topic/services/topic-catalog.service";
import { runTopicMutation } from "@features/topic/services/topic-mutation-journal";
import { assertItemResult, assertTopicResult } from "@features/topic/utils/topic-result";
import { topicAttemptPath, topicErrorMessage } from "@features/topic/utils/topic-catalog";
import { useTopicViewer } from "./topic-viewer.context";
import type { ItemResultDto } from "@features/topic/types/topic-api.types";

export function useItemResult(topicId: string, attemptId: string) {
  return useFetch(useCallback(async (signal: AbortSignal) => {
    const [result, detail] = await Promise.all([topicApi.getItemResult(attemptId, signal), topicCatalogService.detail(topicId, signal)]);
    assertItemResult(result, topicId, attemptId);
    const item = detail.items.find(item => item.topicItemId === result.topicItemId);
    if (item?.completedAttemptId !== attemptId) {
      if (!item?.completedAttemptId && detail.generation > 0) throw Object.assign(new Error("Topic was reset"), { code: "TOPIC_RESET", status: 409 });
      throw Object.assign(new Error("Result reference changed"), { code: "RESULT_CHANGED", status: 409 });
    }
    return { result, detail, item };
  }, [topicId, attemptId]));
}

export function useTopicResult(topicId: string) {
  return useFetch(useCallback(async (signal: AbortSignal) => {
    const [result, detail] = await Promise.all([topicApi.getTopicResult(topicId, signal), topicCatalogService.detail(topicId, signal)]);
    assertTopicResult(result, topicId);
    if (detail.progress?.status !== "COMPLETED") throw Object.assign(new Error("Topic result changed"), { code: detail.generation > 0 ? "TOPIC_RESET" : "RESULT_CHANGED", status: 409 });
    return { result, detail };
  }, [topicId]));
}

export function useNextTopicItem(result: ItemResultDto | null, origin: string, refresh: () => void, generation = 0) {
  const viewer = useTopicViewer();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const start = async () => {
    if (!result?.nextItemAvailability.allowed || !result.nextTopicItemId || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const request = new AbortController();
    controller.current = request;
    const itemId = result.nextTopicItemId;
    const body = { mode: result.retrySession ? "RETRY" as const : "LEARN" as const,
      retrySessionId: result.retrySession?.retrySessionId ?? null, replaceRetrySessionId: null };
    try {
      const attempt = await runTopicMutation({
        identity: { learnerId: viewer.learnerId, topicId: result.topicId, generation },
        scope: JSON.stringify([viewer.learnerId, result.topicId, generation, itemId, "result-next", body]),
        run: async idempotencyKey => {
          const value = await topicApi.startAttempt(itemId, body, { idempotencyKey, signal: request.signal });
          if (!value.attemptId || value.topicId !== result.topicId || value.topicItemId !== itemId ||
            value.retrySessionId !== body.retrySessionId) throw Object.assign(new Error("Unexpected next attempt"), { code: "CONTRACT_MISMATCH" });
          return value;
        },
      });
      if (!request.signal.aborted) void navigate(topicAttemptPath(result.topicId, attempt.attemptId, origin));
    } catch (failure) {
      if (!request.signal.aborted) {
        const problem = failure as { status?: number; code?: string };
        setError(topicErrorMessage(problem));
        if (problem.status && [409, 410, 422].includes(problem.status)) refresh();
      }
    } finally {
      lock.current = false;
      if (!request.signal.aborted) setBusy(false);
    }
  };
  return { busy, error, start };
}
