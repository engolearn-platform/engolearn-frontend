import type { SpeakingProfile } from "@features/speaking/contract";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
export function validateSpeakingProfile(profile: SpeakingProfile): string[] {
  if (!profile.enabled) return [];
  const errors: string[] = [];
  if (!profile.level || !levels.includes(profile.level)) errors.push("Chọn trình độ CEFR hợp lệ.");
  if (!profile.description.trim()) errors.push("Nhập mô tả tình huống.");
  if (!profile.aiRole.trim()) errors.push("Nhập vai trò của AI.");
  if (!profile.learnerRole.trim()) errors.push("Nhập vai trò của người học.");
  if (!profile.fallbackReply.trim()) errors.push("Nhập câu trả lời dự phòng bằng tiếng Anh.");
  if (profile.fallbackHint && (!profile.fallbackHint.exampleEn.trim() || !profile.fallbackHint.explanationVi.trim())) {
    errors.push("Gợi ý cần có câu mẫu tiếng Anh và giải thích tiếng Việt, hoặc để trống cả hai.");
  }
  return errors;
}

export function isSpeakingProfileRevisionConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && (error as { status?: unknown }).status === 409;
}
