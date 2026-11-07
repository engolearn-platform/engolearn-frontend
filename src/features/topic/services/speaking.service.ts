import type { SpeakingItemConfig, SpeakingSession } from "@features/topic/types/speaking.types";
import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope, HttpError } from "@shared/services/http.service";

const BASE = "/api/v1/speaking";
export const SPEAKING_CONTRACT_VERSION = "0.8.3";
export const speakingDemoEnabled = import.meta.env.DEV ||
  import.meta.env.VITE_SPEAKING_DEMO_ENABLED === "true";

export class SpeakingApiError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function request<T>(path: string, method = "GET", body?: object): Promise<T> {
  const endpoint = `${BASE}${path}`;
  const options = { headers: { "X-Speaking-Contract": SPEAKING_CONTRACT_VERSION } };
  try {
    const envelope = method === "POST"
      ? await httpService.post<ApiEnvelope<T>>(endpoint, body, options)
      : method === "DELETE"
        ? await httpService.delete<ApiEnvelope<T>>(endpoint, options)
        : await httpService.get<ApiEnvelope<T>>(endpoint, options);
    return envelope.data;
  } catch (cause) {
    const error = cause as HttpError;
    throw new SpeakingApiError(error.code ?? `HTTP_${error.status ?? 0}`,
      error.message ?? "Speaking request failed");
  }
}

export const speakingService = {
  config: (itemId: string) => request<SpeakingItemConfig>(`/items/${encodeURIComponent(itemId)}/config`),
  current: () => request<SpeakingSession | null>("/sessions/current"),
  get: (id: string) => request<SpeakingSession>(`/sessions/${encodeURIComponent(id)}`),
  history: (itemId?: string) => request<SpeakingSession[]>(
    `/sessions${itemId ? `?itemId=${encodeURIComponent(itemId)}` : ""}`),
  create: (itemId: string) => request<SpeakingSession>("/sessions", "POST", { itemId, requestId: crypto.randomUUID() }),
  replace: (itemId: string) => request<SpeakingSession>("/sessions/replace", "POST", { itemId, requestId: crypto.randomUUID() }),
  resume: (session: SpeakingSession) => request<SpeakingSession>(
    `/sessions/${encodeURIComponent(session.id)}/resume`, "POST",
    { controllerEpoch: session.controllerEpoch, requestId: crypto.randomUUID() }),
  end: (session: SpeakingSession) => request<SpeakingSession>(
    `/sessions/${encodeURIComponent(session.id)}/end`, "POST",
    { controllerEpoch: session.controllerEpoch, requestId: crypto.randomUUID() }),
  ticket: (session: Pick<SpeakingSession, "id" | "controllerEpoch">) => request<{ ticket: string; expiresInSeconds: number }>(
    `/sessions/${encodeURIComponent(session.id)}/socket-ticket`, "POST",
    { controllerEpoch: session.controllerEpoch, requestId: crypto.randomUUID() }),
  retryOpening: (sessionId: string, requestId: string, controllerEpoch: number) =>
    request<SpeakingSession>(`/sessions/${encodeURIComponent(sessionId)}/opening/retry`, "POST",
      { requestId, controllerEpoch }),
  remove: (id: string) => request<SpeakingSession>(`/sessions/${encodeURIComponent(id)}`, "DELETE"),
  removeAll: () => request<number>("/sessions", "DELETE"),
  audio: (sessionId: string, turnId: string, kind: "LEARNER_RECORDING" | "AI_REPLY") =>
    request<{ url: string; expiresInSeconds: number }>(
      `/sessions/${encodeURIComponent(sessionId)}/turns/${encodeURIComponent(turnId)}/audio/${kind}`),
  openingAudio: (sessionId: string) => request<{ url: string; expiresInSeconds: number }>(
    `/sessions/${encodeURIComponent(sessionId)}/opening/audio`),
};
