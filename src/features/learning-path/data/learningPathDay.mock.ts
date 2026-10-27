import type { DailyAnswers, DailyQuestion } from "@features/learning-path/types/learning-path-day.types";
import { activeLearningPathPreview, completedLearningPathPreview } from "./learningPathDetail.mock";

export const dailyQuestions: DailyQuestion[] = [
  {
    number: 1,
    microSkill: "Reading for Gist",
    skill: "READING",
    stimulus: {
      type: "passage",
      label: "Đọc đoạn văn",
      text: "Tom likes to read before bed. Every night he reads one chapter of a story. He says it helps him relax and sleep well.",
    },
    prompt: "What is the passage mainly about?",
    options: ["Tom's favorite stories", "Tom's reading habit before bed", "How to sleep better", "A new book about relaxing"],
    correctIndex: 1,
    explanation: "Đoạn văn tập trung vào thói quen đọc một chương truyện mỗi tối trước khi ngủ của Tom, nên B là ý chính. Các đáp án còn lại chỉ nhắc đến chi tiết hoặc nội dung không được đề cập.",
  },
  {
    number: 2,
    microSkill: "Listening for Gist",
    skill: "LISTENING",
    stimulus: { type: "audio", label: "Nghe đoạn hội thoại", duration: "0:38" },
    prompt: "What are the speakers mainly talking about?",
    options: ["A school project", "A holiday plan", "A new restaurant", "A sports match"],
    correctIndex: 2,
    explanation: "Hai người nói về việc thử một nhà hàng mới. Đây là chủ đề chung của cả đoạn hội thoại.",
  },
  {
    number: 3,
    microSkill: "Listening for Specific Information",
    skill: "LISTENING",
    stimulus: { type: "audio", label: "Nghe đoạn thông báo", duration: "0:30" },
    prompt: "Where will the students meet tomorrow?",
    options: ["In the library", "At the school gate", "In the gym", "At the bus station"],
    correctIndex: 1,
    explanation: "Thông báo nói học sinh gặp nhau tại cổng trường lúc 7:30. Bến xe buýt là nơi xe đón sau đó.",
  },
  {
    number: 4,
    microSkill: "Listening for Gist",
    skill: "LISTENING",
    stimulus: { type: "audio", label: "Nghe đoạn hội thoại", duration: "0:42" },
    prompt: "What is the conversation mainly about?",
    options: ["Planning a weekend trip", "Choosing a gift for a friend", "Booking a table at a restaurant", "Fixing a broken phone"],
    correctIndex: 1,
    explanation: "Cuộc hội thoại xoay quanh việc chọn quà cho một người bạn.",
  },
  {
    number: 5,
    microSkill: "Listening for Specific Information",
    skill: "LISTENING",
    stimulus: { type: "audio", label: "Nghe đoạn thông báo", duration: "0:35" },
    prompt: "What time does the library open on Sunday?",
    options: ["8:00 a.m.", "9:30 a.m.", "10:00 a.m.", "11:30 a.m."],
    correctIndex: 2,
    explanation: "Thông báo nêu giờ mở cửa Chủ nhật là 10:00 a.m.",
  },
  {
    number: 6,
    microSkill: "Reading for Gist",
    skill: "READING",
    stimulus: {
      type: "passage",
      label: "Đọc đoạn văn",
      text: "Many people in big cities now ride bicycles to work. Bikes are cheaper than cars, they do not make the air dirty, and they keep riders healthy. Because of this, some cities are building more bike lanes.",
    },
    prompt: "What is the passage mainly about?",
    options: ["The cost of buying a new car", "Why more people are choosing bicycles", "How to build a bike lane", "The problems of city traffic"],
    correctIndex: 1,
    explanation: "Đoạn văn nêu các lợi ích của việc đi xe đạp và lý do nhiều người lựa chọn phương tiện này.",
  },
  {
    number: 7,
    microSkill: "Reading for Gist",
    skill: "READING",
    stimulus: {
      type: "passage",
      label: "Đọc đoạn văn",
      text: "The path was narrow, so the hikers walked in a single line through the forest.",
    },
    prompt: "What does “narrow” mean in this sentence?",
    options: ["Very long", "Easy to find", "Not wide", "Full of people"],
    correctIndex: 2,
    explanation: "Trong ngữ cảnh này, narrow có nghĩa là hẹp, không rộng.",
  },
  {
    number: 8,
    microSkill: "Listening for Gist",
    skill: "LISTENING",
    stimulus: { type: "audio", label: "Nghe đoạn hội thoại", duration: "0:40" },
    prompt: "How does the speaker probably feel about the plan?",
    options: ["Worried", "Excited", "Angry", "Confused"],
    correctIndex: 1,
    explanation: "Giọng điệu và lời nói cho thấy người nói hào hứng với kế hoạch.",
  },
  {
    number: 9,
    microSkill: "Reading for Gist",
    skill: "READING",
    stimulus: {
      type: "passage",
      label: "Đọc đoạn văn",
      text: "Public parks give families a place to relax and help make crowded cities more pleasant.",
    },
    prompt: "What is the author's view of public parks?",
    options: ["They are valuable for cities", "They are too expensive", "They should be smaller", "They are difficult to visit"],
    correctIndex: 0,
    explanation: "Tác giả nhấn mạnh lợi ích của công viên đối với gia đình và thành phố.",
  },
  {
    number: 10,
    microSkill: "Listening for Specific Information",
    skill: "LISTENING",
    stimulus: { type: "audio", label: "Nghe đoạn thông báo", duration: "0:28" },
    prompt: "How many people will come to the party?",
    options: ["Four", "Six", "Eight", "Ten"],
    correctIndex: 2,
    explanation: "Thông báo cho biết tám người sẽ đến dự buổi tiệc.",
  },
];

export const sampleDayResultAnswers: DailyAnswers = {
  1: 1,
  2: 2,
  3: 3,
  4: 1,
  5: 0,
  7: 2,
  8: 1,
  10: 2,
};

export function sampleAnswersForDay(weekNo: number, dayNo: number, completed: boolean): DailyAnswers {
  if (weekNo === 1 && dayNo === 3) return sampleDayResultAnswers;

  const path = completed ? completedLearningPathPreview : activeLearningPathPreview;
  const day = path.weeks.find((week) => week.number === weekNo)?.days.find((item) => item.number === dayNo);
  const answered = day?.answered ?? 0;
  const correct = day?.correct ?? 0;

  return Object.fromEntries(
    dailyQuestions.slice(0, answered).map((question, index) => [
      question.number,
      index < correct ? question.correctIndex : (question.correctIndex + 1) % 4,
    ]),
  );
}

export const sampleSavedAnswersThroughPageOne: DailyAnswers = {
  1: 1,
  2: 2,
  3: 1,
};

export const sampleSavedAnswersThroughPageThree: DailyAnswers = {
  ...sampleSavedAnswersThroughPageOne,
  4: 1,
  5: 2,
  6: 1,
  7: 2,
  8: 1,
  9: 0,
};
