import { Check, X } from "lucide-react";
import { cn } from "@shared/utils";
import type { GrammarPracticeFeedback } from "@features/grammar/types/grammar.types";
interface Props { total: number; feedback: GrammarPracticeFeedback[]; current?: number }
export default function GrammarPracticeSteps({ total, feedback, current }: Props) {
  return <ol className="flex gap-2" aria-label="Tiến độ luyện tập">
    {Array.from({ length: total }, (_, index) => {
      const number = index + 1; const answered = feedback.find((item) => item.number === number);
      return <li key={number} aria-current={current === number ? "step" : undefined}
        aria-label={`Câu ${number}: ${answered ? answered.correct ? "đúng" : "chưa đúng" : current === number ? "đang làm" : "chưa trả lời"}`}
        className={cn("flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg border-2 text-label-sm font-bold",
          answered ? answered.correct ? "border-primary bg-learning-mint text-primary" : "border-learning-note-ink bg-learning-note text-learning-note-ink"
            : current === number ? "border-primary bg-white text-primary" : "border-learning-outline bg-surface-container-low text-on-surface-variant")}>
        {answered ? answered.correct ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" /> : number}
      </li>;
    })}
  </ol>;
}
