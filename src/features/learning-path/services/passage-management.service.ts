import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope } from "@shared/services/http.service";
import type { PassageDetail, PassageInput, PassageListParams, PassageListResponse } from "@features/learning-path/types/passage-management.types";

const endpoint = "/api/management/learning-paths/passages";
const itemUrl = (id: string) => `${endpoint}/${encodeURIComponent(id)}`;

export function passageFormData(input: PassageInput, audio?: File): FormData {
  const body = new FormData();
  body.append("passage", new Blob([JSON.stringify(input)], { type: "application/json" }));
  if (audio) body.append("audio", audio);
  return body;
}

export const passageManagementService = {
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
