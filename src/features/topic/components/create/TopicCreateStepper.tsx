import { cn } from "@shared/utils";
import type { TopicCreateStep } from "../../types/topic-create.types";
import { TOPIC_CREATE_STEPS } from "../../types/topic-create.types";

interface TopicCreateStepperProps {
  steps?: TopicCreateStep[];
  activeStep?: number;
}

export default function TopicCreateStepper({
  steps = TOPIC_CREATE_STEPS,
  activeStep = 0,
}: TopicCreateStepperProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {steps.map((step) => {
        const isActive = step.index === activeStep;
        return (
          <div
            key={step.index}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg p-3 transition-all",
              isActive
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
            )}
          >
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-label-lg font-bold",
                isActive
                  ? "bg-on-primary/20 text-on-primary"
                  : "bg-surface-container-highest text-on-surface-variant",
              )}
              aria-hidden="true"
            >
              {step.index + 1}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-label-lg leading-tight font-semibold">
                {step.title}
              </span>
              <span
                className={cn(
                  "truncate text-label-sm",
                  isActive ? "text-on-primary/80" : "text-on-surface-variant",
                )}
              >
                {step.note}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
