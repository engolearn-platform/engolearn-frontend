import { Check, CircleAlert, CircleHelp } from "lucide-react";
import type { QuizQuestionPresentation } from "@features/topic/utils/topic-quiz-presentation";

export default function SituationalQuestionCard({ question }: { question: QuizQuestionPresentation }) {
  const selectedIndex = question.correctness.status === "resolved" ? question.correctness.selectedOptionIndex : null;
  const savedOptionCount = question.options.filter((option) => option.textEn).length;
  return <div className="space-y-3">
    {question.scenarioVi && <p className="rounded-lg bg-surface-container-low p-3 text-body-md text-on-surface"><span className="font-semibold">Bối cảnh:</span> {question.scenarioVi}</p>}
    {question.prompt ? <p className="whitespace-pre-wrap break-words text-body-lg font-medium text-on-surface">{question.prompt}</p> : <p role="status" className="text-body-sm text-on-surface-variant">Chưa có câu hỏi tình huống.</p>}
    {question.options.length > 0 && <ol className="grid grid-cols-1 gap-2" aria-label="Các lựa chọn">{question.options.map((option, optionIndex) => {
      const selected = selectedIndex === optionIndex;
      return <li key={`${option.label ?? "option"}-${optionIndex}`} className={`flex items-start gap-2 rounded-lg border p-3 text-body-md ${selected ? "border-primary/30 bg-primary/10 text-on-surface" : "border-transparent bg-surface-container-low text-on-surface"}`}><span className="min-w-0 flex-1"><span className="font-semibold">{option.label ? `${option.label}.` : `Lựa chọn ${optionIndex + 1}.`}</span> {option.textEn || <span className="text-on-surface-variant">Chưa có nội dung</span>}</span>{selected && <span className="inline-flex shrink-0 items-center gap-1 rounded bg-primary px-2 py-0.5 text-label-sm font-semibold text-on-primary"><Check className="size-4" aria-hidden="true" />Đáp án đúng</span>}</li>;
    })}</ol>}
    {savedOptionCount < 4 && <p role="status" className="text-body-sm text-on-surface-variant">Đã lưu {savedOptionCount}/4 lựa chọn.</p>}
    {question.correctness.status === "conflict" && <p role="status" className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/40 p-3 text-body-sm text-on-surface"><CircleAlert className="mt-0.5 size-4 shrink-0 text-error" aria-hidden="true" />Dữ liệu đáp án không nhất quán; không xác định đáp án đúng.</p>}
    {question.correctness.status === "missing" && <p role="status" className="flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant"><CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Chưa có đáp án đúng được lưu.</p>}
    {question.explanation && <div className="rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface"><h4 className="mb-1 font-semibold">Giải thích</h4><p className="whitespace-pre-wrap">{question.explanation}</p></div>}
  </div>;
}
