import type { DailyAnswers, DailyQuestion, DayResultDto, PracticeDayDto, PracticeQuestionDto, ReviewQuestion } from "@features/learning-path/types/learning-path-day.types";

function mapQuestions(source: PracticeQuestionDto[]): { questions: DailyQuestion[]; answers: DailyAnswers } {
  const answers: DailyAnswers = {};
  const questions = [...source].sort((a, b) => a.order - b.order).map((question) => {
    if (question.options.length !== 4) throw new Error("Dữ liệu câu hỏi không hợp lệ.");
    const selectedIndex = question.options.findIndex((option) => option.optionId === question.selectedOptionId);
    if (selectedIndex >= 0) answers[question.order] = selectedIndex;
    const passage = question.passage;
    const duration = passage?.audio?.durationSec ?? 0;
    const stimulus: DailyQuestion["stimulus"] = passage?.audio
      ? { type: "audio", label: passage.title || "Bài nghe", url: passage.audio.url, duration: `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}` }
      : passage?.text ? { type: "passage", label: passage.title || "Đọc đoạn văn", text: passage.text } : null;
    return {
      number: question.order,
      microSkill: question.microSkill,
      skill: question.skill,
      stimulus,
      prompt: question.prompt,
      options: question.options.map((option) => option.text) as [string, string, string, string],
      optionIds: question.options.map((option) => option.optionId),
    };
  });
  if (questions.length !== 10) throw new Error("Bài luyện tập không đủ 10 câu hỏi.");
  return { questions, answers };
}

export function mapPracticeDay(day: PracticeDayDto): { questions: DailyQuestion[]; answers: DailyAnswers } {
  return mapQuestions(day.questions);
}

export function mapDayResult(day: DayResultDto): { questions: ReviewQuestion[]; answers: DailyAnswers } {
  const mapped = mapQuestions(day.questions);
  const questions = mapped.questions.map((question) => {
    const source = day.questions.find((item) => item.order === question.number);
    if (!source) throw new Error("Dữ liệu kết quả câu hỏi không hợp lệ.");
    const correctIndex = source.options.findIndex((option) => option.optionId === source.correctOptionId);
    const selectedIndex = source.options.findIndex((option) => option.optionId === source.selectedOptionId);
    if (correctIndex < 0 || (source.selectedOptionId !== null && selectedIndex < 0)) {
      throw new Error("Dữ liệu đáp án không hợp lệ.");
    }
    const stimulus = question.stimulus?.type === "audio"
      ? { ...question.stimulus, transcript: source.passage?.transcript }
      : question.stimulus;
    return { ...question, stimulus, correctIndex, explanation: source.explanation };
  });
  return { questions, answers: mapped.answers };
}
