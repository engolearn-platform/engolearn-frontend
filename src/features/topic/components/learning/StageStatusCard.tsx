import { CheckCircle2, MessagesSquare } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type { LearningStep } from "../../types/topic-context.types";

export interface StageStatusCardProps {
  topicLabel: string;
  cefrBadge: string;
  stageText: string;
  steps: LearningStep[];
}

export function StageStatusCard({
  topicLabel,
  cefrBadge,
  stageText,
  steps,
}: StageStatusCardProps) {
  return (
    <section className="flex min-h-[124px] flex-col justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface-variant">
            {topicLabel}
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {cefrBadge}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          <span>{stageText}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-3">
        {steps.map((step) => {
          const isActive = step.state === "active";
          const StepIcon = isActive ? CheckCircle2 : MessagesSquare;
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium",
                isActive
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-low text-on-surface-variant",
              )}
            >
              <StepIcon
                className={cn("size-4", !isActive && "text-outline")}
              />
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
