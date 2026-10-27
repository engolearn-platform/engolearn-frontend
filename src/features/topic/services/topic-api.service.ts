import type {
  AccessReceiptDto,
  AdvanceContentRequestDto,
  AnswerQuizRequestDto,
  AttemptDto,
  CefrLevelDto,
  CurrentQuizDto,
  ItemResultDto,
  ItemReviewDto,
  LessonContentDto,
  MyTopicPageDto,
  QuizAnswerDto,
  RetrySessionDto,
  StartAttemptRequestDto,
  StartTopicRetryRequestDto,
  TopicDetailDto,
  TopicPageDto,
  TopicProgressDto,
  TopicResultDto,
  ViewerDto,
} from "@features/topic/types/topic-api.types";
import { createTopicApiClient } from "./topic-api-client.ts";
import type { TopicApiClientOptions, TopicMutationOptions } from "./topic-api-client.ts";

export interface TopicBrowseQuery {
  level?: CefrLevelDto;
  keyword?: string;
  sort?: "recommended" | "duration";
  limit?: number;
  cursor?: string;
}

export interface MyTopicsQuery {
  status?: "IN_PROGRESS" | "COMPLETED";
  limit?: number;
  cursor?: string;
}

function idSegment(id: string) {
  if (!id.trim() || id === "." || id === "..") throw new TypeError("A non-empty resource ID is required.");
  return encodeURIComponent(id);
}

function queryString(query: TopicBrowseQuery | MyTopicsQuery) {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) parameters.set(key, String(value));
  }
  const encoded = parameters.toString();
  return encoded ? "?" + encoded : "";
}

export function createTopicApi(options: TopicApiClientOptions = {}) {
  const { request } = createTopicApiClient(options);
  const get = <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, { signal });
  const post = <T>(path: string, body: unknown, mutation: TopicMutationOptions) =>
    request<T>("POST", path, { ...mutation, body });

  return {
    getViewer: (signal?: AbortSignal) => get<ViewerDto>("/topic-learning/viewer", signal),
    browseTopics: (query: TopicBrowseQuery = {}, signal?: AbortSignal) =>
      get<TopicPageDto>("/topics" + queryString(query), signal),
    getMyTopics: (query: MyTopicsQuery = {}, signal?: AbortSignal) =>
      get<MyTopicPageDto>("/topics/mine" + queryString(query), signal),
    getTopicDetail: (topicId: string, signal?: AbortSignal) =>
      get<TopicDetailDto>("/topics/" + idSegment(topicId), signal),
    getTopicProgress: (topicId: string, signal?: AbortSignal) =>
      get<TopicProgressDto>("/topics/" + idSegment(topicId) + "/progress", signal),
    startAttempt: (itemId: string, body: StartAttemptRequestDto, mutation: TopicMutationOptions) =>
      post<AttemptDto>("/topic-items/" + idSegment(itemId) + "/attempts", body, mutation),
    getAttempt: (attemptId: string, signal?: AbortSignal) =>
      get<AttemptDto>("/topic-attempts/" + idSegment(attemptId), signal),
    recordAttemptAccess: (attemptId: string, mutation: TopicMutationOptions) =>
      post<AccessReceiptDto>("/topic-attempts/" + idSegment(attemptId) + "/access", undefined, mutation),
    getAttemptContent: (attemptId: string, signal?: AbortSignal) =>
      get<LessonContentDto>("/topic-attempts/" + idSegment(attemptId) + "/content", signal),
    advanceContent: (attemptId: string, body: AdvanceContentRequestDto, mutation: TopicMutationOptions) =>
      post<AttemptDto>("/topic-attempts/" + idSegment(attemptId) + "/advance", body, mutation),
    getCurrentQuiz: (attemptId: string, signal?: AbortSignal) =>
      get<CurrentQuizDto>("/topic-attempts/" + idSegment(attemptId) + "/quiz", signal),
    answerQuiz: (attemptId: string, quizId: string, body: AnswerQuizRequestDto, mutation: TopicMutationOptions) =>
      post<QuizAnswerDto>("/topic-attempts/" + idSegment(attemptId) + "/quizzes/" + idSegment(quizId) + "/answers", body, mutation),
    getItemResult: (attemptId: string, signal?: AbortSignal) =>
      get<ItemResultDto>("/topic-attempts/" + idSegment(attemptId) + "/result", signal),
    getItemReview: (attemptId: string, signal?: AbortSignal) =>
      get<ItemReviewDto>("/topic-attempts/" + idSegment(attemptId) + "/review", signal),
    getTopicResult: (topicId: string, signal?: AbortSignal) =>
      get<TopicResultDto>("/topics/" + idSegment(topicId) + "/result", signal),
    startTopicRetry: (topicId: string, body: StartTopicRetryRequestDto, mutation: TopicMutationOptions) =>
      post<RetrySessionDto>("/topics/" + idSegment(topicId) + "/retry-sessions", body, mutation),
    getRetrySession: (retrySessionId: string, signal?: AbortSignal) =>
      get<RetrySessionDto>("/topic-retry-sessions/" + idSegment(retrySessionId), signal),
  };
}

export const topicApi = createTopicApi();
