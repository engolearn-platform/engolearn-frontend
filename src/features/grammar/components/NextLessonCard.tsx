import { Button } from "@/core/components/shadcn/button";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { NextLessonSuggestion } from "../types/grammar.types";

interface NextLessonCardProps {
  suggestion: NextLessonSuggestion;
  onStart?: () => void;
}

export default function NextLessonCard({
  suggestion,
  onStart,
}: NextLessonCardProps) {
  return (
    <section
      aria-label="Gợi ý bài tiếp theo"
      className="rounded-2xl border border-outline-variant bg-linear-to-br from-tertiary-fixed to-surface-container-lowest p-6 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="size-5 text-tertiary" aria-hidden="true" />
        <h3 className="text-headline-sm font-semibold text-on-surface">
          Gợi ý bài tiếp theo
        </h3>
      </div>
      <div className="mb-4 rounded-lg border border-outline-variant/50 bg-surface-container-lowest/80 p-4 backdrop-blur-sm">
        <h4 className="mb-1 text-label-lg font-semibold text-on-surface">
          {suggestion.title}
        </h4>
        <p className="text-body-md text-on-surface-variant">
          {suggestion.description}
        </p>
      </div>
      <Button
        type="button"
        onClick={onStart}
        className="w-full rounded-xl bg-tertiary text-on-tertiary hover:bg-on-tertiary-fixed-variant"
      >
        Học ngay
        <ArrowRight className="size-[18px]" aria-hidden="true" />
      </Button>
    </section>
  );
}
