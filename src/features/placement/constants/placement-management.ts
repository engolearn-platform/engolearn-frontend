export const PLACEMENT_MANAGEMENT_ROOT = "/admin/placement";
export const MANAGEMENT_PATHS = {
  root: PLACEMENT_MANAGEMENT_ROOT,
  questions: `${PLACEMENT_MANAGEMENT_ROOT}/questions`,
  newQuestion: `${PLACEMENT_MANAGEMENT_ROOT}/questions/new`,
  importQuestions: `${PLACEMENT_MANAGEMENT_ROOT}/questions/import`,
  sets: `${PLACEMENT_MANAGEMENT_ROOT}/test-sets`,
  attempts: `${PLACEMENT_MANAGEMENT_ROOT}/attempts`,
  editQuestion: (id: string) => `${PLACEMENT_MANAGEMENT_ROOT}/questions/${encodeURIComponent(id)}/edit`,
  editSet: (id: string) => `${PLACEMENT_MANAGEMENT_ROOT}/test-sets/${encodeURIComponent(id)}/edit`,
  previewSet: (id: string) => `${PLACEMENT_MANAGEMENT_ROOT}/test-sets/${encodeURIComponent(id)}/preview`,
  attempt: (id: string) => `${PLACEMENT_MANAGEMENT_ROOT}/attempts/${encodeURIComponent(id)}`,
};
export const MANAGEMENT_LEVELS = ["A1", "A2", "B1", "B2"] as const;
export const MANAGEMENT_SKILLS = ["READING", "LISTENING"] as const;
export const MANAGEMENT_SKILL_LABEL = { READING: "Reading", LISTENING: "Listening" };
export const MANAGEMENT_SET_LABEL = { DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", ARCHIVED: "Đã lưu trữ" };
export const MANAGEMENT_ATTEMPT_LABEL = { IN_PROGRESS: "Đang làm", SUBMITTED: "Đã nộp bài", AUTO_SUBMITTED: "Tự nộp khi hết giờ", EXPIRED: "Hết hạn" };
