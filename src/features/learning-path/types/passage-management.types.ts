export type PassageSkill = "READING" | "LISTENING";
export type PassageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type PassageStatus = "DRAFT" | "ACTIVE" | "RETIRED";

export interface PassageListItem {
  passageId: string;
  title: string;
  skill: PassageSkill;
  level: PassageLevel;
  status: PassageStatus;
  revision: number;
  hasAudio: boolean;
  referencingQuestionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PassageDetail extends Omit<PassageListItem, "hasAudio" | "referencingQuestionCount"> {
  text: string | null;
  transcript: string | null;
  audioMediaId: string | null;
  createdBy: string | null;
  audio: {
    url: string;
    expiresAt: string | null;
    contentType: string | null;
    durationSec: number | null;
    format: string | null;
  } | null;
}

export interface PassageCounters { total: number; draft: number; active: number; retired: number }
export interface PassageReadinessIssue { code: string; field: string; message: string }
export interface PassageReadiness {
  passageId: string;
  revision: number | null;
  status: string | null;
  structurallyValid: boolean;
  referencingQuestionCount: number;
  incompatibleQuestionCount: number;
  blockers: PassageReadinessIssue[];
  warnings: PassageReadinessIssue[];
  requiredReviewChecks: string[];
}
export interface PassageListResponse {
  items: PassageListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  counters: PassageCounters;
}
export interface PassageFilters {
  keyword: string;
  skill: PassageSkill | "ALL";
  level: PassageLevel | "ALL";
  status: PassageStatus | "ALL";
}
export interface PassageListParams extends PassageFilters { page: number; size: number }
export interface PassageInput {
  title: string;
  skill: PassageSkill;
  level: PassageLevel;
  text?: string;
  transcript?: string;
  revision?: number;
}

export const PASSAGE_STATUS_LABELS: Record<PassageStatus, string> = {
  DRAFT: "Bản nháp", ACTIVE: "Đang sử dụng", RETIRED: "Ngừng sử dụng",
};
export const PASSAGE_SKILL_LABELS: Record<PassageSkill, string> = {
  READING: "Reading", LISTENING: "Listening",
};
export const PASSAGE_LEVELS: PassageLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
