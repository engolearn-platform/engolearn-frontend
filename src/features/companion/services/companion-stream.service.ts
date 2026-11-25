import { httpService } from "@shared/services";
import { toCompanionApiError } from "./companion.service";
import type { CompanionMessage, CompanionProblem, CompanionTurnEvent, CompanionTurnRequest } from "../types/companion.types";

export interface SseFrame {
  event: string;
  data: string;
}

/** Pure incremental SSE framing. Incomplete UTF-8 decoding is handled by TextDecoderStream's caller. */
export function consumeSseFrames(buffer: string, chunk: string, flush = false): { frames: SseFrame[]; rest: string } {
  const input = buffer + chunk;
  const frames: SseFrame[] = [];
  let cursor = 0;
  const delimiter = /\r\n\r\n|\n\n|\r\r/g;
  for (let match = delimiter.exec(input); match; match = delimiter.exec(input)) {
    const block = input.slice(cursor, match.index);
    cursor = match.index + match[0].length;
    let eventName = "message";
    const dataLines: string[] = [];
    for (const line of block.split(/\r\n|\r|\n/)) {
      if (!line || line.startsWith(":")) continue;
      const separator = line.indexOf(":");
      const field = separator < 0 ? line : line.slice(0, separator);
      const value = separator < 0 ? "" : line.slice(separator + 1).replace(/^ /, "");
      if (field === "event") eventName = value;
      else if (field === "data") dataLines.push(value);
    }
    if (dataLines.length) frames.push({ event: eventName, data: dataLines.join("\n") });
  }
  return { frames, rest: flush ? "" : input.slice(cursor) };
}

function isMessage(value: unknown): value is CompanionMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<CompanionMessage>;
  return typeof message.id === "string" && Number.isInteger(message.sequence) && message.sequence! > 0 &&
    message.role === "ASSISTANT" && typeof message.content === "string" && typeof message.createdAt === "string";
}

function parseEvent(frame: SseFrame): CompanionTurnEvent | null {
  if (!["delta", "completed", "error", "status"].includes(frame.event)) return null;
  try {
    const data = JSON.parse(frame.data) as unknown;
    if (!data || typeof data !== "object") return null;
    const value = data as Record<string, unknown>;
    if (frame.event === "delta" && typeof value.text === "string") return { event: "delta", data: { text: value.text } };
    if (frame.event === "status" && typeof value.code === "string") return { event: "status", data: { code: value.code } };
    if (frame.event === "error" && typeof value.code === "string" && typeof value.turnId === "string") {
      return {
        event: "error",
        data: {
          turnId: value.turnId,
          code: value.code,
          detail: typeof value.detail === "string" ? value.detail : "The response could not be completed.",
          retryable: value.retryable === true,
        },
      };
    }
    if (frame.event === "completed" && typeof value.turnId === "string" && isMessage(value.assistantMessage) &&
        Number.isInteger(value.messageCount) && Number.isInteger(value.maxMessages) && typeof value.warning === "boolean") {
      return {
        event: "completed",
        data: {
          turnId: value.turnId,
          assistantMessage: value.assistantMessage,
          messageCount: value.messageCount as number,
          maxMessages: value.maxMessages as number,
          warning: value.warning,
        },
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function problemFrom(response: Response): Promise<CompanionProblem> {
  try {
    const value = await response.json() as Record<string, unknown>;
    return {
      status: response.status,
      ...(typeof value.code === "string" ? { code: value.code } : {}),
      ...(typeof value.detail === "string" ? { detail: value.detail } : {}),
      ...(typeof value.title === "string" ? { title: value.title } : {}),
      ...(typeof value.retryable === "boolean" ? { retryable: value.retryable } : {}),
    };
  } catch {
    return { status: response.status };
  }
}

async function postTurn(conversationId: string, request: CompanionTurnRequest, signal: AbortSignal): Promise<Response> {
  return globalThis.fetch(`/api/v1/companion/conversations/${encodeURIComponent(conversationId)}/turns`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    signal,
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify(request),
  });
}

export interface StreamResult {
  terminal: "completed" | "error" | null;
  errorRetryable: boolean;
}

export async function streamCompanionTurn(
  conversationId: string,
  request: CompanionTurnRequest,
  signal: AbortSignal,
  onEvent: (event: CompanionTurnEvent) => void,
  onAccepted: () => void = () => undefined,
): Promise<StreamResult> {
  let response = await postTurn(conversationId, request, signal);
  if (response.status === 401 && !signal.aborted) {
    // Let HttpService perform its existing shared single-flight cookie refresh.
    try {
      await httpService.get("/api/v1/auth/me", { signal });
    } catch {
      throw toCompanionApiError(Object.assign(new Error("Your session has expired."), { status: 401 }));
    }
    if (!signal.aborted) response = await postTurn(conversationId, request, signal);
  }

  if (!response.ok) {
    const problem = await problemFrom(response);
    throw toCompanionApiError(Object.assign(new Error(problem.detail || problem.title || "The companion service is temporarily unavailable."), problem));
  }
  if (!response.headers.get("content-type")?.toLowerCase().includes("text/event-stream")) {
    throw toCompanionApiError(Object.assign(new Error("The companion stream response was invalid."), {
      status: response.status,
      code: "COMPANION_INVALID_STREAM_RESPONSE",
    }));
  }
  onAccepted();
  if (!response.body) return { terminal: null, errorRetryable: false };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminal: StreamResult["terminal"] = null;
  let errorRetryable = false;
  const dispatch = (frames: SseFrame[]) => {
    for (const frame of frames) {
      const event = parseEvent(frame);
      if (!event) continue;
      onEvent(event);
      if (event.event === "completed") {
        terminal = "completed";
        break;
      }
      if (event.event === "error") {
        terminal = "error";
        errorRetryable = event.data.retryable;
        break;
      }
    }
  };

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      const decoded = decoder.decode(value, { stream: true });
      const parsed = consumeSseFrames(buffer, decoded);
      buffer = parsed.rest;
      dispatch(parsed.frames);
      if (terminal) break;
    }
    const tail = decoder.decode();
    const parsed = consumeSseFrames(buffer, tail, true);
    dispatch(parsed.frames);
  } finally {
    if (signal.aborted || terminal) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  return { terminal, errorRetryable };
}
