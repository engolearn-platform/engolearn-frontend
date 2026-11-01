import { httpService, getDevUserKey } from "@shared/services/http.service";
import type { AnswerCommand, AssessmentResult, AssessmentState, FinishStageCommand, HistoryItem, Media, Preparation, Review } from "@features/assessment/types/assessment.types";
const base = "/api/v1/assessment";
type Envelope<T> = {data: T};
const headers = (binding: string) => ({"X-Assessment-Binding": binding});
export const assessmentApi = {
  preparation: (signal: AbortSignal) => httpService.get<Envelope<Preparation>>(base + "/preparation", {signal}).then(r => r.data),
  sound: () => httpService.get<Envelope<Media>>(base + "/sound-check").then(r => r.data),
  start: (requestId: string, binding: string) => httpService.post<Envelope<AssessmentState>>(base + "/attempts", {requestId, binding, confirmed: true, soundChecked: true}).then(r => r.data),
  state: (id: string, binding: string) => httpService.get<Envelope<AssessmentState>>(`${base}/attempts/${id}`, {headers: headers(binding)}).then(r => r.data),
  answer: (id: string, binding: string, command: AnswerCommand) => httpService.put<Envelope<AssessmentState>>(`${base}/attempts/${id}/answer`, command, {headers: headers(binding)}).then(r => r.data),
  next: (id: string, binding: string, command: AnswerCommand) => httpService.post<Envelope<AssessmentState>>(`${base}/attempts/${id}/next`, command, {headers: headers(binding)}).then(r => r.data),
  finishStage: (id: string, binding: string, command: FinishStageCommand) => httpService.post<Envelope<AssessmentState>>(`${base}/attempts/${id}/finish-stage`, command, {headers: headers(binding)}).then(r => r.data),
  submit: (id: string, binding: string) => httpService.post<Envelope<AssessmentState>>(`${base}/attempts/${id}/submit`, {confirmed: true}, {headers: headers(binding)}).then(r => r.data),
  abandon: (id: string) => httpService.post<Envelope<AssessmentState>>(`${base}/attempts/${id}/abandon`, {confirmed: true}).then(r => r.data),
  audio: (id: string, binding: string, unitIndex: number, issueId: string) => httpService.post<Envelope<Media>>(`${base}/attempts/${id}/audio`, {unitIndex, issueId}, {headers: headers(binding)}).then(r => r.data),
  audioFailure: (id: string, binding: string, unitIndex: number, reason: "LOAD_FAILED" | "PLAYBACK_FAILED" | "AUTOPLAY_BLOCKED") => httpService.post(`${base}/attempts/${id}/audio-failure`, {unitIndex, reason}, {headers: headers(binding)}),
  history: (page: number, signal: AbortSignal) => httpService.get<Envelope<HistoryItem[]>>(base + "/attempts", {params: {page: String(page), size: "20"}, signal}).then(r => r.data),
  result: (id: string, signal: AbortSignal) => httpService.get<Envelope<AssessmentResult>>(`${base}/attempts/${id}/result`, {signal}).then(r => r.data),
  review: (id: string, signal: AbortSignal) => httpService.get<Envelope<Review>>(`${base}/attempts/${id}/review`, {signal}).then(r => r.data),
  reviewAudio: (id: string, index: number) => httpService.get<Envelope<Media>>(`${base}/attempts/${id}/review/audio/${index}`).then(r => r.data),
};
export function leaveHeaders(): Record<string, string> {
  return import.meta.env.DEV ? {"X-Dev-User-Id": getDevUserKey()} : {};
}
export function abandonOnLeave(id: string, identityHeaders: Record<string, string>) {
  void httpService.post(base + `/attempts/${id}/abandon`, {confirmed: true}, {headers: identityHeaders, keepalive: true}).catch(() => undefined);
}
export function mediaUrl(media: Media) {
  const raw = atob(media.base64);
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], {type: media.mimeType}));
}
