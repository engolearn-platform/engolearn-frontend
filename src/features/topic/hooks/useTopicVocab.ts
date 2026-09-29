import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { ROUTES } from "@shared/constants";
import type { TopicVocab, VocabStep } from "../types/topic-vocab.types";

const TOPIC_TITLE = "Thói quen hằng ngày — Buổi sáng năng động";
const TOPIC_LABEL = "Chủ điểm: Thói quen buổi sáng";
const CEFR_BADGE = "CEFR A1–A2";
const STAGE_LABEL = "Giai đoạn 2 / 4";

const VOCAB_ORDER = [
  { id: "wake-up", label: "1. wake up" },
  { id: "breakfast", label: "2. breakfast" },
  { id: "get-dressed", label: "3. get dressed" },
] as const;

type VocabId = (typeof VOCAB_ORDER)[number]["id"];

const WORD_LABELS: Record<VocabId, string> = {
  "wake-up": "wake up",
  breakfast: "breakfast",
  "get-dressed": "get dressed",
};

function buildSteps(currentId: string): VocabStep[] {
  const currentIndex = VOCAB_ORDER.findIndex((v) => v.id === currentId);
  return VOCAB_ORDER.map((v, i) => ({
    id: v.id,
    label: v.label,
    state: i < currentIndex ? "done" : i === currentIndex ? "active" : "todo",
  }));
}

function buildBase(
  vocabId: VocabId,
  overrides: Partial<TopicVocab> & Pick<TopicVocab, "hero"> & Pick<TopicVocab, "quickCheck"> & Pick<TopicVocab, "sentences">,
): TopicVocab {
  const currentIndex = VOCAB_ORDER.findIndex((v) => v.id === vocabId);
  const totalCount = VOCAB_ORDER.length;
  const prev = currentIndex > 0 ? VOCAB_ORDER[currentIndex - 1] : null;
  const next = currentIndex < totalCount - 1 ? VOCAB_ORDER[currentIndex + 1] : null;

  return {
    id: vocabId,
    topicId: "morning-routine",
    topicTitle: TOPIC_TITLE,
    stageLabel: STAGE_LABEL,
    topicLabel: TOPIC_LABEL,
    cefrBadge: CEFR_BADGE,
    progressText: `Từ vựng ${currentIndex + 1} / ${totalCount}`,
    steps: buildSteps(vocabId),
    currentIndex,
    totalCount,
    vocabOrder: [...VOCAB_ORDER],
    prevVocabId: prev ? prev.id : null,
    prevVocabLabel: prev ? WORD_LABELS[prev.id as VocabId] : null,
    sentencesTitle: "Mẫu câu trong ngữ cảnh",
    sentencesCountLabel: `${overrides.sentences.length} câu ví dụ`,
    lessonPrevLabel: prev ? `Từ trước: ${WORD_LABELS[prev.id as VocabId]}` : "",
    lessonNextLabel: next
      ? `Từ tiếp theo: ${WORD_LABELS[next.id as VocabId]}`
      : "Học mẫu câu giao tiếp (Learn Useful Expressions)",
    progressPercent: 50,
    progressNote:
      "Bạn đã hoàn thành 3/3 từ vựng cốt lõi. Sẵn sàng tiếp tục với phần mẫu câu tình huống!",
    structureHeading: "Cấu trúc chủ đề",
    structure: [
      { id: "context", label: "1. Ngữ cảnh & Hội thoại", state: "done", to: "context" },
      { id: "vocab", label: "2. Từ vựng cốt lõi", state: "active", to: "vocab" },
      { id: "expressions", label: "3. Mẫu câu thực tế", state: "locked" },
      { id: "practice", label: "4. Luyện tập & Phản xạ", state: "locked" },
    ],
    memoryTipTitle: "Mẹo ghi nhớ Engo",
    memoryTipText:
      "Phân biệt get dressed (hành động thay quần áo) và wear (trạng thái đang mang món đồ trên người).",
    ...overrides,
    nextVocabId: next ? next.id : null,
  };
}

const MOCK_VOCABS: Record<VocabId, TopicVocab> = {
  "wake-up": buildBase("wake-up", {
    hero: {
      imageUrl:
        "https://picsum.photos/seed/engolearn-wakeup/800/600",
      imageAlt: "Đồng hồ báo thức reo trên bàn cạnh giường vào buổi sáng sớm.",
      imageBadge: "Hành động thực tế",
      posLabel: "Verb phrase (Cụm động từ)",
      frequencyLabel: "Thông dụng hằng ngày",
      word: "wake up",
      ipa: "/weɪk ʌp/",
      meaningVi: "thức dậy, tỉnh giấc khỏi giấc ngủ",
      description:
        "Diễn tả khoảnh khắc bạn ngừng ngủ và bắt đầu tỉnh táo, thường đi cùng đồng hồ báo thức hoặc thói quen buổi sáng.",
      collocationsHeading: "Cụm từ phối hợp hay gặp (Collocations)",
      collocations: [
        { id: "wake-1", en: "wake up early", vi: "thức dậy sớm" },
        { id: "wake-2", en: "wake up to an alarm", vi: "tỉnh giấc nhờ báo thức" },
      ],
    },
    sentences: [
      {
        id: "wake-s1",
        enPrefix: "“I usually ",
        highlight: "wake up",
        enSuffix: " at 6 a.m. before the alarm rings.”",
        vi: "Tôi thường thức dậy lúc 6 giờ sáng trước khi báo thức reo.",
      },
      {
        id: "wake-s2",
        enPrefix: "“She finds it hard to ",
        highlight: "wake up",
        enSuffix: " on cold winter mornings.”",
        vi: "Cô ấy thấy khó thức dậy vào những buổi sáng mùa đông lạnh.",
      },
    ],
    quickCheck: {
      promptLabel: "Chọn cụm từ chính xác để hoàn chỉnh câu:",
      questionPrefix: "“They always ",
      questionSuffix: " at sunrise on weekends.”",
      challengeBadge: "Thử thách 1 câu",
      options: [
        { id: "wake-a", label: "A", text: "wake up", isCorrect: true },
        { id: "wake-b", label: "B", text: "up wake", isCorrect: false },
        { id: "wake-c", label: "C", text: "waking wake", isCorrect: false },
      ],
      successTitle: "Chính xác!",
      successText:
        "Chủ ngữ số nhiều “They” đi cùng trạng từ “always” dùng động từ nguyên thể: wake up.",
      errorTitle: "Chưa chính xác!",
      errorText: "Thử lại nhé: cụm từ chuẩn là “wake up”, giữ nguyên thể với chủ ngữ “They”.",
    },
  }),
  breakfast: buildBase("breakfast", {
    hero: {
      imageUrl:
        "https://picsum.photos/seed/engolearn-breakfast/800/600",
      imageAlt: "Bữa sáng với trứng ốp la, bánh mì và tách cà phê nóng.",
      imageBadge: "Hành động thực tế",
      posLabel: "Noun (Danh từ)",
      frequencyLabel: "Thông dụng hằng ngày",
      word: "breakfast",
      ipa: "/ˈbrek.fəst/",
      meaningVi: "bữa sáng, bữa ăn đầu tiên trong ngày",
      description:
        "Chỉ bữa ăn buổi sáng giúp nạp năng lượng sau một đêm dài, thường gồm món nhẹ và đồ uống nóng.",
      collocationsHeading: "Cụm từ phối hợp hay gặp (Collocations)",
      collocations: [
        { id: "break-1", en: "have breakfast", vi: "ăn sáng" },
        { id: "break-2", en: "skip breakfast", vi: "bỏ bữa sáng" },
      ],
    },
    sentences: [
      {
        id: "break-s1",
        enPrefix: "“After I wake up, I have ",
        highlight: "breakfast",
        enSuffix: " with my family.”",
        vi: "Sau khi thức dậy, tôi ăn sáng cùng gia đình.",
      },
      {
        id: "break-s2",
        enPrefix: "“Skipping ",
        highlight: "breakfast",
        enSuffix: " often makes me tired before noon.”",
        vi: "Bỏ bữa sáng thường khiến tôi mệt mỏi trước buổi trưa.",
      },
    ],
    quickCheck: {
      promptLabel: "Chọn từ chính xác để hoàn chỉnh câu:",
      questionPrefix: "“We have ",
      questionSuffix: " together every morning.”",
      challengeBadge: "Thử thách 1 câu",
      options: [
        { id: "break-a", label: "A", text: "break fast", isCorrect: false },
        { id: "break-b", label: "B", text: "breakfast", isCorrect: true },
        { id: "break-c", label: "C", text: "breakfeast", isCorrect: false },
      ],
      successTitle: "Chính xác!",
      successText: "“Have breakfast” là cụm cố định chỉ hành động ăn bữa sáng.",
      errorTitle: "Chưa chính xác!",
      errorText: "Thử lại nhé: danh từ đúng chính tả là “breakfast”.",
    },
  }),
  "get-dressed": buildBase("get-dressed", {
    hero: {
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDKqMexgKmmpF8iDXrvxR0IfkXXcgxhUZ6PZAepvBc7PfVhDEGMMIH9sKOiaWUZLiJV53HkIny7MoUfYSEdeqCehInRau6gg-yjI7n8gSPYKrGRFvO4fR911Rb2skWj0NSs6v6qj3ieDWtxE3OS2yeNiSyW5p_WCXnfClEV9OAPRT5azAMfWTuYcu5TonYWY4m5gGNeMNR5A_BJBMA1xrS51Y0vsBc96vnTjGghINdqGY7eoMSV4M6m",
      imageAlt:
        "Một người đàn ông đang cài cúc áo sơ mi chỉn chu trước gương phòng ngủ buổi sáng tràn ngập ánh nắng vàng ấm áp.",
      imageBadge: "Hành động thực tế",
      posLabel: "Verb phrase (Cụm động từ)",
      frequencyLabel: "Thông dụng hằng ngày",
      word: "get dressed",
      ipa: "/ɡet drest/",
      meaningVi: "mặc quần áo, thay đồ chuẩn bị ra ngoài",
      description:
        "Diễn tả hành động xỏ trang phục hoàn tất cho một sự kiện, ngày làm việc hoặc hoạt động bên ngoài (thường dùng sau khi thức dậy hoặc tắm xong).",
      collocationsHeading: "Cụm từ phối hợp hay gặp (Collocations)",
      collocations: [
        { id: "dress-1", en: "get dressed quickly", vi: "thay đồ nhanh chóng" },
        { id: "dress-2", en: "be well-dressed", vi: "ăn mặc chỉnh tề, lịch thiệp" },
      ],
    },
    sentences: [
      {
        id: "dress-s1",
        enPrefix: "“After breakfast, I ",
        highlight: "get dressed",
        enSuffix: " and get ready to leave for work.”",
        vi: "Sau bữa sáng, tôi mặc quần áo và chuẩn bị đến chỗ làm.",
      },
      {
        id: "dress-s2",
        enPrefix: "“It takes me only 10 minutes to ",
        highlight: "get dressed",
        enSuffix: ".”",
        vi: "Tôi chỉ mất khoảng 10 phút để chuẩn bị quần áo.",
      },
    ],
    quickCheck: {
      promptLabel: "Chọn cụm từ chính xác để hoàn chỉnh câu:",
      questionPrefix: "“He always ",
      questionSuffix: " before having breakfast.”",
      challengeBadge: "Thử thách 1 câu",
      options: [
        { id: "dress-a", label: "A", text: "gets dressed", isCorrect: true },
        { id: "dress-b", label: "B", text: "dressing get", isCorrect: false },
        { id: "dress-c", label: "C", text: "get dress", isCorrect: false },
      ],
      successTitle: "Chính xác!",
      successText:
        "Chủ ngữ ngôi thứ 3 số ít “He” đi cùng trạng từ tần suất “always” yêu cầu động từ chia thì hiện tại đơn thêm “s”: gets dressed.",
      errorTitle: "Chưa chính xác!",
      errorText:
        "Thử lại nhé: chú ý cụm từ chuẩn là “get dressed”, và phải chia ngôi theo chủ ngữ “He”.",
    },
  }),
};

export function useTopicVocab(topicId: string, vocabId: string) {  const fetchTopicVocab = useCallback(
    async (signal: AbortSignal): Promise<TopicVocab> => {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const key = (vocabId || "get-dressed") as VocabId;
      const found = MOCK_VOCABS[key] ?? MOCK_VOCABS["get-dressed"];
      return { ...found, topicId: topicId || found.topicId };
    },
    [topicId, vocabId],
  );

  const { data, loading, error, refetch } =
    useFetch<TopicVocab>(fetchTopicVocab);

  return { data, loading, error, refetch };
}

/** First vocab of the topic item — entry point of the VOCAB part. */
export function getFirstVocabId(): string {
  return VOCAB_ORDER[0].id;
}

/** Absolute path to a vocab item, e.g. `/topics/abc/vocab/wake-up`. */
export function buildTopicVocabPath(topicId: string, vocabId: string): string {
  return ROUTES.TOPIC_VOCAB.replace(":topicId", topicId).replace(
    ":vocabId",
    vocabId,
  );
}
