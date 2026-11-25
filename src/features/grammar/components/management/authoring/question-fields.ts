import type { GrammarQuestion, GrammarQuestionType } from "@features/grammar/types/grammar-content.types";

export const maxQuestions = 5;
export const optionLetters = ["A", "B", "C", "D"];
export const questionLabels: Record<GrammarQuestionType, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  FILL_IN_BLANK: "Điền chỗ trống",
};
export function normalizedAnswer(value: string) {
  return value.normalize("NFKC").replace(/[’‘ʼ′]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
    .trim().replace(/\s+/g, " ").toLowerCase().replace(/[.,;:!?]+$/g, "").trim();
}

export function acceptedAnswers(question: GrammarQuestion, includeMain: boolean) {
  const main = question.correctAnswer?.trim() ?? "";
  const candidates = includeMain ? [main, ...question.acceptedAnswers] : question.acceptedAnswers;
  const seen = new Set(includeMain ? [] : [normalizedAnswer(main)]);
  return candidates.reduce<string[]>((result, candidate) => {
    const key = normalizedAnswer(candidate);
    if (!key || seen.has(key)) return result;
    seen.add(key);
    result.push(candidate.trim());
    return result;
  }, []);
}

export function questionChecks(question: GrammarQuestion) {
  const multipleChoice = question.type === "MULTIPLE_CHOICE";
  const promptPresent = Boolean(question.prompt?.trim());
  const rightBlankCount = (question.prompt?.match(/(?<!_)_{4}(?!_)/g) ?? []).length === 1
    && !question.prompt?.includes("_____");
  const optionsComplete = question.options.length === 4 && question.options.every((option) => Boolean(option?.trim()));
  const validIndex = question.correctIndex != null && Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < 4;
  return [
    { label: "Nội dung câu hỏi", passed: promptPresent && (multipleChoice || rightBlankCount),
      detail: !promptPresent ? "Nhập nội dung câu hỏi." : !multipleChoice && !rightBlankCount ? "Câu hỏi cần đúng một chỗ trống ____." : undefined },
    { label: "Đáp án đúng", passed: multipleChoice ? optionsComplete && validIndex : Boolean(normalizedAnswer(question.correctAnswer ?? "")),
      detail: multipleChoice ? (!optionsComplete ? "Nhập đủ bốn phương án." : !validIndex ? "Chọn một phương án đúng." : undefined) :
        !normalizedAnswer(question.correctAnswer ?? "") ? "Nhập đáp án đúng chính." : undefined },
    { label: "Giải thích", passed: Boolean(question.explanation?.trim()), detail: question.explanation?.trim() ? undefined : "Nhập giải thích đáp án." },
  ];
}
