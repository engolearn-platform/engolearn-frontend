import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { ROUTES } from "@shared/constants";
import type {
  ExpressionGroupStep,
  ExpressionPurpose,
  TopicExpressions,
} from "../types/topic-expressions.types";

const TOPIC_TITLE = "Thói quen hằng ngày — Buổi sáng năng động";
const TOPIC_LABEL = "Chủ điểm: Thói quen buổi sáng";
const CEFR_BADGE = "CEFR A1–A2";
const STAGE_LABEL = "Giai đoạn 3 / 4";

const PURPOSES: ExpressionPurpose[] = [
  {
    id: "ask-routine",
    purposeEn: "Asking about a routine",
    purposeVi: "HỎI VỀ THÓI QUEN",
    orderIndex: 1,
    examples: [
      {
        id: "ex-1-1",
        type: "BASIC_SUGGESTION",
        textEn: "“What do you usually do in the morning?”",
        textVi: "→ “Bạn thường làm gì vào buổi sáng?”",
        usageNote:
          "Dùng để mở đầu cuộc trò chuyện tự nhiên về lịch trình hàng ngày",
        audioUrl: null,
      },
      {
        id: "ex-1-2",
        type: "POLITE_INQUIRY",
        textEn: "“What time do you usually get up / wake up?”",
        textVi: "→ “Bạn thường thức dậy lúc mấy giờ?”",
        usageNote:
          "Linh hoạt: wake up (tỉnh giấc) & get up (rời giường)",
        audioUrl: null,
      },
    ],
  },
  {
    id: "talk-routine",
    purposeEn: "Talking about your routine",
    purposeVi: "NÓI VỀ THÓI QUEN CỦA BẢN THÂN",
    orderIndex: 2,
    examples: [
      {
        id: "ex-2-1",
        type: "SLOT_PATTERN",
        textEn:
          "“I usually [wake up / have breakfast] before I go to work.”",
        textVi: "→ “Tôi thường [thức dậy / ăn sáng] trước khi đi làm.”",
        usageNote:
          "Thay cụm từ trong ngoặc theo thói quen thực tế của bạn",
        audioUrl: null,
      },
      {
        id: "ex-2-2",
        type: "BASIC_SUGGESTION",
        textEn: "“I normally spend about 15 minutes to get dressed.”",
        textVi: "→ “Tôi thường dành khoảng 15 phút để chuẩn bị trang phục.”",
        usageNote:
          "Cấu trúc vàng: spend + [thời gian] + to + [hành động]",
        audioUrl: null,
      },
    ],
  },
  {
    id: "sequence",
    purposeEn: "Sequencing actions",
    purposeVi: "DIỄN TẢ TRÌNH TỰ CÁC HOẠT ĐỘNG",
    orderIndex: 3,
    examples: [],
    sequenceExample: {
      textEn:
        "“First, I wake up early. Then, I have breakfast. After that, I get ready.”",
      textVi:
        "→ “Đầu tiên, tôi dậy sớm. Sau đó tôi ăn sáng. Tiếp theo đó, tôi chuẩn bị ra ngoài.”",
      audioUrl: null,
    },
    connectingWords: [
      {
        id: "cw-1",
        orderIndex: 1,
        wordEn: "First",
        wordVi: "Đầu tiên",
        usageNote: "Mở đầu chuỗi hành động",
      },
      {
        id: "cw-2",
        orderIndex: 2,
        wordEn: "Then",
        wordVi: "Sau đó",
        usageNote: "Hành động tiếp theo",
      },
      {
        id: "cw-3",
        orderIndex: 3,
        wordEn: "After that",
        wordVi: "Tiếp theo đó",
        usageNote: "Chuyển tiếp tự nhiên",
      },
    ],
  },
];

export function buildTopicExpressionSteps(): ExpressionGroupStep[] {
  return PURPOSES.map((p, i) => ({
    id: p.id,
    label: `${i + 1}. ${p.purposeVi.toLowerCase()}`,
  }));
}

const MOCK_DATA: TopicExpressions = {
  id: "morning-routine",
  topicId: "morning-routine",
  topicTitle: TOPIC_TITLE,
  stageLabel: STAGE_LABEL,
  topicLabel: TOPIC_LABEL,
  cefrBadge: CEFR_BADGE,
  progressText: "Mẫu câu 3 nhóm",
  steps: buildTopicExpressionSteps(),
  heroStageTag: "Giai đoạn 3: Mẫu câu giao tiếp",
  heroSectionBadge: "USEFUL EXPRESSIONS",
  heroTitle: "Mẫu câu thực tế: Trò chuyện về thói quen buổi sáng",
  heroDescription:
    "Các mẫu câu được cấu trúc theo tình huống thực tế thường ngày, giúp bạn tự tin chia sẻ và hỏi thăm lịch trình buổi sáng với bạn bè hoặc đồng nghiệp.",
  heroMeta: [
    { icon: "school", label: "CEFR A1-A2" },
    { icon: "forum", label: "3 nhóm giao tiếp" },
    { icon: "mic", label: "Phản xạ ngữ điệu tự nhiên" },
    { icon: "timer", label: "~5 phút học" },
  ],
  purposes: PURPOSES,
  readinessTitle: "Sẵn sàng kiểm tra phản xạ?",
  readinessDescription:
    "Áp dụng các mẫu câu trên vào 5 tình huống hỏi đáp nhanh.",
  readinessQuestionCountLabel: "5 câu hỏi",
  readinessExpLabel: "+50 EXP",
  lessonPrevLabel: "Ôn lại từ vựng",
  lessonNextLabel: "Chuyển sang Luyện tập (Quiz)",
  progressPercent: 75,
  progressNote:
    "Bạn đang ở giai đoạn luyện nói mẫu câu thực tế trước khi vào bài tập phản xạ.",
  structureHeading: "Cấu trúc chủ đề",
  structure: [
    { id: "context", label: "1. Ngữ cảnh & Hội thoại", state: "done", to: "context" },
    { id: "vocab", label: "2. Từ vựng cốt lõi", state: "done", to: "vocab" },
    { id: "expressions", label: "3. Mẫu câu thực tế", state: "active" },
    { id: "practice", label: "4. Luyện tập & Phản xạ", state: "locked" },
  ],
  memoryTipTitle: "Mẹo ghi nhớ Engo",
  memoryTipText:
    "Sử dụng kỹ thuật nối âm và thay thế linh hoạt các từ vựng đã học vào các vị trí trong ngoặc để tạo phản xạ giao tiếp tự nhiên.",
};

export function useTopicExpressions(topicId: string) {
  const fetchTopicExpressions = useCallback(
    async (signal: AbortSignal): Promise<TopicExpressions> => {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return { ...MOCK_DATA, topicId: topicId || MOCK_DATA.topicId };
    },
    [topicId],
  );

  const { data, loading, error, refetch } =
    useFetch<TopicExpressions>(fetchTopicExpressions);

  return { data, loading, error, refetch };
}

/** Absolute path to expressions of a topic. */
export function buildTopicExpressionsPath(topicId: string): string {
  return ROUTES.TOPIC_EXPRESSIONS.replace(":topicId", topicId);
}