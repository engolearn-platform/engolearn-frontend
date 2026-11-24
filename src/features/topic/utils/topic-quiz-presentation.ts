import type { TopicQuizResource } from "@features/topic/types/topic-management.types";

export type QuizCorrectnessStatus = "resolved" | "missing" | "conflict";

export interface QuizQuestionPresentation {
  id: string;
  index: number;
  kind: "FILL_BLANK" | "SITUATIONAL_CHOICE" | "UNSUPPORTED";
  prompt: string | null;
  scenarioVi: string | null;
  sentenceText: string | null;
  meaningVi: string | null;
  sentenceWithBlank: string | null;
  options: { label: string | null; textEn: string | null }[];
  wordBank: string[];
  correctness: {
    status: QuizCorrectnessStatus;
    selectedOptionIndex: number | null;
    selectedAnswerText: string | null;
    sources: string[];
  };
  explanation: string | null;
  explanationOk: string | null;
  explanationNg: string | null;
  tips: string | null;
  audioUrl: string | null;
  audioUrlSlow: string | null;
  details: Record<string, unknown>;
}

export interface QuizModulePresentation {
  id: string;
  index: number;
  quizId: string | null;
  quizType: string | null;
  typeLabel: string;
  kind: "supported" | "unsupported";
  title: string | null;
  instructions: string | null;
  questions: QuizQuestionPresentation[];
  details: Record<string, unknown>;
}

export interface QuizPresentation {
  modules: QuizModulePresentation[];
  totalQuestions: number;
}

type RawQuestion = NonNullable<TopicQuizResource["questions"]>[number];
type Candidate = { index: number | null; answer: string | null; source: string };

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function matchesOption(options: RawQuestion["options"], value: string, field: "label" | "textEn"): number[] {
  const matches: number[] = [];
  options.forEach((option, index) => {
    if (text(option[field]) === value) matches.push(index);
  });
  return matches;
}

function resolveCorrectness(question: RawQuestion, quizType: string | null): QuizQuestionPresentation["correctness"] {
  const options = question.options ?? [];
  const rawBank = question.quizData?.word_bank;
  const bank = Array.isArray(rawBank) ? rawBank.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean) : [];
  const candidates: Candidate[] = [];
  let conflict = false;
  const flagIndexes = options.flatMap((option, index) => option.isCorrect === true ? [index] : []);
  if (flagIndexes.length > 1) conflict = true;
  if (flagIndexes.length === 1) candidates.push({ index: flagIndexes[0], answer: text(options[flagIndexes[0]]?.textEn), source: "Cờ isCorrect" });

  const standalone = text(question.correct);
  if (standalone) {
    const indexes = matchesOption(options, standalone, "label");
    if (indexes.length !== 1) conflict = true;
    else candidates.push({ index: indexes[0], answer: text(options[indexes[0]]?.textEn), source: "Đáp án lưu độc lập" });
  }

  const answerData = question.answerData ?? {};
  const correctOption = text(answerData.correct_option);
  if (correctOption) {
    const indexes = matchesOption(options, correctOption, "label");
    if (indexes.length !== 1) {
      const bankIndexes = bank.flatMap((entry, index) => entry === correctOption ? [index] : []);
      if (quizType === "FILL_BLANK" && indexes.length === 0 && bankIndexes.length === 1) candidates.push({ index: null, answer: bank[bankIndexes[0]], source: "answerData.correct_option" });
      else conflict = true;
    } else candidates.push({ index: indexes[0], answer: text(options[indexes[0]]?.textEn), source: "answerData.correct_option" });
  }
  const correctAnswer = text(answerData.correct_answer);
  if (correctAnswer) {
    const indexes = matchesOption(options, correctAnswer, "textEn");
    if (indexes.length !== 1) {
      const bankIndexes = bank.flatMap((entry, index) => entry === correctAnswer ? [index] : []);
      if (quizType === "FILL_BLANK" && indexes.length === 0 && bankIndexes.length === 1) candidates.push({ index: null, answer: bank[bankIndexes[0]], source: "answerData.correct_answer" });
      else conflict = true;
    } else candidates.push({ index: indexes[0], answer: text(options[indexes[0]]?.textEn), source: "answerData.correct_answer" });
  }
  const legacyAnswer = text(answerData.answer);
  if (legacyAnswer) {
    const indexes = matchesOption(options, legacyAnswer, "textEn");
    if (indexes.length !== 1) {
      const bankIndexes = bank.flatMap((entry, index) => entry === legacyAnswer ? [index] : []);
      if (quizType === "FILL_BLANK" && indexes.length === 0 && bankIndexes.length === 1) candidates.push({ index: null, answer: bank[bankIndexes[0]], source: "answerData.answer" });
      else conflict = true;
    } else candidates.push({ index: indexes[0], answer: text(options[indexes[0]]?.textEn), source: "answerData.answer" });
  }

  const answers = [...new Set(candidates.map((candidate) => candidate.answer).filter((answer): answer is string => answer !== null))];
  const indexes = [...new Set(candidates.map((candidate) => candidate.index).filter((index): index is number => index !== null))];
  if (answers.length > 1 || indexes.length > 1) conflict = true;
  const chosen = indexes.length === 1 ? indexes[0] : null;
  const selectedAnswerText = answers.length === 1 ? answers[0] : null;
  if (chosen !== null && options[chosen]?.isCorrect === false && candidates.some((candidate) => candidate.index === chosen && candidate.source !== "Cờ isCorrect")) {
    conflict = true;
  }
  if (selectedAnswerText && matchesOption(options, selectedAnswerText, "textEn").length > 1) conflict = true;
  if (selectedAnswerText && options.length === 0 && bank.filter((entry) => entry === selectedAnswerText).length > 1) conflict = true;
  if (conflict) return { status: "conflict", selectedOptionIndex: null, selectedAnswerText: null, sources: candidates.map((candidate) => candidate.source) };
  if (chosen === null && selectedAnswerText === null) return { status: "missing", selectedOptionIndex: null, selectedAnswerText: null, sources: [] };
  return { status: "resolved", selectedOptionIndex: chosen, selectedAnswerText, sources: candidates.map((candidate) => candidate.source) };
}

function safeDetails(value: unknown, field = ""): unknown {
  if (typeof value === "string") {
    if (value && (/url|media|audio|image|cover/i.test(field) || /^(https?:\/\/|topic-media:|\/api\/)/i.test(value))) return "Đã lưu tham chiếu media";
    return value;
  }
  if (Array.isArray(value)) return value.map((entry) => safeDetails(entry, field));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, safeDetails(entry, key)]));
  }
  return value;
}

function questionPresentation(question: RawQuestion, moduleIndex: number, questionIndex: number, quizType: string | null): QuizQuestionPresentation {
  const correctness = resolveCorrectness(question, quizType);
  const sentenceText = text(question.sentence?.textEn);
  const explicitPrompt = text(question.prompt);
  const legacyBlank = text(question.quizData?.sentence_with_blank);
  const explicitBlank = legacyBlank ?? (explicitPrompt?.includes("___") ? explicitPrompt : null);
  const explicitBlankCount = explicitBlank?.match(/___/g)?.length ?? 0;
  const answer = correctness.selectedAnswerText;
  let sentenceWithBlank: string | null = null;
  if (explicitBlank && explicitBlankCount === 1) {
    sentenceWithBlank = explicitBlank;
  } else if (quizType === "FILL_BLANK" && sentenceText && answer) {
    const start = sentenceText.indexOf(answer);
    if (start >= 0 && sentenceText.indexOf(answer, start + answer.length) < 0) {
      sentenceWithBlank = `${sentenceText.slice(0, start)}___${sentenceText.slice(start + answer.length)}`;
    }
  }

  return {
    id: `module-${moduleIndex}-question-${questionIndex}`,
    index: questionIndex,
    kind: quizType === "FILL_BLANK" || quizType === "SITUATIONAL_CHOICE" ? quizType : "UNSUPPORTED",
    prompt: explicitPrompt,
    scenarioVi: text(question.quizData?.scenario_vi),
    sentenceText,
    meaningVi: text(question.sentence?.meaningVi),
    sentenceWithBlank,
    options: (question.options ?? []).map((option) => ({ label: text(option.label), textEn: text(option.textEn) })),
    wordBank: (() => {
      const optionBank = (question.options ?? []).map((option) => text(option.textEn)).filter((entry): entry is string => entry !== null);
      if (optionBank.length > 0) return optionBank;
      const legacyBank = question.quizData?.word_bank;
      if (quizType === "FILL_BLANK" && Array.isArray(legacyBank) && legacyBank.every((entry) => typeof entry === "string")) return legacyBank.map((entry) => entry.trim()).filter(Boolean);
      return optionBank;
    })(),
    correctness,
    explanation: text(question.explanation),
    explanationOk: text(question.explanationOk),
    explanationNg: text(question.explanationNg),
    tips: text(question.tips),
    audioUrl: text(question.audioUrl) ?? text(question.sentence?.audioUrl),
    audioUrlSlow: text(question.sentence?.audioUrlSlow),
    details: safeDetails({
      correct: question.correct,
      options: question.options,
      quizData: question.quizData,
      answerData: question.answerData,
      explanation: question.explanation,
      explanationOk: question.explanationOk,
      explanationNg: question.explanationNg,
      sentence: question.sentence,
      tips: question.tips,
      audioUrl: question.audioUrl,
    }) as Record<string, unknown>,
  };
}

export function toQuizPresentations(resources: TopicQuizResource[]): QuizPresentation {
  const modules = resources.map((resource, index): QuizModulePresentation => {
    const supported = resource.quizType === "FILL_BLANK" || resource.quizType === "SITUATIONAL_CHOICE";
    const typeLabel = resource.quizType === "FILL_BLANK" ? "Điền từ"
      : resource.quizType === "SITUATIONAL_CHOICE" ? "Tình huống"
        : `Chưa hỗ trợ (${resource.quizType ?? "chưa xác định"})`;
    return {
      id: `${resource.quizId ?? "quiz-module"}-${index}`,
      index,
      quizId: resource.quizId,
      quizType: resource.quizType,
      typeLabel,
      kind: supported ? "supported" : "unsupported",
      title: text(resource.title),
      instructions: text(resource.instructions),
      questions: (resource.questions ?? []).map((question, questionIndex) => questionPresentation(question, index, questionIndex, resource.quizType)),
      details: safeDetails({ quizId: resource.quizId, quizType: resource.quizType, orderIndex: resource.orderIndex }) as Record<string, unknown>,
    };
  });
  return { modules, totalQuestions: modules.reduce((total, module) => total + module.questions.length, 0) };
}
