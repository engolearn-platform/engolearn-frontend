import { createTopicApi, topicApi } from "./topic-api.service.ts";
import { TopicApiError } from "./topic-api-client.ts";
import type { ViewerDto, TopicCardDto, TopicDetailDto, TopicPageDto, MyTopicPageDto, TopicProgressDto } from "@features/topic/types/topic-api.types";
import type { TopicBrowseQuery, MyTopicsQuery } from "./topic-api.service.ts";

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0;
const level = (value: unknown) => typeof value === "string" && ["A1", "A2", "B1", "B2", "C1", "C2"].includes(value);
function requireShape(condition: unknown): asserts condition {
  if (!condition) throw new TopicApiError(200, "CONTRACT_MISMATCH", "Topic API response does not match the target contract.");
}
function progress(value: unknown) {
  return value === null || (record(value) && ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(String(value.status)) && count(value.completedItemCount) && count(value.totalItemCount) && count(value.percent) && Number(value.percent) <= 100);
}
function card(value: unknown): value is TopicCardDto {
  return record(value) && typeof value.topicId === "string" && typeof value.titleVi === "string" &&
    level(value.cefrLevel) && count(value.vocabularyCount) && count(value.quizCount) &&
    count(value.durationMinutes) && count(value.totalItemCount) && typeof value.hasNewContent === "boolean" &&
    progress(value.progress) && record(value.startAvailability) && typeof value.startAvailability.allowed === "boolean";
}
function page<T extends TopicPageDto>(value: T): T {
  requireShape(record(value) && Array.isArray(value.items) && value.items.every(card) && count(value.total) &&
    typeof value.hasMore === "boolean" && (value.hasMore ? typeof value.nextCursor === "string" && value.nextCursor.length > 0 : value.nextCursor === null));
  return value;
}
export function createTopicCatalogService(api: ReturnType<typeof createTopicApi> = topicApi) {
  return {
    async viewer(signal: AbortSignal): Promise<ViewerDto> {
      const value = await api.getViewer(signal);
      requireShape(record(value) && (value.kind === "GUEST" || value.kind === "LEARNER"));
      requireShape(value.kind === "GUEST" ? value.learnerId === null && value.cefrLevel === null :
        typeof value.learnerId === "string" && value.learnerId.length > 0 && level(value.cefrLevel));
      return value;
    },
    async discover(query: TopicBrowseQuery, signal: AbortSignal): Promise<TopicPageDto> {
      const value = page(await api.browseTopics(query, signal));
      requireShape(value.items.every(item => item.progress === null || item.progress.status === "NOT_STARTED"));
      return value;
    },
    async mine(query: MyTopicsQuery, signal: AbortSignal): Promise<MyTopicPageDto> {
      const value = page(await api.getMyTopics(query, signal));
      requireShape(record(value.counts) && count(value.counts.inProgress) && count(value.counts.completed));
      requireShape(value.items.every(item => item.progress !== null && item.progress.status === (query.status ?? "IN_PROGRESS")));
      return value;
    },
    async detail(id: string, signal: AbortSignal): Promise<TopicDetailDto> {
      const value = await api.getTopicDetail(id, signal);
      requireShape(count(value.generation) && record(value.resetAvailability) && typeof value.resetAvailability.allowed === "boolean");
      requireShape(record(value) && typeof value.titleVi === "string" && typeof value.description === "string" &&
        level(value.cefrLevel) && progress(value.progress) && Array.isArray(value.items) && typeof value.hasNewContent === "boolean" && record(value.retryAvailability) && typeof value.retryAvailability.allowed === "boolean" &&
        [value.durationMinutes, value.vocabularyCount, value.expressionCount, value.quizCount].every(count));
      for (const item of value.items) {
        requireShape(record(item) && typeof item.topicItemId === "string" && typeof item.title === "string" &&
          typeof item.description === "string" && record(item.actions) && typeof item.hasNewContent === "boolean" && (item.learningStatus === null || ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(item.learningStatus)) &&
          [item.durationMinutes, item.vocabularyCount, item.expressionCount, item.quizCount].every(count));
        for (const key of ["start", "continue", "review", "retry", "resumeRetry", "restartRetry"]) {
          requireShape(record(item.actions[key as keyof typeof item.actions]) && typeof item.actions[key as keyof typeof item.actions].allowed === "boolean");
        }
      }
      return value;
    },
    async progress(id: string, signal: AbortSignal): Promise<TopicProgressDto> {
      const value = await api.getTopicProgress(id, signal);
      requireShape(record(value) && progress(value) && record(value.metrics) &&
        Object.values(value.metrics).length === 6 && Object.values(value.metrics).every(count));
      return value;
    },
  };
}
export const topicCatalogService = createTopicCatalogService();
