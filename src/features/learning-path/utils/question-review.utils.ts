import { isQuestionReviewCheck, validRevision } from "@features/learning-path/types/question-management.types";
import type { QuestionReadiness } from "@features/learning-path/types/question-management.types";

export function canReviewQuestion(result: QuestionReadiness | null, revision: number | null, confirmed: Set<string>): boolean {
  return !!result && result.status === "DRAFT" && validRevision(result.revision) && result.revision === revision
    && result.structurallyValid && result.blockers.length === 0 && result.requiredReviewChecks.length > 0
    && result.requiredReviewChecks.every(check => isQuestionReviewCheck(check) && confirmed.has(check));
}
