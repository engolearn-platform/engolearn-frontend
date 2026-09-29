import { Fragment } from "react";
import { BadgeCheck, CheckCircle2, CircleDot } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type { VocabStep } from "../../../types/topic-vocab.types";

export interface VocabProgressHeaderProps {
  topicLabel: string;
  cefrBadge: string;
  progressText: string;
  steps: VocabStep[];
  onSelectStep?: (id: string) => void;
}

export function VocabProgressHeader({
  topicLabel,
  cefrBadge,
  progressText,
  steps,
  onSelectStep,
}: VocabProgressHeaderProps) {
  return (
    <section className="flex min-h-[124px] flex-col justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-on-surface-variant">
            {topicLabel}
          </span>
          <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-label-sm font-semibold text-on-primary-fixed-variant">
            {cefrBadge}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-label-lg font-semibold text-primary">
          <BadgeCheck className="size-[18px]" />
          <span>{progressText}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
        {steps.map((step, index) => {
          const isActive = step.state === "active";
          const isDone = step.state === "done";
          return (
            <Fragment key={step.id}>
              {index > 0 && (
                <div
                  aria-hidden="true"
                  className="h-0.5 w-4 shrink-0 bg-outline-variant/60"
                />
              )}
              <button
                type="button"
                onClick={() => onSelectStep?.(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-label-sm transition-colors",
                  isActive
                    ? "bg-primary font-semibold text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="size-[18px] text-primary" />
                ) : isActive ? (
                  <CircleDot className="size-[18px]" />
                ) : null}
                <span>{step.label}</span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
