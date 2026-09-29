import { ArrowLeft, ArrowRight } from "lucide-react";

export interface VocabLessonNavProps {
  prevLabel: string | null;
  nextLabel: string;
  hasPrev: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function VocabLessonNav({
  prevLabel,
  nextLabel,
  hasPrev,
  onPrev,
  onNext,
}: VocabLessonNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-6">
      {hasPrev && prevLabel ? (
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <ArrowLeft className="size-[18px]" />
          <span>{prevLabel}</span>
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
      >
        <span>{nextLabel}</span>
        <ArrowRight className="size-[18px]" />
      </button>
    </div>
  );
}
