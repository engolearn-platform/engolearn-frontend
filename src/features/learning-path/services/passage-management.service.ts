import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope, HttpError } from "@shared/services/http.service";
import type { PassageDetail, PassageInput, PassageListParams, PassageListResponse, PassageReadiness, PassagePublicationInput, PassagePublicationReceipt } from "@features/learning-path/types/passage-management.types";

export type PassagePublicationError = HttpError & { readiness?: PassageReadiness };

function readinessExtension(value: unknown): PassageReadiness | undefined {
  if (!value || typeof value !== "object") return;
  const data = value as Partial<PassageReadiness>;
  const issues = (items: unknown) => Array.isArray(items) && items.every(item => item && typeof item === "object"
    && typeof item.code === "string" && typeof item.field === "string" && typeof item.message === "string");
  if (typeof data.passageId === "string" && (data.revision === null || Number.isInteger(data.revision))
    && (data.status === null || typeof data.status === "string") && typeof data.structurallyValid === "boolean"
    && typeof data.referencingQuestionCount === "number" && typeof data.incompatibleQuestionCount === "number"
    && issues(data.blockers) && issues(data.warnings) && Array.isArray(data.requiredReviewChecks)
    && data.requiredReviewChecks.every(check => typeof check === "string")) return data as PassageReadiness;
}

const endpoint = "/api/management/learning-paths/passages";
const itemUrl = (id: string) => `${endpoint}/${encodeURIComponent(id)}`;

export function passageFormData(input: PassageInput, audio?: File): FormData {
  const body = new FormData();
  body.append("passage", new Blob([JSON.stringify(input)], { type: "application/json" }));
  if (audio) body.append("audio", audio);
  return body;
}

export const passageManagementService = {
  async publish(id: string, input: PassagePublicationInput, signal?: AbortSignal): Promise<PassagePublicationReceipt> {
    try {
      const response = await httpService.post<ApiEnvelope<PassagePublicationReceipt>>(`${itemUrl(id)}/publish`, input, { signal });
      const receipt = response?.data;
      if (!receipt || receipt.passageId !== id || receipt.status !== "ACTIVE" || receipt.reviewedRevision !== input.revision
        || !Number.isInteger(receipt.revision) || receipt.revision <= input.revision) throw new Error("Chưa xác định được kết quả xuất bản. Hãy tải lại trạng thái passage.");
      return receipt;
    } catch (reason) {
      if (reason instanceof Error) {
        const failure = reason as PassagePublicationError;
        const problem = failure.problem;
        if (problem && typeof problem === "object" && "readiness" in problem) {
          const readiness = readinessExtension(problem.readiness);
          if (readiness?.passageId === id) failure.readiness = readiness;
        }
      }
      throw reason;
    }
  },
  async readiness(id: string, signal?: AbortSignal): Promise<PassageReadiness> {
    return (await httpService.get<ApiEnvelope<PassageReadiness>>(`${itemUrl(id)}/readiness`, { signal })).data;
  },
  async list(query: PassageListParams, signal?: AbortSignal): Promise<PassageListResponse> {
    const params: Record<string, string> = { page: String(query.page), size: String(query.size) };
    if (query.keyword.trim()) params.keyword = query.keyword.trim();
    for (const name of ["skill", "level", "status"] as const) {
      if (query[name] !== "ALL") params[name] = query[name];
    }
    const response = await httpService.get<ApiEnvelope<PassageListResponse>>(endpoint, { params, signal });
    return response.data;
  },
  async detail(id: string, signal?: AbortSignal): Promise<PassageDetail> {
    return (await httpService.get<ApiEnvelope<PassageDetail>>(itemUrl(id), { signal })).data;
  },
  async create(input: PassageInput, audio?: File): Promise<void> {
    await httpService.post(endpoint, passageFormData(input, audio));
  },
  async update(id: string, input: PassageInput, audio?: File): Promise<void> {
    await httpService.patch(itemUrl(id), passageFormData(input, audio));
  },
  async delete(id: string, revision: number): Promise<void> {
    await httpService.delete(itemUrl(id), { params: { revision: String(revision) } });
  },
};
