import { ArrowRight, Brain } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

export interface ReadinessCtaProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function ReadinessCta({
  title,
  description,
  actionLabel,
  onAction,
}: ReadinessCtaProps) {
  return (
    <section className="flex flex-col items-center justify-between gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm md:flex-row md:p-8">
      <div className="flex w-full items-center gap-4 md:w-auto">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Brain className="size-7" />
        </div>
        <div className="flex flex-col">
          <div className="text-headline-sm text-on-surface">{title}</div>
          <p className="text-body-md text-on-surface-variant">{description}</p>
        </div>
      </div>
      <Button
        type="button"
        onClick={onAction}
        className="h-auto w-full shrink-0 rounded-lg px-8 py-3.5 text-label-lg font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98] md:w-auto"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="size-5" />
      </Button>
    </section>
  );
}
