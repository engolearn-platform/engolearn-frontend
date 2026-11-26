import { httpService, type ApiEnvelope } from "@shared/services";
import {
  CompanionApiError,
  type CompanionConversation,
  type CompanionConversationPage,
  type CompanionMessagePage,
  type CompanionProblem,
  type CompanionMemory,
  type CompanionMemoryCategory,
  type CompanionMemoryPage,
  type CompanionQuotaUsage,
} from "../types/companion.types";

const conversationsPath = "/api/v1/companion/conversations";
const quotaPath = "/api/v1/quota/me/usage";
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
