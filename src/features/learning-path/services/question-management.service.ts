import { httpService } from "@shared/services/http.service";
import type { ApiEnvelope, HttpError } from "@shared/services/http.service";
import type { QuestionCoverage, QuestionCoverageWarning, QuestionDetail, QuestionInput, QuestionIssue, QuestionListParams,
  QuestionListResponse, QuestionMutationReceipt, QuestionPublicationInput, QuestionPublicationReceipt, QuestionReadiness,
  QuestionReplacementInput, QuestionReplacementReceipt, QuestionRetirementReceipt } from "@features/learning-path/types/question-management.types";

export type QuestionManagementError = HttpError & { readiness?: QuestionReadiness; coverageWarnings?: QuestionCoverageWarning[] };
const endpoint = "/api/management/learning-paths/questions";
const itemUrl = (id: string) => `${endpoint}/${encodeURIComponent(id)}`;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object";
const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const nullableCount = (value: unknown) => value === null || count(value);
function issues(value: unknown): value is QuestionIssue[] {
  return Array.isArray(value) && value.every(item => object(item) && typeof item.code === "string" && typeof item.field === "string" && typeof item.message === "string");
}
function readiness(value: unknown): value is QuestionReadiness {
  return object(value) && typeof value.questionId === "string" && nullableCount(value.revision)
    && (value.status === null || typeof value.status === "string") && typeof value.structurallyValid === "boolean"
    && (value.passageId === null || typeof value.passageId === "string") && nullableCount(value.passageRevision)
    && issues(value.blockers) && issues(value.warnings) && Array.isArray(value.requiredReviewChecks)
    && value.requiredReviewChecks.every(check => typeof check === "string");
}
function coverage(value: unknown): value is QuestionCoverage {
  return object(value) && (value.microSkill === null || typeof value.microSkill === "string")
    && (value.level === null || typeof value.level === "string") && nullableCount(value.activeQuestionCountBefore)
    && nullableCount(value.activeQuestionCountAfter) && count(value.minimumRequired) && value.minimumRequired > 0
    && (value.eligibleAfter === null || typeof value.eligibleAfter === "boolean");
}
function warnings(value: unknown): value is QuestionCoverageWarning[] {
  return Array.isArray(value) && value.every(item => object(item) && typeof item.code === "string" && typeof item.message === "string" && coverage(item.coverage));
}
function publication(receipt: QuestionPublicationReceipt | undefined, id: string, input: QuestionPublicationInput) {
  return receipt?.questionId === id && receipt.status === "ACTIVE" && receipt.revision === input.revision + 1
    && receipt.reviewedRevision === input.revision && issues(receipt.warnings)
    && Array.isArray(receipt.confirmedReviewChecks) && receipt.confirmedReviewChecks.length === input.confirmedReviewChecks.length
    && input.confirmedReviewChecks.every(check => receipt.confirmedReviewChecks.includes(check));
}
async function mutate<T>(id: string, operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (reason) {
    if (reason instanceof Error) {
      const failure = reason as QuestionManagementError;
      if (object(failure.problem)) {
        if (readiness(failure.problem.readiness)) failure.readiness = failure.problem.readiness;
        if (failure.code === "QUESTION_COVERAGE_CONFIRMATION_REQUIRED" && failure.problem.confirmationRequired === true
          && warnings(failure.problem.warnings) && failure.problem.warnings.length > 0
          && failure.problem.warnings.every(value => ["BELOW_MINIMUM_ACTIVE_QUESTIONS", "COVERAGE_UNDETERMINED"].includes(value.code))) {
          failure.coverageWarnings = failure.problem.warnings;
        }
      }
      if (failure.readiness && failure.readiness.questionId !== id) delete failure.readiness;
    }
    throw reason;
  }
}
function uncertain(): never { throw new Error("Chưa xác định được kết quả. Hãy đóng và tải lại trạng thái trước khi thử lại."); }
export const questionManagementService = {
  async list(query: QuestionListParams, signal?: AbortSignal): Promise<QuestionListResponse> {
    const params: Record<string, string> = { page: String(query.page), size: String(query.size) };
    for (const key of ["keyword", "microSkill", "passageId"] as const) if (query[key].trim()) params[key] = query[key].trim();
    for (const key of ["skill", "level", "status"] as const) if (query[key] !== "ALL") params[key] = query[key];
    const { data } = await httpService.get<ApiEnvelope<QuestionListResponse>>(endpoint, { params, signal });
    if (!data || !Array.isArray(data.items) || !data.items.every(item => typeof item.questionId === "string" && item.questionId.length > 0)
      || !count(data.page) || !count(data.size) || !count(data.totalElements) || !count(data.totalPages)) throw new Error("Danh sách câu hỏi trả về không hợp lệ.");
    return data;
  },
  async detail(id: string, signal?: AbortSignal): Promise<QuestionDetail> {
    const { data } = await httpService.get<ApiEnvelope<QuestionDetail>>(itemUrl(id), { signal });
    if (!data || data.questionId !== id) throw new Error("Không xác định được câu hỏi cần xem.");
    return data;
  },
  async create(input: QuestionInput, signal?: AbortSignal): Promise<QuestionMutationReceipt> {
    const { data } = await httpService.post<ApiEnvelope<QuestionMutationReceipt>>(endpoint, input, { signal });
    if (!data || !data.questionId || data.status !== "DRAFT" || data.revision !== 1) uncertain();
    return data;
  },
  async update(id: string, input: QuestionInput & { revision: number }, signal?: AbortSignal): Promise<QuestionMutationReceipt> {
    const { data } = await httpService.patch<ApiEnvelope<QuestionMutationReceipt>>(itemUrl(id), input, { signal });
    if (!data || data.questionId !== id || data.status !== "DRAFT" || data.revision !== input.revision + 1) uncertain();
    return data;
  },
  async delete(id: string, revision: number, signal?: AbortSignal): Promise<void> {
    const { data } = await httpService.delete<ApiEnvelope<{ questionId: string; deleted: boolean }>>(itemUrl(id), { params: { revision: String(revision) }, signal });
    if (!data || data.questionId !== id || data.deleted !== true) uncertain();
  },
  async copy(id: string, revision: number, signal?: AbortSignal): Promise<QuestionMutationReceipt> {
    const { data } = await httpService.post<ApiEnvelope<QuestionMutationReceipt>>(`${itemUrl(id)}/copy`, { revision }, { signal });
    if (!data || !data.questionId || data.questionId === id || data.status !== "DRAFT" || data.revision !== 1) uncertain();
    return data;
  },
  async readiness(id: string, signal?: AbortSignal): Promise<QuestionReadiness> {
    const { data } = await httpService.get<ApiEnvelope<QuestionReadiness>>(`${itemUrl(id)}/readiness`, { signal });
    if (!readiness(data) || data.questionId !== id) throw new Error("Kết quả kiểm tra không hợp lệ. Hãy tải lại.");
    return data;
  },
  async publish(id: string, input: QuestionPublicationInput, signal?: AbortSignal): Promise<QuestionPublicationReceipt> {
    return mutate(id, async () => {
      const { data } = await httpService.post<ApiEnvelope<QuestionPublicationReceipt>>(`${itemUrl(id)}/publish`, input, { signal });
      if (!publication(data, id, input)) uncertain();
      return data;
    });
  },
  async retire(id: string, revision: number, confirmCoverageWarning: boolean, signal?: AbortSignal): Promise<QuestionRetirementReceipt> {
    return mutate(id, async () => {
      const { data } = await httpService.post<ApiEnvelope<QuestionRetirementReceipt>>(`${itemUrl(id)}/retire`, { revision, confirmCoverageWarning }, { signal });
      if (!data || data.questionId !== id || data.status !== "RETIRED" || data.revision !== revision + 1 || !coverage(data.coverage) || !warnings(data.warnings)) uncertain();
      return data;
    });
  },
  async replace(id: string, input: QuestionReplacementInput, signal?: AbortSignal): Promise<QuestionReplacementReceipt> {
    return mutate(input.replacementQuestionId, async () => {
      const { data } = await httpService.post<ApiEnvelope<QuestionReplacementReceipt>>(`${itemUrl(id)}/replace`, input, { signal });
      if (!data || data.retiredQuestion?.questionId !== id || data.retiredQuestion.status !== "RETIRED" || data.retiredQuestion.revision !== input.revision + 1
        || !publication(data.publishedQuestion, input.replacementQuestionId, { revision: input.replacementRevision, confirmedReviewChecks: input.confirmedReviewChecks })
        || !Array.isArray(data.coverage) || !data.coverage.every(coverage) || !warnings(data.warnings)) uncertain();
      return data;
    });
  },
};
