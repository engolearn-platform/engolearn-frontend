import type { ManagementAttempt, ManagementQuestion } from "@features/placement/types/placement-management.types";

export type AnswerResult = "correct" | "wrong" | "blank";
export const ANSWER_RESULT_LABEL: Record<AnswerResult, string> = { correct: "Đúng", wrong: "Sai", blank: "Sai" };
export function isFinalAttempt(attempt: ManagementAttempt) {
  return attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED";
}
export function answerResult(question: ManagementQuestion, answers: ManagementAttempt["answers"]): AnswerResult {
  const answer = answers[question.id];
  return answer == null || answer === "" ? "blank" : answer === question.correctOptionId ? "correct" : "wrong";
}
export function countAnswers(questions: ManagementQuestion[], answers: ManagementAttempt["answers"]) {
  return questions.reduce((counts, question) => {
    counts[answerResult(question, answers)] += 1;
    return counts;
  }, { correct: 0, wrong: 0, blank: 0 });
}
