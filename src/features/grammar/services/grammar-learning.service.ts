import { ROUTES } from "@shared/constants";
import { httpService, type ApiEnvelope } from "@shared/services";
import type {
  GrammarAnswerResponse,
  GrammarPracticeAnswer,
  GrammarPracticeSession,
  GrammarRoadmap,
  GrammarTheory,
  GrammarTopicDetail,
} from "@features/grammar/types/grammar.types";

const api = "/api/v1/grammar";
const topicPath = (topicId: string) => `/topics/${encodeURIComponent(topicId)}`;
const lessonPath = (topicId: string, lessonId: string) =>
  `${topicPath(topicId)}/lessons/${encodeURIComponent(lessonId)}`;
const sessionPath = (sessionId: string) => `${api}/practice/${encodeURIComponent(sessionId)}`;

export const grammarPaths = {
  roadmap: ROUTES.GRAMMAR,
  summary: (topicId: string) => `${ROUTES.GRAMMAR}${topicPath(topicId)}/summary`,
  topic: (topicId: string) => `${ROUTES.GRAMMAR}${topicPath(topicId)}`,
  lesson: (topicId: string, lessonId: string) => `${ROUTES.GRAMMAR}${lessonPath(topicId, lessonId)}`,
  practice(topicId: string, lessonId: string, sessionId: string) {
    return `${ROUTES.GRAMMAR}${lessonPath(topicId, lessonId)}/practice?session=${encodeURIComponent(sessionId)}`;
  },
};

async function data<T>(request: Promise<ApiEnvelope<T>>): Promise<T> {
  const response = await request;
  if (response?.data == null) throw new Error("Máy chủ trả phản hồi ngữ pháp không hợp lệ.");
  return response.data;
}

export const grammarLearning = {
  async getSummary(topicId: string, signal: AbortSignal) {
    const detail = await grammarLearning.getTopic(topicId, signal);
    if (detail.topic.status !== "COMPLETED") return { topic: detail.topic, lessons: [] };
    // Read only published learner content; never call markSeen or startPractice here.
    const lessons = await Promise.all(detail.lessons.map((lesson) => grammarLearning.getTheory(topicId, lesson.id, signal)));
    return { topic: detail.topic, lessons };
  },
  getRoadmap(signal: AbortSignal) {
    return data(httpService.get<ApiEnvelope<GrammarRoadmap>>(`${api}/roadmap`, { signal }));
  },
  getTopic(topicId: string, signal: AbortSignal) {
    return data(httpService.get<ApiEnvelope<GrammarTopicDetail>>(`${api}${topicPath(topicId)}`, { signal }));
  },
  getTheory(topicId: string, lessonId: string, signal: AbortSignal) {
    return data(httpService.get<ApiEnvelope<GrammarTheory>>(`${api}${lessonPath(topicId, lessonId)}`, { signal }));
  },
  async markSeen(topicId: string, lessonId: string, contentVersion: number, signal: AbortSignal) {
    await httpService.post(`${api}${lessonPath(topicId, lessonId)}/seen`, { contentVersion }, { signal });
  },
  startPractice(topicId: string, lessonId: string, restart: boolean, signal: AbortSignal) {
    return data(httpService.post<ApiEnvelope<GrammarPracticeSession>>(
      `${api}${lessonPath(topicId, lessonId)}/practice`, { restart }, { signal },
    ));
  },
  getPractice(sessionId: string, signal: AbortSignal) {
    return data(httpService.get<ApiEnvelope<GrammarPracticeSession>>(sessionPath(sessionId), { signal }));
  },
  answer(sessionId: string, body: GrammarPracticeAnswer, signal: AbortSignal) {
    return data(httpService.post<ApiEnvelope<GrammarAnswerResponse>>(
      `${sessionPath(sessionId)}/answers`, body, { signal },
    ));
  },
};
