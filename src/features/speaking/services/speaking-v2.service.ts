import type { ApiEnvelope, HttpError } from "@shared/services/http.service";
import { httpService } from "@shared/services/http.service";
import type { SpeakingAssessment, SpeakingAvailability, SpeakingHistoryGroup, SpeakingHistoryTopicPage, SpeakingPage, SpeakingParentHistoryPage, SpeakingScope, SpeakingSession, SpeakingTurn } from "@features/speaking/types/speaking-v2.types";

const BASE = "/api/v1/speaking";
export class SpeakingV2ApiError extends Error {
  readonly code: string; readonly retryable?: boolean; readonly activeSessionId?: string;
  constructor(code: string, message: string, retryable?: boolean, activeSessionId?: string) {
    super(message); this.name = "SpeakingV2ApiError"; this.code = code; this.retryable = retryable; this.activeSessionId = activeSessionId;
  }
}
async function request<T>(path: string, method: "GET" | "POST" | "DELETE" = "GET", body?: object, params?: Record<string, string>, signal?: AbortSignal): Promise<T> {
  try {
    const options = params || signal ? { ...(params ? { params } : {}), ...(signal ? { signal } : {}) } : undefined;
    if (method === "DELETE") return await httpService.delete<T>(`${BASE}${path}`, options);
    const response = method === "POST" ? await httpService.post<ApiEnvelope<T>>(`${BASE}${path}`, body, options)
      : await httpService.get<ApiEnvelope<T>>(`${BASE}${path}`, options);
    return response.data;
  } catch (cause) {
    const error = cause as HttpError & { retryable?: boolean; activeSessionId?: string };
    throw new SpeakingV2ApiError(error.code ?? `HTTP_${error.status ?? 0}`, error.message ?? "Speaking request failed.", error.retryable, error.activeSessionId);
  }
}
const enc = (value: string) => encodeURIComponent(value);
const scopeParams = (scope: SpeakingScope) => ({ scopeType: scope.type, topicId: scope.topicId,
  ...(scope.topicItemId ? { topicItemId: scope.topicItemId } : {}) });

export const speakingV2Service = {
  availability: (scope: SpeakingScope) => request<SpeakingAvailability>("/availability", "GET", undefined, scopeParams(scope)),
  create: (scope: SpeakingScope, clientRequestId = crypto.randomUUID()) => request<SpeakingSession>("/sessions", "POST", { scope, clientRequestId }),
  replace: (scope: SpeakingScope, sessionId: string, controllerEpoch: number, clientRequestId = crypto.randomUUID()) =>
    request<SpeakingSession | { status: "REPLACING"; sessionId: string }>("/sessions/replace", "POST", { scope, clientRequestId, sessionId, controllerEpoch }),
  get: (sessionId: string) => request<SpeakingSession>(`/sessions/${enc(sessionId)}`),
  resume: (session: Pick<SpeakingSession, "sessionId" | "controllerEpoch">, clientRequestId = crypto.randomUUID()) =>
    request<SpeakingSession>(`/sessions/${enc(session.sessionId)}/resume`, "POST", { clientRequestId, controllerEpoch: session.controllerEpoch }),
  ticket: (session: Pick<SpeakingSession, "sessionId" | "controllerEpoch">) =>
    request<{ ticket: string; expiresInSeconds: number }>(`/sessions/${enc(session.sessionId)}/socket-ticket`, "POST", { controllerEpoch: session.controllerEpoch }),
  end: (session: Pick<SpeakingSession, "sessionId" | "controllerEpoch">) =>
    request<SpeakingSession>(`/sessions/${enc(session.sessionId)}/end`, "POST", { controllerEpoch: session.controllerEpoch }),
  turns: (sessionId: string, page = 0, size = 20) => request<SpeakingPage<SpeakingTurn>>(`/sessions/${enc(sessionId)}/turns`, "GET", undefined, { page: String(page), size: String(size) }),
  async allTurns(sessionId: string) {
    const turns = new Map<string, SpeakingTurn>();
    for (let page = 0; ; page++) {
      const result = await speakingV2Service.turns(sessionId, page, 100);
      result.items.forEach(turn => turns.set(turn.turnId, turn));
      if (!result.hasNext || result.items.length === 0) break;
    }
    return [...turns.values()].sort((a, b) => a.sequence - b.sequence);
  },
  assessment: (sessionId: string) => request<SpeakingAssessment>(`/sessions/${enc(sessionId)}/assessment`),
  history: (scope?: SpeakingScope, page = 0, size = 20, signal?: AbortSignal) => request<SpeakingPage<SpeakingSession>>("/sessions", "GET", undefined, { ...(scope ? scopeParams(scope) : {}), page: String(page), size: String(size) }, signal),
  historyTopics: (group: SpeakingHistoryGroup, page = 0, size = 9, signal?: AbortSignal) =>
    request<SpeakingHistoryTopicPage>("/history/topics", "GET", undefined, { group, page: String(page), size: String(size) }, signal),
  parentHistory: (topicId: string, page = 0, size = 20, signal?: AbortSignal) =>
    request<SpeakingParentHistoryPage>(`/history/topics/${enc(topicId)}/sessions`, "GET", undefined, { page: String(page), size: String(size) }, signal),
  remove: (sessionId: string) => request<void>(`/sessions/${enc(sessionId)}`, "DELETE"),
  removeAll: () => request<void>("/sessions", "DELETE"),
  audio: (sessionId: string, turnId: string, kind: "LEARNER_RECORDING" | "AI_REPLY") => request<{ url: string; expiresInSeconds: number }>(`/sessions/${enc(sessionId)}/turns/${enc(turnId)}/audio/${kind}`),
  openingAudio: (sessionId: string) => request<{ url: string; expiresInSeconds: number }>(`/sessions/${enc(sessionId)}/opening/audio`),
};
