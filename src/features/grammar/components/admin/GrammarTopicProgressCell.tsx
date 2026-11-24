import { cn } from "@shared/utils";

interface GrammarTopicProgressCellProps {
  done: number;
  total: number;
}

export function GrammarTopicProgressCell({ done, total }: GrammarTopicProgressCellProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const isComplete = total > 0 && done >= total;

  return (
    <div className="flex min-w-[140px] flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-label-sm font-semibold",
            isComplete ? "text-primary" : "text-secondary",
          )}
        >
          {done}/{total}
        </span>
        <span className="text-label-sm text-on-surface-variant">{percent}%</span>
      </div>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-container"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-l-full transition-all",
            isComplete ? "bg-primary" : "bg-secondary",
          )}
          style={{ width: `${percent}%` }}
        />
        <div className="h-full flex-1 bg-surface-container-high" />
      </div>
    </div>
  );
}
