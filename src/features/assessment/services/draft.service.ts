import { httpService, type ApiEnvelope } from "@shared/services/http.service";
import type { AssessmentDraft, DraftSummary } from "@features/assessment/types/draft";

const endpoint = "/api/v1/assessment/admin/drafts";
export const draftService = {
  async list(page: number, signal: AbortSignal) {
    return (await httpService.get<ApiEnvelope<DraftSummary[]>>(endpoint, { params: {page: String(page)}, signal })).data;
  },
  async open(series: string) {
    return (await httpService.get<ApiEnvelope<AssessmentDraft>>(endpoint + "/" + encodeURIComponent(series))).data;
  },
  async create(series: string, name: string) {
    return (await httpService.post<ApiEnvelope<AssessmentDraft>>(endpoint, {series, name})).data;
  },
  async save(draft: AssessmentDraft) {
    const { series, revision, name, skills, units } = draft;
    return (await httpService.put<ApiEnvelope<AssessmentDraft>>(endpoint + "/" + encodeURIComponent(series),
      {revision, name, skills, units})).data;
  },
};
