import { useFetch } from "@shared/hooks";
import { useCallback } from "react";
import type {
  GrammarTopic,
  GrammarTopicManagementData,
  GrammarTopicStats,
} from "@features/grammar/types/grammar-topic-management.types";

const MOCK_TOPICS: GrammarTopic[] = [
  {
    id: "grammar-01",
    code: "GRM-01",
    titleVi: "Thứ hiện tại Đã",
    titleEn: "Present Simple Tense",
    description: "Cách dùng thứ hiện tại để mô tả thói quen và sự thật hiện nhiên.",
    cefr: "A2",
    lessonDone: 4,
    lessonTotal: 4,
    status: "published",
    updatedLabel: "2 giờ trước",
  },
  {
    id: "grammar-02",
    code: "GRM-02",
    titleVi: "Thứ hiện tại tiếp diễn",
    titleEn: "Present Continuous Tense",
    description: "Diễn đạt hành động đang diễn ra tại thời điểm nói.",
    cefr: "A2",
    lessonDone: 2,
    lessonTotal: 4,
    status: "in_progress",
    updatedLabel: "Hôm nay",
  },
  {
    id: "grammar-03",
    code: "GRM-03",
    titleVi: "Thứ quá khứ đơn",
    titleEn: "Past Simple Tense",
    description: "Quy tắc chia động từ ở thứ quá khứ, có dạng bất quy tắc.",
    cefr: "A2",
    lessonDone: 5,
    lessonTotal: 5,
    status: "published",
    updatedLabel: "Hôm qua",
  },
  {
    id: "grammar-04",
    code: "GRM-04",
    titleVi: "Động từ khuyết thiếu",
    titleEn: "Modal Verbs",
    description: "Cách dùng can, could, may, might trong giao tiếp hằng ngày.",
    cefr: "A1",
    lessonDone: 1,
    lessonTotal: 3,
    status: "draft",
    updatedLabel: "3 ngày trước",
  },
  {
    id: "grammar-05",
    code: "GRM-05",
    titleVi: "Câu điều kiện loại 1",
    titleEn: "First Conditional",
    description: "Câu trúc If + S + V, S + will + V để nói về tình huống có thể xảy ra.",
    cefr: "B1",
    lessonDone: 3,
    lessonTotal: 4,
    status: "in_progress",
    updatedLabel: "5 ngày trước",
  },
  {
    id: "grammar-06",
    code: "GRM-06",
    titleVi: "Mệnh đề quan hệ",
    titleEn: "Relative Clauses",
    description: "Dùng who, which, that để nối các mệnh đề trong văn bản.",
    cefr: "B1",
    lessonDone: 5,
    lessonTotal: 5,
    status: "published",
    updatedLabel: "1 tuần trước",
  },
  {
    id: "grammar-07",
    code: "GRM-07",
    titleVi: "So sánh hơn và nhất",
    titleEn: "Comparatives and Superlatives",
    description: "Câu trúc so sánh với tính từ ngắn và dài.",
    cefr: "A2",
    lessonDone: 3,
    lessonTotal: 3,
    status: "published",
    updatedLabel: "2 tuần trước",
  },
];

// Đọc lại với MOCK_TOPICS: KPI thống kê toàn bộ thư viện (24 chủ đề),
// còn danh sách bên dưới chỉ 7 dòng mẫu phục vụ độ dài 1:1 với Stitch.
const MOCK_STATS: GrammarTopicStats = {
  total: 24,
  published: 17,
  inProgress: 3,
  draft: 4,
};

export function useGrammarTopicManagement() {
  const fetchGrammarTopics = useCallback(async (signal: AbortSignal) => {
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    return { topics: MOCK_TOPICS, stats: MOCK_STATS } satisfies GrammarTopicManagementData;
  }, []);

  return useFetch(fetchGrammarTopics);
}
