import { httpService, type ApiEnvelope } from "@shared/services";
import type {
  GrammarCheck, GrammarLesson, GrammarLessonInput, GrammarTopic, GrammarTopicInput, GrammarTopicsPage, GrammarTopicsQuery,
} from "@features/grammar/types/grammar-content.types";

const topics = "/api/v1/grammar/admin/topics";
const topic = (id: string) => `${topics}/${encodeURIComponent(id)}`;
const lessons = (id: string) => `${topic(id)}/lessons`;
const lesson = (id: string, child: string) => `${lessons(id)}/${encodeURIComponent(child)}`;

async function data<T>(request: Promise<ApiEnvelope<T>>): Promise<T> {
  const response = await request;
  if (!response || !("data" in response)) throw new Error("Máy chủ trả phản hồi ngữ pháp không hợp lệ.");
  return response.data;
}

function topicInput({ titleVi, titleEn, description, level, version, order }: GrammarTopicInput) {
  return { titleVi, titleEn, description, level, version, order };
}

function lessonInput({ titleVi, titleEn, objective, tags, order, version, blocks, questions }: GrammarLessonInput) {
  return { titleVi, titleEn, objective, tags, order, version, blocks, questions };
}

export const grammarManagement = {
  listTopics(filters: GrammarTopicsQuery = {}, signal?: AbortSignal) {
    const params = Object.fromEntries(Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== "" && value !== "ALL")
      .map(([key, value]) => [key, String(value)]));
    return data(httpService.get<ApiEnvelope<GrammarTopicsPage>>(topics, { params, signal }));
  },
  getTopic(id: string, signal?: AbortSignal) {
    return data(httpService.get<ApiEnvelope<GrammarTopic>>(topic(id), { signal }));
  },
  createTopic(body: GrammarTopicInput) {
    return data(httpService.post<ApiEnvelope<GrammarTopic>>(topics, topicInput(body)));
  },
  saveTopic(id: string, body: GrammarTopicInput) {
    return data(httpService.put<ApiEnvelope<GrammarTopic>>(topic(id), topicInput(body)));
  },
  async deleteTopic(id: string, version: number) {
    await httpService.delete(topic(id), { params: { version: String(version) } });
  },
  topicChecklist(id: string, signal?: AbortSignal) {
    return data(httpService.get<ApiEnvelope<{ checks: GrammarCheck[] }>>(`${topic(id)}/checklist`, { signal }));
  },
  topicAction(id: string, action: "publish" | "archive" | "restore", version: number) {
    return data(httpService.post<ApiEnvelope<GrammarTopic>>(`${topic(id)}/${action}`, { version }));
  },
  createLesson(id: string, body: GrammarLessonInput) {
    return data(httpService.post<ApiEnvelope<GrammarLesson>>(lessons(id), lessonInput(body)));
  },
  getLesson(id: string, child: string, signal?: AbortSignal) {
    return data(httpService.get<ApiEnvelope<GrammarLesson>>(lesson(id, child), { signal }));
  },
  saveLesson(id: string, child: string, body: GrammarLessonInput) {
    return data(httpService.put<ApiEnvelope<GrammarLesson>>(lesson(id, child), lessonInput(body)));
  },
  async deleteLesson(id: string, child: string, version: number) {
    await httpService.delete(lesson(id, child), { params: { version: String(version) } });
  },
  lessonChecklist(id: string, child: string, signal?: AbortSignal) {
    return data(httpService.get<ApiEnvelope<{ checks: GrammarCheck[] }>>(`${lesson(id, child)}/checklist`, { signal }));
  },
  lessonAction(id: string, child: string, action: "ready" | "apply" | "discard-draft", version: number, confirmPublish = false) {
    return data(httpService.post<ApiEnvelope<GrammarLesson>>(`${lesson(id, child)}/${action}`, { version, confirmPublish }));
  },
};
