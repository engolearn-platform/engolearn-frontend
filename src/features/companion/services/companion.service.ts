import { httpService, type ApiEnvelope } from "@shared/services";
import {
  CompanionApiError,
  type CompanionConversation,
  type CompanionConversationPage,
  type CompanionMessage,
  type CompanionMessagePage,
  type FirstTurnStatus,
  type CompanionProblem,
  type CompanionMemory,
  type CompanionMemoryCategory,
  type CompanionMemoryPage,
  type CompanionQuotaUsage,
} from "../types/companion.types";

const conversationsPath = "/api/v1/companion/conversations";
const quotaPath = "/api/v1/quota/me/usage";
const firstTurnsPath = "/api/v1/companion/first-turns";
const memoryPath = "/api/v1/companion/memory";

function safeError(error: unknown): CompanionApiError {
  if (error instanceof CompanionApiError) return error;
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown; retryable?: unknown } | null;
  const status = typeof candidate?.status === "number" ? candidate.status : undefined;
  const code = typeof candidate?.code === "string" ? candidate.code : undefined;
  const detail = typeof candidate?.message === "string" ? candidate.message : undefined;
  const retryable = typeof candidate?.retryable === "boolean" ? candidate.retryable : undefined;
  return new CompanionApiError(detail || "The companion service is temporarily unavailable.", {
    status,
    code,
    retryable,
  });
}

async function data<T>(request: Promise<ApiEnvelope<T>>): Promise<T> {
  try {
    const response = await request;
    if (!response || !("data" in response)) throw new Error("Invalid companion response");
    return response.data;
  } catch (error) {
    throw safeError(error);
  }
}

export const companionService = {
  listConversations(limit: number, before?: string, signal?: AbortSignal): Promise<CompanionConversationPage> {
    const params: Record<string, string> = { limit: String(limit) };
    if (before) params.before = before;
    return data(httpService.get<ApiEnvelope<CompanionConversationPage>>(conversationsPath, { params, signal }));
  },

  createConversation(signal?: AbortSignal): Promise<CompanionConversation> {
    return data(httpService.post<ApiEnvelope<CompanionConversation>>(conversationsPath, undefined, { signal }));
  },

  async getFirstTurn(turnId: string, cancel: boolean, signal?: AbortSignal): Promise<FirstTurnStatus> {
    const path = firstTurnsPath + "/" + encodeURIComponent(turnId);
    // Do not replay an admission/cancel operation through a session-refresh boundary.
    const response = await globalThis.fetch(cancel ? path + "/cancel" : path, {
      method: cancel ? "POST" : "GET", credentials: "same-origin", cache: "no-store", signal,
      headers: { Accept: "application/json", "ngrok-skip-browser-warning": "1" },
    });
    if (!response.ok) throw new CompanionApiError("First request status is unavailable", { status: response.status });
    const body = await response.json() as { data?: unknown };
    const status = parseFirstTurnStatus(body.data);
    if (!status || status.turnId !== turnId) throw new Error("Invalid first-turn status");
    return status;
  },

  getConversation(conversationId: string, signal?: AbortSignal): Promise<CompanionConversation> {
    return data(httpService.get<ApiEnvelope<CompanionConversation>>(`${conversationsPath}/${encodeURIComponent(conversationId)}`, { signal }));
  },

  listMessages(conversationId: string, limit: number, beforeSequence?: number, signal?: AbortSignal): Promise<CompanionMessagePage> {
    const params: Record<string, string> = { limit: String(limit) };
    if (beforeSequence !== undefined) params.beforeSequence = String(beforeSequence);
    return data(httpService.get<ApiEnvelope<CompanionMessagePage>>(`${conversationsPath}/${encodeURIComponent(conversationId)}/messages`, { params, signal }));
  },

  async deleteConversation(conversationId: string, signal?: AbortSignal): Promise<void> {
    try {
      await httpService.delete(`${conversationsPath}/${encodeURIComponent(conversationId)}`, { signal });
    } catch (error) {
      throw safeError(error);
    }
  },

  getQuotaUsage(signal?: AbortSignal): Promise<CompanionQuotaUsage> {
    return data(httpService.get<ApiEnvelope<CompanionQuotaUsage>>(quotaPath, { signal }));
  },

  listMemories(category?: CompanionMemoryCategory, before?: string, signal?: AbortSignal): Promise<CompanionMemoryPage> {
    const params: Record<string, string> = { limit: "20" };
    if (category) params.category = category;
    if (before) params.before = before;
    return data(httpService.get<ApiEnvelope<CompanionMemoryPage>>(memoryPath, { params, signal }));
  },

  updateMemory(memory: CompanionMemory, content: string, signal?: AbortSignal): Promise<CompanionMemory> {
    return data(httpService.patch<ApiEnvelope<CompanionMemory>>(`${memoryPath}/${encodeURIComponent(memory.id)}`, {
      content,
      expectedVersion: memory.version,
    }, { signal }));
  },

  async deleteMemory(memory: CompanionMemory, signal?: AbortSignal): Promise<void> {
    try {
      await httpService.delete(`${memoryPath}/${encodeURIComponent(memory.id)}`, {
        params: { expectedVersion: String(memory.version) },
        signal,
      });
    } catch (error) {
      throw safeError(error);
    }
  },

  getMemorySettings(signal?: AbortSignal): Promise<{ automaticMemoryEnabled: boolean }> {
    return data(httpService.get<ApiEnvelope<{ automaticMemoryEnabled: boolean }>>(`${memoryPath}/settings`, { signal }));
  },

  setMemorySettings(automaticMemoryEnabled: boolean, signal?: AbortSignal): Promise<{ automaticMemoryEnabled: boolean; updatedAt: string }> {
    return data(httpService.put<ApiEnvelope<{ automaticMemoryEnabled: boolean; updatedAt: string }>>(`${memoryPath}/settings`, {
      automaticMemoryEnabled,
    }, { signal }));
  },
};

export { safeError as toCompanionApiError };
export type { CompanionProblem };

export function parseFirstTurnStatus(value: unknown): FirstTurnStatus | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<FirstTurnStatus>;
  if (typeof v.turnId !== "string" || typeof v.retryEligible !== "boolean") return null;
  if (v.state === "CANCELLED" || v.state === "DELETED") {
    return v.conversation == null && v.userMessage == null && v.assistantMessage == null && !v.retryEligible
      ? { turnId: v.turnId, state: v.state, conversation: null, userMessage: null, assistantMessage: null, retryEligible: false }
      : null;
  }
  if (v.state !== "ACTIVE" && v.state !== "COMPLETED" && v.state !== "INCOMPLETE") return null;
  const c = v.conversation;
  const user = v.userMessage;
  const assistant = v.assistantMessage;
  const validMessage = (m: unknown, role: "USER" | "ASSISTANT") => {
    if (!m || typeof m !== "object") return false;
    const x = m as Partial<CompanionMessage>;
    return typeof x.id === "string" && x.role === role && Number.isInteger(x.sequence)
      && Number(x.sequence) > 0 && typeof x.content === "string" && typeof x.createdAt === "string";
  };
  if (!c || typeof c.id !== "string" || typeof c.title !== "string" || typeof c.createdAt !== "string"
    || typeof c.updatedAt !== "string" || !Number.isInteger(c.messageCount) || c.messageCount < 1
    || !Number.isInteger(c.maxMessages) || !Number.isInteger(c.warningThreshold)
    || !validMessage(user, "USER") || user?.sequence !== 1
    || (v.state === "COMPLETED" ? !validMessage(assistant, "ASSISTANT") : assistant != null)
    || (v.retryEligible && v.state !== "INCOMPLETE")) return null;
  return { turnId: v.turnId, state: v.state, conversation: c, userMessage: user!, assistantMessage: assistant ?? null, retryEligible: v.retryEligible };
}