import type { ApiEnvelope, HttpError } from "@shared/services/http.service";
import { httpService } from "@shared/services/http.service";
import type { SpeakingProfile, SpeakingProfileState } from "@features/speaking/contract";

export class TopicSpeakingProfileError extends Error {
  readonly code: string;
  readonly status?: number;
  constructor(error: HttpError) { super(error.message); this.name = "TopicSpeakingProfileError"; this.code = error.code ?? "REQUEST_FAILED"; this.status = error.status; }
}
function profilePath(topicId: string, itemId?: string) {
  return itemId
    ? `/api/management/topics/${encodeURIComponent(topicId)}/items/${encodeURIComponent(itemId)}/speaking-profile`
    : `/api/management/topics/${encodeURIComponent(topicId)}/speaking-profile`;
}
async function data<T>(request: Promise<ApiEnvelope<T>>): Promise<T> {
  try { const response = await request; return response.data; }
  catch (cause) { throw new TopicSpeakingProfileError(cause as HttpError); }
}
export const topicSpeakingProfileService = {
  get(topicId: string, itemId?: string) { return data(httpService.get<ApiEnvelope<SpeakingProfileState>>(profilePath(topicId, itemId))); },
  save(topicId: string, itemId: string | undefined, revision: number, profile: SpeakingProfile) {
    return data(httpService.put<ApiEnvelope<SpeakingProfileState>>(profilePath(topicId, itemId), { revision, profile }));
  },
  publish(topicId: string, itemId: string | undefined, revision: number) {
    return data(httpService.post<ApiEnvelope<SpeakingProfileState>>(`${profilePath(topicId, itemId)}/publish`, { revision }));
  },
};
