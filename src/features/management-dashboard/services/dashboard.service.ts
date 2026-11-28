import { httpService } from "@shared/services";
import type { DashboardSummary } from "@features/management-dashboard/types/dashboard.types";

type Envelope<T> = { data: T; timestamp?: string };

function assertCount(value: unknown, path: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 0) throw new Error(`Invalid dashboard summary: ${path}`);
}

function validateSummary(summary: DashboardSummary, includeAdministration: boolean): DashboardSummary {
  const values: [number, string][] = [
    [summary.content.topics.total, "content.topics.total"], [summary.content.topics.published, "content.topics.published"], [summary.content.topics.draft, "content.topics.draft"], [summary.content.topics.unpublished, "content.topics.unpublished"],
    [summary.content.grammar.total, "content.grammar.total"], [summary.content.grammar.published, "content.grammar.published"], [summary.content.grammar.draft, "content.grammar.draft"], [summary.content.grammar.inProgress, "content.grammar.inProgress"], [summary.content.grammar.archived, "content.grammar.archived"],
    [summary.content.passages.total, "content.passages.total"], [summary.content.passages.active, "content.passages.active"], [summary.content.passages.draft, "content.passages.draft"], [summary.content.passages.retired, "content.passages.retired"],
    [summary.content.learningPathQuestions.total, "content.learningPathQuestions.total"],
  ];
  if (includeAdministration && !summary.administration) throw new Error("Invalid dashboard summary: missing administration");
  if (includeAdministration && summary.administration) values.push([summary.administration.users.total, "administration.users.total"], [summary.administration.subscription.activePremium, "administration.subscription.activePremium"], [summary.administration.placement.testSets, "administration.placement.testSets"], [summary.administration.placement.questions, "administration.placement.questions"]);
  values.forEach(([value, path]) => assertCount(value, path));
  return includeAdministration ? summary : { content: summary.content };
}

export const dashboardService = {
  async getSummary(signal: AbortSignal, includeAdministration: boolean): Promise<DashboardSummary> {
    const response = await httpService.get<Envelope<DashboardSummary>>("/api/management/dashboard/summary", { signal });
    if (!response || typeof response !== "object" || !response.data || typeof response.data !== "object") throw new Error("Invalid dashboard summary response");
    return validateSummary(response.data, includeAdministration);
  },
};
