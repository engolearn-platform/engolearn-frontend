import { httpService, type ApiEnvelope } from "@shared/services/http.service";
import type { AssessmentDraft } from "@features/assessment/types/draft";

export interface CheckedWav {
  name: string;
  sha256: string;
  seconds: number;
}

export interface DraftImportPreview {
  draft: AssessmentDraft;
  token: string;
  audioFiles: Record<string, string>;
  soundCheckFile: string | null;
}

const base = "/api/v1/assessment/admin/draft-imports";

function formFor(workbook: File, manifest: CheckedWav[]) {
  const form = new FormData();
  form.append("workbook", workbook);
  form.append("manifest", new Blob([JSON.stringify(manifest)], {type: "application/json"}));
  return form;
}

export const draftImportService = {
  async template() {
    const response = await httpService.get<ApiEnvelope<{base64: string}>>(base + "/template");
    const bytes = Uint8Array.from(atob(response.data.base64), char => char.charCodeAt(0));
    const type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    return new Blob([bytes], {type});
  },
  async inspect(file: File) {
    const form = new FormData();
    form.append("file", file);
    return (await httpService.post<ApiEnvelope<CheckedWav>>(base + "/inspect-audio", form)).data;
  },
  async preview(workbook: File, manifest: CheckedWav[]) {
    return (await httpService.post<ApiEnvelope<DraftImportPreview>>(base + "/preview", formFor(workbook, manifest))).data;
  },
  async create(workbook: File, manifest: CheckedWav[], token: string) {
    const form = formFor(workbook, manifest);
    form.append("token", token);
    return (await httpService.post<ApiEnvelope<AssessmentDraft>>(base, form)).data;
  },
};
