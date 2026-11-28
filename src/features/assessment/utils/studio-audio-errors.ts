import type { HttpError } from "@shared/services/http.service";

export function studioAudioError(failure: unknown, step: string) {
  const error = failure as HttpError;
  if (error.code === "MEDIA_UNAVAILABLE") {
    const location = error.message.match(/^Phần \d+:/)?.[0];
    return `${step}: ${location ? location + " " : ""}không đọc được WAV từ kho âm thanh. Hãy thử lại. Nếu vẫn lỗi, liên hệ quản trị hệ thống.`;
  }
  return `${step}: ${error.message}`;
}
