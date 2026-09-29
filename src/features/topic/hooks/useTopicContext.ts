import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import type { TopicContext } from "../types/topic-context.types";

const MOCK_TOPIC_CONTEXT: TopicContext = {
  id: "morning-routine",
  topicTitle: "Thói quen hằng ngày — Buổi sáng năng động",
  topicLabel: "Chủ điểm: Thói quen buổi sáng",
  cefrBadge: "CEFR A1–A2",
  stageCardLabel: "Giai đoạn 1 / 4",
  stageText: "Giai đoạn 1 / 4: Bối cảnh",
  steps: [
    { id: "context", label: "1. Bối cảnh tình huống", state: "active" },
    { id: "dialogue", label: "2. Hội thoại mẫu", state: "todo" },
  ],
  hero: {
    stageTag: "Giai đoạn 1: Bối cảnh giao tiếp",
    metaLabel: "CEFR Level A1–A2 · Giao tiếp hằng ngày",
    eyebrow: "Tình huống thực tế · The Where & Why",
    titleEn: "Morning Routine",
    titleVi: "Bắt đầu một ngày mới",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDistRPk4mas8PPc2qs9Et6uzo1J4KkftplkH0fm6y-DByaPOajFHBSH8V4cbN6lB3Lri68ZztdmPzP8fVHmxhvqqum_qq5N2BjLPrFHTI9N-DSnKeVBmZzJSpg9BZul-Ar1uw3TlX-bTVo7NU7vxRaBug2DoPWsc-22vUXDsvbqRWZ69UkoMzNJi9b5AnNAgCjaNdEgXEZMJZaybkUfET8t3J8zHkxiweFmFdFM8_BVLv0S4Pla4Vh",
    imageAlt:
      "Tách latte nóng và đồng hồ báo thức trên bàn gỗ buổi sáng",
    promptLabel: "Câu hỏi gợi mở phản xạ",
    promptText:
      "“Bạn thường làm gì vào mỗi buổi sáng trước khi bắt đầu ngày làm việc hoặc học tập?”",
    narrativeHeading: "Đặt mình vào bối cảnh",
    narrativeBody:
      "Hãy tưởng tượng bạn đang trò chuyện cùng bạn bè hoặc đồng nghiệp về thói quen buổi sáng của mình: bạn thức dậy lúc mấy giờ, chuẩn bị bữa sáng ra sao, và mất bao lâu để sẵn sàng ra khỏi nhà. Việc chia sẻ lịch trình thường nhật là một trong những chủ đề giao tiếp tự nhiên và phổ biến nhất trong tiếng Anh thường ngày.",
    tipTitle: "Mẹo tiếp thu tự nhiên:",
    tipText:
      "Đừng chỉ dịch từng chữ. Hãy hình dung trình tự hành động thực tế từ lúc chuông báo thức reo đến khi bạn bước ra khỏi cửa.",
  },
  objectivesHeading: "Mục tiêu buổi học",
  objectives: [
    { id: "time", icon: "timer", text: "5 - 7 phút hoàn thành" },
    { id: "speak", icon: "mic", text: "Tự tin nói 3 câu hoàn chỉnh" },
    { id: "level", icon: "badge", text: "Phát xạ tự nhiên A1–A2" },
  ],
  dialogue: {
    title: "Hội thoại mẫu nhập vai",
    subtitle: "Nghe và cảm nhận nhịp điệu giao tiếp tự nhiên trong ngữ cảnh",
    audioBadge: "Audio tình huống thực tế",
    playAllLabel: "Phát toàn bộ (~0:45s)",
    lines: [
      {
        id: "line-1",
        speakerRole: "waiter",
        speakerLabel: "Người phục vụ (Waiter)",
        textEn: "“Are you ready to order, or do you need a few more minutes?”",
        textVi: "Anh/chị đã sẵn sàng gọi món chưa, hay cần thêm vài phút ạ?",
      },
      {
        id: "line-2",
        speakerRole: "learner",
        speakerLabel: "Bạn / Người học (You)",
        textEn: "“Could you give us a minute? Also, what do you recommend today?”",
        textVi:
          "Cho chúng tôi xin một phút được không? Tiện thể hôm nay quán có món gì ngon gợi ý không ạ?",
      },
    ],
  },
  readinessTitle: "Bạn đã nắm được bức tranh tổng thể?",
  readinessDescription:
    "Cùng bước sang giai đoạn ghi nhớ 3 từ vựng nền tảng của bài học này.",
  readinessActionLabel: "Bắt đầu học từ vựng",
  progressPercent: 25,
  progressNote: "Bắt đầu làm quen với bối cảnh và hội thoại thực tế.",
  structureHeading: "Cấu trúc chủ đề",
  structure: [
    { id: "context", label: "Ngữ cảnh & Hội thoại", state: "active" },
    { id: "vocab", label: "Từ vựng cốt lõi", state: "available" },
    { id: "expressions", label: "Mẫu câu thực tế", state: "locked" },
    { id: "practice", label: "Luyện tập & Phản xạ", state: "locked" },
  ],
  memoryTipTitle: "Mẹo ghi nhớ Engo",
  memoryTipText:
    "Lắng nghe ngữ điệu tự nhiên của nhân vật trong hội thoại mẫu trước khi bước vào nạp từ vựng.",
};

export function useTopicContext(topicId: string) {
  const fetchTopicContext = useCallback(
    async (signal: AbortSignal): Promise<TopicContext> => {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      return { ...MOCK_TOPIC_CONTEXT, id: topicId };
    },
    [topicId],
  );

  const { data, loading, error, refetch } =
    useFetch<TopicContext>(fetchTopicContext);

  return { data, loading, error, refetch };
}
