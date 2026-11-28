import { httpService, type ApiEnvelope } from "@shared/services/http.service";
import type { Media } from "@features/assessment/types/assessment.types";
import type { AssessmentDraft, DraftSkillOption, DraftSummary, ManagedAssessmentPaper } from "@features/assessment/types/draft";

const admin = "/api/v1/assessment/admin";
const endpoint = admin + "/drafts";
const draftPath = (series: string) => endpoint + "/" + encodeURIComponent(series);

export const draftService = {
  async skillCatalog(signal: AbortSignal) {
    return (await httpService.get<ApiEnvelope<DraftSkillOption[]>>(endpoint + "/skill-catalog", { signal })).data;
  },
  async skillMappings(signal: AbortSignal) {
    return (await httpService.get<ApiEnvelope<DraftSkillOption[]>>(endpoint + "/skill-catalog",
      {signal, params: {includeInactive: "true"}})).data;
  },
  async list(page: number, signal: AbortSignal) {
    return (await httpService.get<ApiEnvelope<DraftSummary[]>>(endpoint, { params: { page: String(page) }, signal })).data;
  },
  async open(series: string) {
    return (await httpService.get<ApiEnvelope<AssessmentDraft>>(draftPath(series))).data;
  },
  async create(series: string, name: string) {
    return (await httpService.post<ApiEnvelope<AssessmentDraft>>(endpoint, { series, name })).data;
  },
  async save(draft: AssessmentDraft) {
    const { series, revision, name, skills, units } = draft;
    return (await httpService.put<ApiEnvelope<AssessmentDraft>>(draftPath(series), { revision, name, skills, units })).data;
  },
  async upload(file: File, expectedSha?: string, soundCheck = false) {
    const form = new FormData();
    form.append("file", file);
    if (expectedSha) form.append("sha256", expectedSha);
    if (soundCheck) form.append("soundCheck", "true");
    return (await httpService.post<ApiEnvelope<{ sha256: string }>>(admin + "/media", form)).data.sha256;
  },
  async preview({ series, revision }: AssessmentDraft) {
    return (await httpService.post<ApiEnvelope<AssessmentDraft>>(draftPath(series) + "/preview", { revision })).data;
  },
  async previewAudio({ series, revision }: AssessmentDraft, unit: number) {
    return (await httpService.get<ApiEnvelope<Media>>(draftPath(series) + "/preview/audio/" + unit,
      { params: { revision } })).data;
  },
  review({ series, revision }: AssessmentDraft) {
    return httpService.post<void>(draftPath(series) + "/review", { revision });
  },
  async publish({ series, revision }: AssessmentDraft) {
    return (await httpService.post<ApiEnvelope<ManagedAssessmentPaper>>(draftPath(series) + "/publish", { revision })).data;
  },
  remove({ series, revision }: AssessmentDraft) {
    return httpService.delete<void>(draftPath(series), { params: { revision } });
  },
  async papers(page: number, signal: AbortSignal) {
    return (await httpService.get<ApiEnvelope<ManagedAssessmentPaper[]>>(admin + "/papers",
      { params: { page: String(page) }, signal })).data;
  },
  async archive({ series, version }: ManagedAssessmentPaper) {
    return (await httpService.post<ApiEnvelope<ManagedAssessmentPaper>>(
      admin + "/papers/" + encodeURIComponent(series) + "/" + version + "/archive", {})).data;
  },
};
