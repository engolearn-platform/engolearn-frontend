import { Check, Clock, Hourglass } from "lucide-react";
import type { TopicItemStepSummary } from "../../../types/topic-create.types";

interface TopicItemStepPillsProps {
  steps: TopicItemStepSummary[];
}

export default function TopicItemStepPills({ steps }: TopicItemStepPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {steps.map((step) => {
        if (step.state === "done") {
          return (
            <span
              key={step.key}
              className="inline-flex items-center gap-1.5 rounded-md bg-surface-container px-2.5 py-1 text-label-sm text-on-surface"
            >
              <Check className="size-4 text-primary" aria-hidden="true" />
              <span>
                {step.label} <strong className="font-semibold">{step.detail}</strong>
              </span>
            </span>
          );
        }
        if (step.state === "partial") {
          return (
            <span
              key={step.key}
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary-fixed/60 px-2.5 py-1 text-label-sm text-on-secondary-fixed"
            >
              <Clock className="size-4 text-secondary" aria-hidden="true" />
              <span>
                {step.label} <strong className="font-semibold">{step.detail}</strong>
              </span>
            </span>
          );
        }
        return (
          <span
            key={step.key}
            className="inline-flex items-center gap-1.5 rounded-md bg-surface-container-high px-2.5 py-1 text-label-sm text-on-surface-variant"
          >
            <Hourglass className="size-4" aria-hidden="true" />
            <span>
              {step.label} <span className="italic">{step.detail}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
