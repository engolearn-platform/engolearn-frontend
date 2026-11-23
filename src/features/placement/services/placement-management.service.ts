import { httpService, type ApiEnvelope } from "@shared/services";
import type {
  ManagementAttempt, ManagementAttemptSummary, ManagementAudio, ManagementPage,
  ManagementQuestion, ManagementTestSet, PlacementManagementService,
} from "@features/placement/types/placement-management.types";

const adminApi = "/api/v1/placement/admin";
const questions = `${adminApi}/questions`;
const sets = `${adminApi}/test-sets`;
const attempts = `${adminApi}/attempts`;
const byId = (resource: string, id: string) => `${resource}/${encodeURIComponent(id)}`;

function revisionOf(item: { revision?: number }) {
  if (item.revision == null) throw new Error("Không đọc được phiên bản dữ liệu. Hãy tải lại.");
  return item.revision;
}

async function readPages<T extends { id: string }>(endpoint: string, signal?: AbortSignal, filters?: Record<string, string>) {
  const rows = new Map<string, T>();
  const size = 100;
  for (let page = 0; ; page += 1) {
    const { data } = await httpService.get<ApiEnvelope<ManagementPage<T>>>(endpoint, {
      signal, params: { ...filters, page: String(page), size: String(size) },
    });
    if (!Array.isArray(data?.items) || data.page !== page || data.size !== size) {
      throw new Error("API quản trị Placement trả dữ liệu phân trang không hợp lệ.");
    }
    data.items.forEach(item => rows.set(item.id, item));
    if (data.items.length < size || (page + 1) * size >= data.total) return [...rows.values()];
  }
}

export const placementManagementService: PlacementManagementService = {
  async getState(signal) {
    const [bank, testSets] = await Promise.all([
      readPages<ManagementQuestion>(questions, signal),
      readPages<ManagementTestSet>(sets, signal),
    ]);
    return { schemaVersion: 1, questions: bank, testSets, attempts: [] };
  },
  async listAttempts(filters, page, size, signal) {
    const values = Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim()));
    return (await httpService.get<ApiEnvelope<ManagementPage<ManagementAttemptSummary>>>(attempts, {
      signal, params: { ...values, page: String(page), size: String(size) },
    })).data;
  },
  async getAttempt(id, signal) {
    return (await httpService.get<ApiEnvelope<ManagementAttempt>>(byId(attempts, id), { signal })).data;
  },
  async getSetPreview(id, signal) {
    return (await httpService.get<ApiEnvelope<ManagementTestSet>>(`${byId(sets, id)}/preview`, { signal })).data;
  },
  async uploadAudio(file) {
    const send = async () => {
      const body = new FormData();
      body.append("file", file);
      return fetch(`${questions}/media`, { method: "POST", body, credentials: "same-origin", cache: "no-store" });
    };
    let response = await send();
    if (response.status === 401) {
      await httpService.get("/api/v1/auth/me");
      response = await send();
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Không thể tải audio lên.");
    return (result as ApiEnvelope<ManagementAudio>).data;
  },
  async listAudio(signal) {
    return (await httpService.get<ApiEnvelope<{ items: ManagementAudio[] }>>(`${questions}/media`, { signal })).data.items;
  },
  findQuestions(filters, signal) {
    const values = Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value));
    return readPages<ManagementQuestion>(questions, signal, values);
  },
  async saveQuestion(draft, question) {
    const result = question
      ? await httpService.put<ApiEnvelope<ManagementQuestion>>(byId(questions, question.id), { ...draft, revision: revisionOf(question) })
      : await httpService.post<ApiEnvelope<ManagementQuestion>>(questions, draft);
    return result.data;
  },
  async setQuestionStatus(question, status) {
    await httpService.patch(`${byId(questions, question.id)}/status`, { status, revision: revisionOf(question) });
  },
  async importQuestions(drafts) {
    return (await httpService.post<ApiEnvelope<{ count: number }>>(`${questions}/import`, { questions: drafts })).data.count;
  },
  async createSet(name) {
    return (await httpService.post<ApiEnvelope<ManagementTestSet>>(sets, { name })).data;
  },
  async saveSet(set, name, questionIds) {
    return (await httpService.put<ApiEnvelope<ManagementTestSet>>(byId(sets, set.id), { name, questionIds, revision: revisionOf(set) })).data;
  },
  async publishSet(set, name, questionIds) {
    await httpService.post(`${byId(sets, set.id)}/publish`, { name, questionIds, revision: revisionOf(set) });
  },
  async archiveSet(set) {
    await httpService.post(`${byId(sets, set.id)}/archive`, { revision: revisionOf(set) });
  },
  async newVersion(id) {
    return (await httpService.post<ApiEnvelope<ManagementTestSet>>(`${byId(sets, id)}/versions`, {})).data;
  },
  async deleteSet(set) {
    await httpService.delete(byId(sets, set.id), { params: { revision: String(revisionOf(set)) } });
  },
};
