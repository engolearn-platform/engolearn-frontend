import { Check, CircleAlert, CircleHelp } from "lucide-react";
import type { QuizQuestionPresentation } from "@features/topic/utils/topic-quiz-presentation";

export default function FillBlankQuestionCard({ question }: { question: QuizQuestionPresentation }) {
  const answer = question.correctness.status === "resolved" ? question.correctness.selectedAnswerText : null;
  return <div className="space-y-3">
    {question.scenarioVi && <p className="rounded-lg bg-surface-container-low p-3 text-body-md text-on-surface"><span className="font-semibold">Bối cảnh:</span> {question.scenarioVi}</p>}
    {question.sentenceWithBlank ? <p className="rounded-lg bg-surface-container-low p-3 text-body-lg font-medium text-on-surface">{question.sentenceWithBlank}</p> : <p role="status" className="text-body-sm text-on-surface-variant">Chưa có câu đục lỗ được lưu hoặc xác định an toàn.</p>}
    {question.sentenceText && question.sentenceText !== question.sentenceWithBlank && <p className="text-body-sm text-on-surface-variant">Câu gốc: {question.sentenceText}</p>}
    {question.meaningVi && <p className="text-body-md text-on-surface-variant">{question.meaningVi}</p>}
    {question.wordBank.length > 0 && <div><h4 className="mb-2 text-label-md font-semibold text-on-surface">Ngân hàng từ</h4><ul className="flex flex-wrap gap-2">{question.wordBank.map((word, index) => {
      const selected = Boolean(answer) && answer === word;
      return <li key={`${word}-${index}`} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-label-sm ${selected ? "bg-primary font-semibold text-on-primary" : "bg-surface-container text-on-surface"}`}>{word}{selected && <><Check className="size-4" aria-hidden="true" /><span>Đáp án đúng</span></>}</li>;
    })}</ul></div>}
    {question.correctness.status === "conflict" && <p role="status" className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/40 p-3 text-body-sm text-on-surface"><CircleAlert className="mt-0.5 size-4 shrink-0 text-error" aria-hidden="true" />Dữ liệu đáp án không nhất quán; không xác định đáp án đúng.</p>}
    {question.correctness.status === "missing" && <p role="status" className="flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant"><CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Chưa có đáp án đúng được lưu.</p>}
    {question.explanation && <div className="rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface"><h4 className="mb-1 font-semibold">Giải thích</h4><p className="whitespace-pre-wrap">{question.explanation}</p></div>}
    {question.tips && <p className="rounded-lg bg-learning-note p-3 text-body-sm text-learning-note-ink"><span className="font-semibold">Mẹo:</span> {question.tips}</p>}
  </div>;
}
