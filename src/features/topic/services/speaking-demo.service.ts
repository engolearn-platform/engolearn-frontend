import type {
  DemoSpeakingItem,
  SpeakingSession,
  SpeakingTurnResult,
} from "@features/topic/types/speaking-demo.types";

const BASE = "/api/v1/speaking";

interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export class SpeakingApiError extends Error {
  readonly code: string;

  constructor(code: string, detail: string) {
    super(detail);
    this.code = code;
  }
}

async function speakingFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("X-Speaking-Contract", "0.8.3");
  return fetch(`${BASE}${path}`, { ...init, headers });
}

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new SpeakingApiError(
      problem?.code ?? `HTTP_${response.status}`,
      problem?.detail ?? problem?.message ?? `HTTP ${response.status}`,
    );
  }
  const body = (await response.json()) as ApiResponse<T>;
  return body.data;
}

async function postJson<T>(path: string, body: object): Promise<T> {
  return unwrap<T>(await speakingFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}

export const speakingDemoService = {
  demoItem: async () => unwrap<DemoSpeakingItem>(await speakingFetch("/demo-item")),
  current: async () => unwrap<SpeakingSession | null>(await speakingFetch("/sessions/current")),
  get: async (id: string) => unwrap<SpeakingSession>(await speakingFetch(`/sessions/${id}`)),
  create: (itemId: string) => postJson<SpeakingSession>("/sessions", { itemId }),
  resume: (id: string) => postJson<SpeakingSession>(`/sessions/${id}/resume`, {}),
  end: (id: string, controllerEpoch: number) =>
    postJson<SpeakingSession>(`/sessions/${id}/end`, { controllerEpoch }),
  turn: async (id: string, controllerEpoch: number, audio: Blob) => {
    const form = new FormData();
    const type = audio.type.startsWith("audio/mp4") ? "m4a" :
      audio.type.startsWith("audio/ogg") ? "ogg" : "webm";
    form.append("audio", audio, `turn.${type}`);
    form.append("turnId", crypto.randomUUID());
    form.append("controllerEpoch", String(controllerEpoch));
    return unwrap<SpeakingTurnResult>(await speakingFetch(`/sessions/${id}/turns`, {
      method: "POST",
      body: form,
    }));
  },
};
