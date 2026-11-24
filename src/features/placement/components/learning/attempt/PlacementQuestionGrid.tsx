import { cn } from "@shared/utils";
import type { PlacementQuestion } from "@features/placement/types/placement-attempt.types";

interface PlacementQuestionGridProps {
  questions: PlacementQuestion[];
  answers: Record<string, string | null>;
  activeFirstOrder: number;
  activeLastOrder: number;
  onJump: (order: number) => void;
}

export default function PlacementQuestionGrid({
  questions,
  answers,
  activeFirstOrder,
  activeLastOrder,
  onJump,
}: PlacementQuestionGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {questions.map((question) => {
        const answered = answers[question.id] != null;
        const active =
          question.order >= activeFirstOrder && question.order <= activeLastOrder;

        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onJump(question.order)}
            aria-label={`Câu ${question.order}${answered ? " — đã trả lời" : " — chưa trả lời"}`}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex h-10 items-center justify-center rounded-xl border text-label-sm font-semibold transition-colors",
              answered
                ? "border-primary/30 bg-primary/15 text-primary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container",
              active && "ring-2 ring-primary ring-offset-1 ring-offset-surface-container-lowest",
            )}
          >
            {question.order}
          </button>
        );
      })}
    </div>
  );
}
