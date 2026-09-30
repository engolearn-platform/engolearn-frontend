import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

export interface ExpressionLessonNavProps {
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

export function ExpressionLessonNav({
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
}: ExpressionLessonNavProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <button
        type="button"
        onClick={onPrev}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
      >
        <ArrowLeft className="size-[18px]" />
        <span>{prevLabel}</span>
      </button>
      <Button
        type="button"
        onClick={onNext}
        className="h-auto gap-2 rounded-lg px-6 py-2.5 font-label-lg shadow-sm"
      >
        <span>{nextLabel}</span>
        <ArrowRight className="size-[18px]" />
      </Button>
    </div>
  );
}