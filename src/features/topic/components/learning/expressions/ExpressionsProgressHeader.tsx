import { Sparkles } from "lucide-react";
import type { ExpressionGroupStep } from "../../../types/topic-expressions.types";

export interface ExpressionsProgressHeaderProps {
  topicLabel: string;
  cefrBadge: string;
  progressText: string;
  steps: ExpressionGroupStep[];
}

export function ExpressionsProgressHeader({
  topicLabel,
  cefrBadge,
  progressText,
  steps,
}: ExpressionsProgressHeaderProps) {
  return (
    <section className="flex min-h-[124px] flex-col justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-container-low px-3 py-1 text-label-sm text-on-surface-variant">
            {topicLabel}
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-label-sm font-semibold text-primary">
            {cefrBadge}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-label-sm font-semibold text-primary">
          <Sparkles className="size-[18px]" />
          <span>{progressText}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-1.5 rounded-full border border-outline-variant/30 px-3 py-1.5 text-label-sm font-medium text-on-surface-variant"
          >
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}