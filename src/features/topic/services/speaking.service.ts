import type { SpeakingItemConfig, SpeakingSession } from "@features/topic/types/speaking.types";

const BASE = "/api/v1/speaking";
export const SPEAKING_CONTRACT_VERSION = "0.8.3";
export const speakingDemoEnabled = import.meta.env.DEV ||
  import.meta.env.VITE_SPEAKING_DEMO_ENABLED === "true";

function demoLearnerKey(): string | null {
  if (!speakingDemoEnabled) return null;
  const storageKey = "engolearn-speaking-demo-learner-key";
  let key = localStorage.getItem(storageKey);
  if (!key) {
    const generated = sessionStorage.getItem("engolearn-dev-user-id") ??
      import.meta.env.VITE_DEV_USER_ID ?? crypto.randomUUID();
    key = generated;
    localStorage.setItem(storageKey, generated);
  }
  return key;
}

export class SpeakingApiError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function request<T>(path: string, method = "GET", body?: object): Promise<T> {
  const devUser = import.meta.env.DEV
    ? (sessionStorage.getItem("engolearn-dev-user-id") ?? import.meta.env.VITE_DEV_USER_ID ?? "dev-user")
    : null;
  const demoKey = demoLearnerKey();
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "X-Speaking-Contract": SPEAKING_CONTRACT_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(devUser ? { "X-Dev-User-Id": devUser } : {}),
      ...(demoKey ? { "X-Speaking-Demo-Learner-Key": demoKey } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new SpeakingApiError(detail?.code ?? `HTTP_${response.status}`,
      detail?.detail ?? `HTTP ${response.status}`);
  }
  const envelope = await response.json() as { data: T };
  return envelope.data;
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
  remove: (id: string) => request<SpeakingSession>(`/sessions/${encodeURIComponent(id)}`, "DELETE"),
  removeAll: () => request<number>("/sessions", "DELETE"),
  audio: (sessionId: string, turnId: string, kind: "LEARNER_RECORDING" | "AI_REPLY") =>
    request<{ url: string; expiresInSeconds: number }>(
      `/sessions/${encodeURIComponent(sessionId)}/turns/${encodeURIComponent(turnId)}/audio/${kind}`),
};
