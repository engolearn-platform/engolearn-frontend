import type { PlacementReviewQuestion } from "@features/placement/types/placement-review.types";
import { cn } from "@shared/utils";
import { Check, Minus, X } from "lucide-react";
import { Link } from "react-router";
import { getReviewAnswerState } from "./reviewState";

export default function PlacementReviewQuestionGrid({
  questions,
  currentOrder,
  onSelectOrder,
  resultPath,
}: {
  questions: PlacementReviewQuestion[];
  currentOrder: number;
  onSelectOrder: (order: number) => void;
  resultPath: string;
}) {
  return (
    <nav
      aria-label="Danh sách câu hỏi xem lại"
      className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm"
    >
      <h2 className="text-headline-sm font-semibold text-on-surface">
        Danh sách câu hỏi
      </h2>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {questions.map((question) => {
          const state = getReviewAnswerState(question);
          const label =
            state === "CORRECT" ? "Đúng" : state === "INCORRECT" ? "Sai" : "Chưa trả lời";
          const Icon = state === "CORRECT" ? Check : state === "INCORRECT" ? X : Minus;

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelectOrder(question.order)}
              aria-label={`Câu ${question.order} — ${label}`}
              aria-current={currentOrder === question.order ? "step" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1 rounded-xl border text-label-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                state === "CORRECT"
                  ? "border-primary/30 bg-primary-fixed/40 text-on-primary-fixed"
                  : state === "INCORRECT"
                    ? "border-error/30 bg-error-container text-on-error-container"
                    : "border-outline-variant bg-surface-container-highest text-on-surface-variant",
                currentOrder === question.order ? "ring-2 ring-primary ring-offset-2" : "",
              )}
            >
              {String(question.order).padStart(2, "0")}
              <Icon className="size-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <Link to={resultPath} className="mt-5 flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-label-lg font-semibold text-on-primary hover:bg-primary-container">
        Về kết quả
      </Link>
      <ul className="mt-4 flex flex-wrap gap-3 border-t border-outline-variant pt-4 text-label-sm">
        <li className="inline-flex items-center gap-1 text-primary">
          <Check className="size-4" aria-hidden="true" /> Đúng
        </li>
        <li className="inline-flex items-center gap-1 text-error">
          <X className="size-4" aria-hidden="true" /> Sai
        </li>
        <li className="inline-flex items-center gap-1 text-on-surface-variant">
          <Minus className="size-4" aria-hidden="true" /> Chưa trả lời
        </li>
      </ul>
    </nav>
  );
}
