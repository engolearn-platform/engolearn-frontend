import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import type { TopicDetail } from "../types/topic-detail.types";

const MOCK_TOPIC_DETAIL: TopicDetail = {
  id: "morning-routine",
  parentLabel: "Chủ đề",
  title: "Thói quen hằng ngày",
  description:
    "Kể về các hoạt động trong ngày qua các tình huống giao tiếp thực tế",
  cefrBadge: "A1 - A2",
  overview: {
    vocabLabel: "12 Từ vựng",
    expressionLabel: "9 Mẫu câu",
    practiceLabel: "18 Bài tập tình huống",
  },
  units: [
    {
      id: "unit-1",
      indexLabel: "Unit 1",
      title: "Unit 1: Giới thiệu bản thân & Chào hỏi",
      description:
        "Làm quen, chào hỏi tự nhiên và giới thiệu quê quán, nghề nghiệp cơ bản.",
      durationLabel: "5 phút",
      state: "completed",
      vocabCount: 4,
      expressionCount: 3,
      practiceCount: 5,
      preview: {
        vocab: ["nice to meet you", "introduce", "from"],
        expressions: ["Nice to meet you!", "Where are you from?"],
        practiceLabel: "Luyện tập ngữ cảnh (5 câu hỏi thực hành hội thoại)",
      },
      stateBadge: "Hoàn thành",
      hasUpdates: true,
      updatesLabel: "Có nội dung mới",
    },
    {
      id: "unit-2",
      indexLabel: "Unit 2",
      title: "Unit 2: Thói quen hằng ngày — Buổi sáng năng động",
      description:
        "Mô tả chuỗi hành động buổi sáng từ thức dậy đến khi ra khỏi nhà.",
      durationLabel: "10 phút",
      state: "current",
      vocabCount: 4,
      expressionCount: 3,
      practiceCount: 5,
      preview: {
        vocab: ["wake up", "have breakfast", "brush teeth"],
        expressions: ["What time do you...?", "I usually..."],
        practiceLabel: "Luyện tập ngữ cảnh (5 câu hỏi thực hành hội thoại)",
      },
    },
    {
      id: "unit-3",
      indexLabel: "Unit 3",
      title: "Unit 3: Lịch trình làm việc & Đi lại",
      description:
        "Trao đổi về phương tiện di chuyển, thời gian làm việc và các cuộc hẹn công sở.",
      durationLabel: "12 phút",
      state: "available",
      vocabCount: 4,
      expressionCount: 3,
      practiceCount: 5,
      preview: {
        vocab: ["take the bus", "meeting", "commute"],
        expressions: ["How do you get to work?", "I take..."],
        practiceLabel: "Luyện tập ngữ cảnh (5 câu hỏi thực hành hội thoại)",
      },
    },
    {
      id: "unit-4",
      indexLabel: "Unit 4",
      title: "Unit 4: Buổi tối & Thời gian thư giãn",
      description:
        "Trò chuyện về sở thích buổi tối, bữa cơm gia đình và thói quen giải trí trước khi ngủ.",
      durationLabel: "10 phút",
      state: "locked",
      vocabCount: 4,
      expressionCount: 3,
      practiceCount: 5,
      stateBadge: "Khóa",
    },
    {
      id: "unit-5",
      indexLabel: "Unit 5",
      title: "Unit 5: Cuối tuần & Kế hoạch tương lai",
      description:
        "Lên kế hoạch cuối tuần, hẹn gặp bạn bè và chia sẻ dự định sắp tới.",
      durationLabel: "10 phút",
      state: "locked",
      vocabCount: 4,
      expressionCount: 3,
      practiceCount: 5,
      stateBadge: "Khóa",
    },
  ],
  progressPercent: 25,
  stats: [
    { id: "vocab", icon: "vocab", label: "Từ vựng đã học", value: "12 mục" },
    {
      id: "expressions",
      icon: "expressions",
      label: "Mẫu câu (Expressions)",
      value: "9 mục",
    },
    {
      id: "practice",
      icon: "practice",
      label: "Bài tập luyện tập (Practice)",
      value: "18 câu",
    },
  ],
  continueLabel: "Tiếp tục học",
  unitActionLabels: {
    startLabel: "Bắt đầu bài học",
    resumeLabel: "Tiếp tục học",
    reviewLabel: "Xem lại bài học",
    restartLabel: "Bắt đầu học",
  },
};

export function useTopicDetail(topicId: string) {
  const fetchTopicDetail = useCallback(
    async (signal: AbortSignal): Promise<TopicDetail> => {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return { ...MOCK_TOPIC_DETAIL, id: topicId };
    },
    [topicId],
  );

  const { data, loading, error, refetch } =
    useFetch<TopicDetail>(fetchTopicDetail);

  return { data, loading, error, refetch };
}
