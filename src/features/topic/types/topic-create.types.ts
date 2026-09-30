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

export const TOPIC_SCRIPT_QUALITY_MOCK: TopicScriptQuality = {  score: 68,
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

/**
 * Step 2 — Editor Bối cảnh (Context) của 1 Topic Item.
 * `TopicItemStepKey` ("context" | "vocabulary" | "expressions" | "quiz")
 * đã có sẵn được reuse làm section key cho route editor gộp.
 */
export type ContextDialogueRole = "waiter" | "learner";

export interface ContextDialogueTurn {
  id: string;
  role: ContextDialogueRole;
  speaker: string;
  textEn: string;
  textVi: string;
}

export interface TopicItemContextDraft {
  title: string;
  prompt: string;
  description: string;
  turns: ContextDialogueTurn[];
  duration: string;
}

export const TOPIC_CONTEXT_TITLE_MAX = 80;

export const TOPIC_CONTEXT_DESCRIPTION_MAX = 250;

export interface TopicContextDurationOption {
  value: string;
  label: string;
}

export const TOPIC_CONTEXT_DURATION_OPTIONS: TopicContextDurationOption[] = [
  { value: "2", label: "2 phút" },
  { value: "5", label: "5 phút" },
  { value: "10", label: "10 phút" },
  { value: "15", label: "15 phút" },
];

export const TOPIC_ITEM_SECTION_KEYS: TopicItemStepKey[] = [
  "context",
  "vocabulary",
  "expressions",
  "quiz",
];

export function isTopicItemSectionKey(value: string): value is TopicItemStepKey {
  return (TOPIC_ITEM_SECTION_KEYS as string[]).includes(value);
}

export const TOPIC_ITEM_CONTEXT_DEFAULT_DRAFT: TopicItemContextDraft = {
  title: "Xem thực đơn & Chọn món ăn (Choosing Your Food)",
  prompt:
    "Bạn thường nói gì khi muốn người phục vụ gợi ý món ngon đặc sắc của quán?",
  description:
    "Bạn cùng một người bạn đang ngồi tại một nhà hàng ấm cúng. Người phục vụ vừa mang thực đơn tới. Hai bạn cần trao đổi để quyết định gọi món khai vị và món chính phù hợp với khẩu vị.",
  turns: [
    {
      id: "turn-waiter-1",
      role: "waiter",
      speaker: "Waiter",
      textEn: "Are you ready to order, or do you need a few more minutes?",
      textVi: "Anh chị đã sẵn sàng gọi món chưa, hay cần thêm vài phút nữa ạ?",
    },
    {
      id: "turn-learner-1",
      role: "learner",
      speaker: "You",
      textEn: "Could you give us a minute? Also, what do you recommend today?",
      textVi:
        "Cho chúng tôi xin một phút được không? Tiện thể hôm nay quán có món gì ngon đặc sắc?",
    },
  ],
  duration: "2",
};

/**
 * Step 2 — Editor Từ vựng (Vocabulary) của 1 Topic Item.
 * Stitch: "Admin — 4. Quản lý Từ vựng (Vocabulary Manager)".
 * Tối đa 5 mục từ / item để tối ưu khả năng ghi nhớ (quy tắc sư phạm Stitch).
 */
export type VocabularyPos = "verb" | "noun" | "adjective" | "phrase";

export interface TopicVocabularyExample {
  en: string;
  vi: string;
}

export interface TopicVocabularyItem {
  id: string;
  word: string;
  pos: VocabularyPos;
  ipa: string;
  meaningVi: string;
  audioFile: string;
  audioUploaded: boolean;
  examples: TopicVocabularyExample[];
  collocations: string[];
}

export interface TopicVocabularyPosOption {
  value: VocabularyPos;
  label: string;
}

export const TOPIC_VOCAB_MAX = 5;

export const TOPIC_VOCAB_POS_OPTIONS: TopicVocabularyPosOption[] = [
  { value: "noun", label: "noun (danh từ)" },
  { value: "verb", label: "verb (động từ)" },
  { value: "adjective", label: "adjective (tính từ)" },
  { value: "phrase", label: "phrase (cụm từ)" },
];

export const TOPIC_VOCABULARY_MOCK_CHOOSING_FOOD: TopicVocabularyItem[] = [
  {
    id: "vocab-recommend",
    word: "recommend",
    pos: "verb",
    ipa: "/ˌrek.əˈmend/",
    meaningVi: "gợi ý, tiến cử món ngon",
    audioFile: "recommend_pronunciation_us.mp3",
    audioUploaded: true,
    examples: [
      {
        en: "What do you recommend for dinner?",
        vi: "Bạn gợi ý món gì cho bữa tối?",
      },
      {
        en: "Can you recommend a good local specialty?",
        vi: "Bạn có thể giới thiệu một đặc sản địa phương ngon không?",
      },
    ],
    collocations: ["recommend a dish", "highly recommend"],
  },
  {
    id: "vocab-order",
    word: "order",
    pos: "verb",
    ipa: "/ˈɔː.dər/",
    meaningVi: "gọi món, đặt món",
    audioFile: "order_pronunciation_us.mp3",
    audioUploaded: true,
    examples: [
      {
        en: "Are you ready to order?",
        vi: "Quý khách đã sẵn sàng gọi món chưa?",
      },
      {
        en: "I'd like to order the grilled salmon.",
        vi: "Tôi muốn gọi món cá hồi nướng.",
      },
    ],
    collocations: ["take an order", "ready to order"],
  },
  {
    id: "vocab-appetizer",
    word: "appetizer",
    pos: "noun",
    ipa: "/ˈæp.ə.taɪ.zər/",
    meaningVi: "món khai vị",
    audioFile: "appetizer_pronunciation_us.mp3",
    audioUploaded: true,
    examples: [
      {
        en: "We can start with some light appetizers.",
        vi: "Chúng ta có thể bắt đầu với vài món khai vị nhẹ nhàng.",
      },
    ],
    collocations: ["order an appetizer"],
  },
  {
    id: "vocab-specialty",
    word: "specialty",
    pos: "noun",
    ipa: "/ˈspeʃ.əl.ti/",
    meaningVi: "món đặc sản, món đặc trưng của quán",
    audioFile: "specialty_pronunciation_us.mp3",
    audioUploaded: true,
    examples: [
      {
        en: "What is the chef's specialty tonight?",
        vi: "Món đặc sắc nhất của đầu bếp tối nay là gì?",
      },
    ],
    collocations: ["house specialty", "local specialty"],
  },
];

/**
 * Step 2 — Editor Mẫu câu giao tiếp (Expressions) của 1 Topic Item.
 * Stitch: "Admin — 5. Biên soạn Mẫu câu giao tiếp (Expressions Editor)".
 * JSON spec: purposes[] (local, không load global/DB) + examples[]
 * (tối đa 3 purposes / 3 examples mỗi purpose — chốt Phase 1).
 * `verbatimModuleSyntax` + `erasableSyntaxOnly` đang bật: union string,
 * không dùng enum.
 */
export type ExpressionExampleType =
  | "BASIC_SUGGESTION"
  | "POLITE_INQUIRY"
  | "SLOT_PATTERN";

export interface TopicExpressionExample {
  id: string;
  type: ExpressionExampleType;
  textEn: string;
  textVi: string;
  usageNote: string;
  audioFile: string | null;
  linkedVocabIds: string[];
}

export interface TopicExpressionPurpose {
  id: string;
  purposeEn: string;
  purposeVi: string;
  orderIndex: number;
  examples: TopicExpressionExample[];
}

export interface TopicExpressionTypeOption {
  value: ExpressionExampleType;
  label: string;
}

export const TOPIC_EXPRESSION_MAX_PURPOSES = 3;

export const TOPIC_EXPRESSION_MAX_EXAMPLES = 3;

export const TOPIC_EXPRESSION_TYPE_OPTIONS: TopicExpressionTypeOption[] = [
  { value: "BASIC_SUGGESTION", label: "Căn bản (Basic suggestion)" },
  { value: "POLITE_INQUIRY", label: "Lịch sự (Polite inquiry)" },
  { value: "SLOT_PATTERN", label: "Mẫu thế chỗ (Slot pattern)" },
];

export const TOPIC_EXPRESSIONS_MOCK_CHOOSING_FOOD: TopicExpressionPurpose[] = [
  {
    id: "purpose-recommendations",
    purposeEn: "Asking for recommendations",
    purposeVi: "Hỏi gợi ý món ăn",
    orderIndex: 1,
    examples: [
      {
        id: "expr-recommend-01",
        type: "BASIC_SUGGESTION",
        textEn: "What do you recommend?",
        textVi: "Bạn có gợi ý món nào ngon không?",
        usageNote:
          "Dùng để hỏi trực tiếp bồi bàn khi mở thực đơn.",
        audioFile: "what_do_you_recommend.mp3",
        linkedVocabIds: ["vocab-recommend"],
      },
      {
        id: "expr-recommend-02",
        type: "POLITE_INQUIRY",
        textEn: "Can you recommend a good dish?",
        textVi: "Bạn có thể gợi ý một món ăn ngon được không?",
        usageNote:
          "Cách hỏi nhã nhặn khi lần đầu tới quán hoặc phân vân giữa nhiều lựa chọn.",
        audioFile: null,
        linkedVocabIds: ["vocab-recommend"],
      },
    ],
  },
  {
    id: "purpose-ordering",
    purposeEn: "Expressing choices & Ordering",
    purposeVi: "Bày tỏ lựa chọn & Gọi món",
    orderIndex: 2,
    examples: [
      {
        id: "expr-order-01",
        type: "SLOT_PATTERN",
        textEn: "I'd like to order [món ăn], please.",
        textVi: "Tôi muốn gọi món [món ăn], làm ơn.",
        usageNote:
          "Mẫu thế chỗ: [món ăn] → the grilled salmon / today's soup.",
        audioFile: "id_like_to_order.mp3",
        linkedVocabIds: ["vocab-order"],
      },
    ],
  },
];

/**
 * Step 2 — Editor Bài tập & Quiz của 1 Topic Item.
 * Stitch: "Admin — 6. Quản lý Quizzes (Nhóm Quiz & Thẻ câu hỏi)".
 * Scope hiện tại fix cứng 2 dạng quiz (2 nhóm, không CRUD nhóm):
 * SITUATIONAL_CHOICE + FILL_BLANK (`MATCHING` / `SENTENCE_ORDER` để sau).
 * Field đặt camelCase, map 1:1 với JSON backend (snake_case):
 * quiz_id→id, quiz_type→quizType/kind, order_index→orderIndex,
 * text_en→textEn, audio_url→audioUrl, is_correct→isCorrect,
 * sentence_with_blank→sentenceWithBlank, word_bank→wordBank,
 * correct_option→correctOption, explanation_ok→explanationOk,
 * explanation_ng→explanationNg.
 * `verbatimModuleSyntax` + `erasableSyntaxOnly` đang bật: union string,
 * không dùng enum.
 */
export type QuizType = "SITUATIONAL_CHOICE" | "FILL_BLANK";

export interface TopicQuizOption {
  label: string;
  textEn: string;
  isCorrect: boolean;
}

export interface TopicSituationalQuestion {
  id: string;
  kind: "SITUATIONAL_CHOICE";
  prompt: string;
  audioUrl: string | null;
  options: TopicQuizOption[];
  correct: string;
  explanationOk: string;
  explanationNg: string;
}

export interface TopicFillBlankSentence {
  textEn: string;
  meaningVi: string;
  audioUrl: string | null;
}

export interface TopicFillBlankQuestion {
  id: string;
  kind: "FILL_BLANK";
  sentence: TopicFillBlankSentence;
  sentenceWithBlank: string;
  wordBank: string[];
  correctOption: string;
  explanation: string | null;
  tips: string;
}

export type TopicQuizQuestion =
  | TopicSituationalQuestion
  | TopicFillBlankQuestion;

export interface TopicQuizGroup {
  id: string;
  quizType: QuizType;
  title: string;
  instructions: string;
  orderIndex: number;
  questions: TopicQuizQuestion[];
}

export interface TopicQuizTypeOption {
  value: QuizType;
  label: string;
}

export const TOPIC_QUIZ_MIN_QUESTIONS = 2;

export const TOPIC_QUIZ_MAX_OPTIONS = 6;

export const TOPIC_QUIZ_TIPS_MAX = 250;

export const TOPIC_QUIZ_TYPE_OPTIONS: TopicQuizTypeOption[] = [
  { value: "SITUATIONAL_CHOICE", label: "Tình huống • Situational choice" },
  { value: "FILL_BLANK", label: "Điền từ • Fill in the blank" },
];

export const TOPIC_QUIZ_MOCK_CHOOSING_FOOD: TopicQuizGroup[] = [
  {
    id: "quiz-situational",
    quizType: "SITUATIONAL_CHOICE",
    title: "Phản xạ tình huống (Situational Choice)",
    instructions:
      "Học viên phản xạ đối thoại ngữ cảnh tự nhiên tại bàn ăn nhà hàng.",
    orderIndex: 1,
    questions: [
      {
        id: "quiz-q-sit-01",
        kind: "SITUATIONAL_CHOICE",
        prompt:
          "Bạn đang ngồi ăn sáng cùng đồng nghiệp và muốn hỏi xem đối phương thường gọi món gì hoặc muốn nhờ gợi ý món ngon.",
        audioUrl: "https://cdn.engolearn.vn/audio/quiz_sit_01.mp3",
        options: [
          { label: "A", textEn: "What do you recommend?", isCorrect: true },
          { label: "B", textEn: "I want food now.", isCorrect: false },
          { label: "C", textEn: "Bring menu quickly.", isCorrect: false },
          { label: "D", textEn: "Where is the receipt?", isCorrect: false },
        ],
        correct: "A",
        explanationOk:
          "Chính xác! “What do you recommend?” là cách hỏi gợi ý lịch sự nhất trong ngữ cảnh này.",
        explanationNg:
          "Chưa chính xác. Cụm “What do you recommend?” mới là cách hỏi gợi ý lịch sự nhất.",
      },
      {
        id: "quiz-q-sit-02",
        kind: "SITUATIONAL_CHOICE",
        prompt:
          "Người phục vụ mang nhầm món salad mà bạn không ăn cay được. Bạn phản hồi như thế nào lịch sự nhất?",
        audioUrl: null,
        options: [
          {
            label: "A",
            textEn: "Could you check this dish please?",
            isCorrect: true,
          },
          {
            label: "B",
            textEn: "Take this back instantly.",
            isCorrect: false,
          },
        ],
        correct: "A",
        explanationOk:
          "Chính xác! “Could you check this dish please?” vừa lịch sự vừa nêu rõ vấn đề.",
        explanationNg:
          "Chưa chính xác. Câu mệnh lệnh “Take this back instantly.” quá thô lỗ với nhân viên phục vụ.",
      },
      {
        id: "quiz-q-sit-03",
        kind: "SITUATIONAL_CHOICE",
        prompt:
          "Bạn muốn xin thêm vài phút để đọc menu trước khi bồi bàn ghi món.",
        audioUrl: null,
        options: [
          {
            label: "A",
            textEn: "Could we have a few more minutes to decide?",
            isCorrect: true,
          },
          { label: "B", textEn: "Give us the bill now.", isCorrect: false },
          {
            label: "C",
            textEn: "We don't need the menu.",
            isCorrect: false,
          },
        ],
        correct: "A",
        explanationOk:
          "Chính xác! Đây là mẫu câu xin thêm thời gian chuẩn mực trong nhà hàng.",
        explanationNg:
          "Chưa chính xác. Chỉ có “Could we have a few more minutes to decide?” diễn đạt đúng ý xin thêm thời gian.",
      },
    ],
  },
  {
    id: "quiz-fill-blank",
    quizType: "FILL_BLANK",
    title: "Điền từ vào chỗ trống & Ngân hàng từ (Fill-in-the-Blank)",
    instructions:
      "Ôn tập từ vựng trọng tâm: món gợi ý, gọi món, hoá đơn qua Word Bank.",
    orderIndex: 2,
    questions: [
      {
        id: "quiz-q-fib-01",
        kind: "FILL_BLANK",
        sentence: {
          textEn: "Can you recommend a good local specialty?",
          meaningVi:
            "Bạn có thể gợi ý một món đặc sản địa phương ngon không?",
          audioUrl: null,
        },
        sentenceWithBlank: "Can you ___ a good local specialty?",
        wordBank: ["order", "recommend", "bill", "starter"],
        correctOption: "recommend",
        explanation:
          "Đáp án đúng là “recommend” (gợi ý) — động từ đi với tân ngữ chỉ món ăn khi nhờ tư vấn.",
        tips: "“Recommend” dùng khi nhờ gợi ý; đừng nhầm với “order” (gọi món).",
      },
      {
        id: "quiz-q-fib-02",
        kind: "FILL_BLANK",
        sentence: {
          textEn: "Are you ready to order or do you need a minute?",
          meaningVi:
            "Quý khách đã sẵn sàng gọi món chưa, hay cần thêm một phút?",
          audioUrl: null,
        },
        sentenceWithBlank: "Are you ready to ___ or do you need a minute?",
        wordBank: ["order", "recommend", "bill"],
        correctOption: "order",
        explanation:
          "Đáp án đúng là “order” — cấu trúc “be ready to order” (sẵn sàng gọi món).",
        tips: "Sau “ready to” luôn là động từ nguyên mẫu chỉ hành động tiếp theo.",
      },
      {
        id: "quiz-q-fib-03",
        kind: "FILL_BLANK",
        sentence: {
          textEn: "What is today's chef's specialty?",
          meaningVi: "Món đặc sắc nhất của đầu bếp hôm nay là gì?",
          audioUrl: null,
        },
        sentenceWithBlank: "What is today's chef's ___?",
        wordBank: ["specialty", "menu", "bill"],
        correctOption: "specialty",
        explanation:
          "Đáp án đúng là “specialty” (món đặc sắc) — cụm “chef's specialty” chỉ món tủ của đầu bếp.",
        tips: "“Specialty” là danh từ; “special” là tính từ — đừng nhầm hai từ này.",
      },
    ],
  },
];
