import type { MicroSkillCatalogMetadata } from "@features/learning-path/types/micro-skill-catalog.types";
import type { PassageDetail, PassageLevel, PassageSkill, PassageStatus } from "./passage-management.types";

export const OPTION_IDS = ["A", "B", "C", "D"] as const;
export type OptionId = typeof OPTION_IDS[number];
export interface QuestionOption { optionId: string; text: string | null }
export interface QuestionListItem {
  questionId: string; skill: PassageSkill | null; microSkill: string | null; level: PassageLevel | null;
  passageId: string | null; prompt: string | null; status: PassageStatus | null; revision: number | null;
  createdAt: string | null; updatedAt: string | null;
}
export interface QuestionDetail extends QuestionListItem, MicroSkillCatalogMetadata {
  options: (QuestionOption | null)[] | null; correctOptionId: string | null; explanation: string | null;
  createdBy: string | null; updatedBy: string | null; passage: PassageDetail | null;
  publicationReview: { sourceRevision: number | null; passageId: string | null; passageRevision: number | null;
    confirmedChecks: string[] | null; reviewedBy: string | null; reviewedAt: string | null } | null;
}
export interface QuestionFilters { keyword: string; skill: PassageSkill | "ALL"; microSkill: string;
  level: PassageLevel | "ALL"; status: PassageStatus | "ALL"; passageId: string }
export interface QuestionListParams extends QuestionFilters { page: number; size: number }
export interface QuestionListResponse extends MicroSkillCatalogMetadata { items: QuestionListItem[]; page: number; size: number; totalElements: number; totalPages: number }
export interface QuestionInput { skill: PassageSkill; microSkill: string; level: PassageLevel; passageId: string;
  prompt: string; options: { optionId: OptionId; text: string }[]; correctOptionId: OptionId; explanation: string }
export interface QuestionMutationReceipt { questionId: string; status: PassageStatus; revision: number;
  createdBy: string; updatedBy: string; createdAt: string; updatedAt: string }
export interface QuestionIssue { code: string; field: string; message: string }
export const QUESTION_REVIEW_LABELS = {
  MICRO_SKILL_APPROPRIATE: "Câu hỏi đo đúng kỹ năng đã chọn.",
  LEVEL_APPROPRIATE: "Nguồn, câu hỏi và các lựa chọn phù hợp trình độ.",
  SINGLE_BEST_ANSWER_WITH_EVIDENCE: "Có đúng một đáp án tốt nhất với bằng chứng rõ ràng.",
  DISTRACTORS_PLAUSIBLE: "Các phương án nhiễu hợp lý và có chủ đích.",
  EXPLANATION_SUPPORTED: "Giải thích nêu đúng bằng chứng và cách suy luận.",
  STIMULUS_SUFFICIENT: "Nội dung được cung cấp đủ để trả lời, không cần kiến thức ngoài nguồn.",
  NO_ANSWER_LEAKAGE: "Nội dung và cách trình bày không vô tình tiết lộ đáp án.",
  AUDIO_MATCHES_TRANSCRIPT: "Đã nghe và xác nhận audio phát được, khớp transcript.",
  AUDIO_QUALITY_REVIEWED: "Đã kiểm tra chất lượng và độ phù hợp của bản ghi âm.",
} as const;
export type QuestionReviewCheck = keyof typeof QUESTION_REVIEW_LABELS;
export const isQuestionReviewCheck = (value: string): value is QuestionReviewCheck => Object.prototype.hasOwnProperty.call(QUESTION_REVIEW_LABELS, value);
export const validRevision = (value: number | null): value is number => typeof value === "number" && Number.isInteger(value) && value > 0 && value < 2147483647;
export interface QuestionReadiness { questionId: string; revision: number | null; status: string | null; structurallyValid: boolean;
  passageId: string | null; passageRevision: number | null; blockers: QuestionIssue[]; warnings: QuestionIssue[]; requiredReviewChecks: string[] }
export interface QuestionPublicationInput { revision: number; confirmedReviewChecks: QuestionReviewCheck[] }
export interface QuestionPublicationReceipt { questionId: string; status: "ACTIVE"; revision: number; reviewedRevision: number;
  passageId: string | null; reviewedPassageRevision: number | null; publishedBy: string; publishedAt: string;
  confirmedReviewChecks: QuestionReviewCheck[]; warnings: QuestionIssue[] }
export interface QuestionCoverage { microSkill: string | null; level: string | null; activeQuestionCountBefore: number | null;
  activeQuestionCountAfter: number | null; minimumRequired: number; eligibleAfter: boolean | null }
export interface QuestionCoverageWarning { code: string; message: string; coverage: QuestionCoverage }
export interface QuestionRetirementReceipt { questionId: string; status: "RETIRED"; revision: number; retiredBy: string; retiredAt: string;
  coverage: QuestionCoverage; warnings: QuestionCoverageWarning[] }
export interface QuestionReplacementInput { revision: number; replacementQuestionId: string; replacementRevision: number;
  confirmedReviewChecks: QuestionReviewCheck[]; confirmCoverageWarning: boolean }
export interface QuestionReplacementReceipt { retiredQuestion: Omit<QuestionRetirementReceipt, "coverage" | "warnings">;
  publishedQuestion: QuestionPublicationReceipt; coverage: QuestionCoverage[]; warnings: QuestionCoverageWarning[] }
