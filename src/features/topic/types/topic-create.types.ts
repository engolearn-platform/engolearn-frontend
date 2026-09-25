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

export const TOPIC_CREATE_DEFAULT_DRAFT: TopicBasicInfoDraft = {
  titleEn: "Ordering Food at a Restaurant",
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
