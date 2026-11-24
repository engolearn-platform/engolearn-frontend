import type {
  PlacementInfoItem,
  PlacementIntroRule,
  PlacementNavItem,
} from "./types/placement.types";
import type {
  PlacementAttemptPage,
  PlacementQuestion,
} from "./types/placement-attempt.types";

export const PLACEMENT_ROUTES = {
  ROOT: "/placement",
  DEV_LOGIN: "/placement/dev-login",
  ATTEMPT_PATTERN: "/placement/attempts/:attemptId",
  ATTEMPT_SUBMITTED: "/placement/attempts/:attemptId/submitted",
  ATTEMPT_RESULT: "/placement/attempts/:attemptId/result",
  ATTEMPT_REVIEW: "/placement/attempts/:attemptId/review",
  attempt: (attemptId: string) => `/placement/attempts/${attemptId}`,
  attemptSubmitted: (attemptId: string) =>
    `/placement/attempts/${attemptId}/submitted`,
  attemptResult: (attemptId: string) =>
    `/placement/attempts/${attemptId}/result`,
  attemptReview: (attemptId: string) =>
    `/placement/attempts/${attemptId}/review`,
} as const;

export const PLACEMENT_PAGE_SIZE = 3;

/**
 * Groups consecutive questions into pages without ever mixing sections
 * (BR-F1.8: Reading before Listening), so a page break can land before
 * the section switch with a page of 1–2 questions.
 */
export function buildPlacementPages(
  questions: PlacementQuestion[],
  pageSize: number = PLACEMENT_PAGE_SIZE,
): PlacementAttemptPage[] {
  const pages: PlacementAttemptPage[] = [];
  let buffer: PlacementQuestion[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    pages.push({
      index: pages.length,
      section: buffer[0].section,
      questions: buffer,
      firstOrder: buffer[0].order,
      lastOrder: buffer[buffer.length - 1].order,
    });
    buffer = [];
  };

  questions.forEach((question) => {
    if (
      buffer.length > 0 &&
      (buffer[0].section !== question.section || buffer.length >= pageSize)
    ) {
      flush();
    }
    buffer.push(question);
  });
  flush();

  return pages;
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const PLACEMENT_PUBLIC_NAV_ITEMS: PlacementNavItem[] = [
  { id: "home", label: "Trang chủ", to: "/", enabled: true },
  { id: "vocabulary", label: "Từ vựng", to: "/topics", enabled: true },
  { id: "grammar", label: "Ngữ pháp", to: "/grammar", enabled: true },
  {
    id: "placement",
    label: "Đánh giá đầu vào",
    to: PLACEMENT_ROUTES.ROOT,
    enabled: true,
  },
  { id: "about", label: "Giới thiệu", to: "/about", enabled: false },
];

export const PLACEMENT_INTRO_INFO: PlacementInfoItem[] = [
  { id: "questions", value: "20 câu", label: "Câu hỏi" },
  { id: "duration", value: "15 phút", label: "Thời gian" },
  { id: "skills", value: "Reading & Listening", label: "Hai kỹ năng" },
  { id: "level", value: "A1–B2", label: "Mức đánh giá" },
];

export const PLACEMENT_INTRO_RULES: PlacementIntroRule[] = [
  { id: "skills", text: "Bài kiểm tra gồm Reading và Listening." },
  { id: "duration", text: "Bạn có 15 phút để hoàn thành." },
  { id: "audio", text: "Hãy bật âm thanh để làm phần Listening." },
  { id: "result", text: "Kết quả giúp EngoLearn đề xuất trình độ phù hợp." },
];
