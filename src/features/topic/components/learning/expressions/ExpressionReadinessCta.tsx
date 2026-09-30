import { HelpCircle } from "lucide-react";

export interface ExpressionReadinessCtaProps {
  title: string;
  description: string;
  questionCountLabel: string;
  expLabel: string;
}

export function ExpressionReadinessCta({
  title,
  description,
  questionCountLabel,
  expLabel,
}: ExpressionReadinessCtaProps) {
  return (
    <section className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HelpCircle className="size-6" />
        </div>
        <div className="min-w-0">
          <div className="font-headline-sm font-semibold text-on-surface">
            {title}
          </div>
          <p className="text-sm text-on-surface-variant">
            {description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-surface-container px-3 py-1.5 font-label-sm font-semibold text-on-surface-variant">
          {questionCountLabel}
        </span>
        <span className="rounded-full bg-surface-container px-3 py-1.5 font-label-sm font-bold text-primary">
          {expLabel}
        </span>
      </div>
    </section>
  );
}