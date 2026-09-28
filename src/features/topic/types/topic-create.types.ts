import type { CefrLevel } from "./topic.types";

export interface TopicCreateCefrOption {
  value: CefrLevel;
  title: string;
  description: string;
}

export interface TopicCategoryOption {
  value: string;
  label: string;
}

export interface TopicCreateStep {
  index: number;
  title: string;
  note: string;
}

export interface TopicBasicInfoDraft {
  titleEn: string;
  titleVi: string;
  cefr: CefrLevel;
  category: string;
  duration: string;
  description: string;
  tags: string[];
  coverName: string;
  coverMeta: string;
}

export const TOPIC_CREATE_MAX_DESCRIPTION = 250;

export const TOPIC_CREATE_CEFR_OPTIONS: TopicCreateCefrOption[] = [
  {
    value: "A1",
    title: "Cơ bản",
    description: "Mẫu câu quen thuộc thường ngày",
  },
  {
    value: "A2",
    title: "Sơ trung cấp",
    description: "Giao tiếp tình huống trực tiếp",
  },
  {
    value: "B1",
    title: "Trung cấp",
    description: "Xử lý tình huống du lịch, làm việc",
  },
  {
    value: "B2",
    title: "Nâng cao",
    description: "Lưu loát với người bản xứ",
  },
];

export const TOPIC_CREATE_CATEGORY_OPTIONS: TopicCategoryOption[] = [
  { value: "dining-food", label: "Ẩm thực & Nhà hàng (Dining & Food)" },
  { value: "travel-hospitality", label: "Du lịch & Khách sạn (Travel & Hospitality)" },
  { value: "business-work", label: "Công sở & Kinh doanh (Business & Work)" },
  { value: "daily-social", label: "Đời sống xã hội (Daily Social Life)" },
  { value: "health-emergency", label: "Khám bệnh & Y tế (Health & Emergency)" },
];

export const TOPIC_CREATE_STEPS: TopicCreateStep[] = [
  { index: 0, title: "1. Thông tin chủ đề", note: "Đang thiết lập" },
  { index: 1, title: "2. Danh sách Topic Items", note: "0 / 4 bài học tạo mới" },
  { index: 2, title: "3. Kiểm tra & Xuất bản", note: "Chờ hoàn tất nội dung" },
];

export const TOPIC_CREATE_DEFAULT_TAGS: string[] = [
  "food",
  "restaurant",
  "dining",
  "daily conversation",
];

export const TOPIC_CREATE_DEFAULT_DRAFT: TopicBasicInfoDraft = {  titleEn: "Ordering Food at a Restaurant",
  titleVi: "Gọi món tại nhà hàng",
  cefr: "A2",
  category: "dining-food",
  duration: "Khoảng 45 phút học (4 bài học nhỏ)",
  description:
    "Học cách gọi món, hỏi về các món ăn trong thực đơn, diễn đạt yêu cầu đặc biệt và giao tiếp tự tin với nhân viên phục vụ.",
  tags: TOPIC_CREATE_DEFAULT_TAGS,
  coverName: "restaurant_cover_illustrated.webp",
  coverMeta: "Kích thước tệp: 348 KB • Đã kiểm duyệt nội dung",
};

/**
 * Step 2 — Danh sách Topic Items (Overview).
 * Mỗi item chỉ có 2 trạng thái chính: publication status (DRAFT/PUBLISHED)
 * và content completeness suy ra từ các thành phần nhỏ bên trong.
 * NOTE: union chữ hoa có chủ ý theo spec; chưa reuse `TopicStatus`
 * ("published" | "draft") — hợp nhất khi gắn API thật.
 */
export type TopicItemPublicationStatus = "DRAFT" | "PUBLISHED";

export type TopicItemStepKey = "context" | "vocabulary" | "expressions" | "quiz";

export type TopicItemStepState = "done" | "partial" | "empty";

export interface TopicItemStepSummary {
  key: TopicItemStepKey;
  label: string;
  detail: string;
  state: TopicItemStepState;
}

export type TopicItemCompleteness = "complete" | "partial" | "empty";

export function getTopicItemCompleteness(
  steps: TopicItemStepSummary[],
): TopicItemCompleteness {
  if (steps.length === 0 || steps.every((step) => step.state === "empty")) {
    return "empty";
  }
  if (steps.every((step) => step.state === "done")) {
    return "complete";
  }
  return "partial";
}

export interface TopicItemOverview {
  id: string;
  order: number;
  titleEn: string;
  titleVi: string;
  description: string;
  publicationStatus: TopicItemPublicationStatus;
  steps: TopicItemStepSummary[];
  updatedNote?: string;
}

export interface TopicScriptQualityCheck {
  id: string;
  label: string;
  value: string;
  passed: boolean;
}

export interface TopicScriptQuality {
  score: number;
  max: number;
  coverageNote: string;
  checks: TopicScriptQualityCheck[];
}

export const TOPIC_ITEMS_OVERVIEW_MOCK: TopicItemOverview[] = [
  {
    id: "arriving-restaurant",
    order: 1,
    titleEn: "Arriving at the Restaurant",
    titleVi: "(Đến nhà hàng & Đặt bàn)",
    description:
      "Chào hỏi lễ tân, xác nhận bàn đã đặt trước hoặc hỏi bàn trống cho số lượng người tương ứng.",
    publicationStatus: "PUBLISHED",
    steps: [
      { key: "context", label: "Bối cảnh", detail: "(1)", state: "done" },
      { key: "vocabulary", label: "Từ vựng", detail: "(4)", state: "done" },
      { key: "expressions", label: "Mẫu câu", detail: "(3)", state: "done" },
      { key: "quiz", label: "Luyện tập", detail: "(5)", state: "done" },
    ],
  },
  {
    id: "choosing-food",
    order: 2,
    titleEn: "Choosing Your Food",
    titleVi: "(Xem thực đơn & Chọn món)",
    description:
      "Hỏi gợi ý món ăn, đọc hiểu thực đơn và chọn món khai vị, món chính phù hợp khẩu vị.",
    publicationStatus: "DRAFT",
    updatedNote: "Cập nhật lần cuối: 10 phút trước",
    steps: [
      { key: "context", label: "Bối cảnh", detail: "(1)", state: "done" },
      { key: "vocabulary", label: "Từ vựng", detail: "(4 từ)", state: "done" },
      { key: "expressions", label: "Mẫu câu", detail: "(2/3)", state: "partial" },
      { key: "quiz", label: "Luyện tập", detail: "(Chưa có)", state: "empty" },
    ],
  },
  {
    id: "special-requests",
    order: 3,
    titleEn: "Asking for Special Requests",
    titleVi: "(Yêu cầu đặc biệt & Dị ứng)",
    description:
      "Yêu cầu món không cay, hỏi thành phần gây dị ứng và xin thêm đồ dùng bàn ăn cá nhân.",
    publicationStatus: "DRAFT",
    steps: [
      { key: "context", label: "Bối cảnh", detail: "(1)", state: "done" },
      { key: "vocabulary", label: "Từ vựng", detail: "(Chưa có)", state: "empty" },
      { key: "expressions", label: "Mẫu câu", detail: "(Chưa có)", state: "empty" },
      { key: "quiz", label: "Luyện tập", detail: "(Chưa có)", state: "empty" },
    ],
  },
  {
    id: "paying-bill",
    order: 4,
    titleEn: "Paying the Bill",
    titleVi: "(Thanh toán & Đánh giá)",
    description:
      "Xin hóa đơn, chọn hình thức thanh toán bằng thẻ/tiền mặt và tiền tip cho nhân viên phục vụ.",
    publicationStatus: "DRAFT",
    steps: [],
  },
];

export const TOPIC_SCRIPT_QUALITY_MOCK: TopicScriptQuality = {
  score: 68,
  max: 100,
  coverageNote:
    "Cần hoàn tất Quiz cho Item 02 & dữ liệu cho Item 04 để đạt điều kiện phát hành.",
  checks: [
    {
      id: "item-count",
      label: "Quy mô Topic Items (3-5 items)",
      value: "4 Items (Đạt)",
      passed: true,
    },
    {
      id: "core-vocab",
      label: "Tối thiểu 8 từ vựng cốt lõi",
      value: "8/8 từ (Đạt)",
      passed: true,
    },
    {
      id: "quiz-count",
      label: "Tối thiểu 10 câu hỏi kiểm tra",
      value: "5/10 câu",
      passed: false,
    },
    {
      id: "dialog-context",
      label: "Hội thoại mẫu & Ngữ cảnh",
      value: "3/4 items",
      passed: false,
    },
  ],
};
