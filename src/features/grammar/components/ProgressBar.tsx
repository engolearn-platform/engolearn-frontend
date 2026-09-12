import { cn } from "@shared/utils";

interface ProgressBarProps {
  /** 0–100, clamped internally */
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  /** Shimmer overlay for in-progress bars */
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2",
};

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export default function ProgressBar({
  value,
  showLabel = false,
  size = "md",
  animated = false,
  className,
}: ProgressBarProps) {
  const clamped = clamp(value);
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("flex w-full items-center gap-3", className)}
    >
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-full bg-primary/10",
          sizeClasses[size]
        )}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${clamped}%` }}
        >
          {animated && (
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 right-0 w-4 animate-pulse rounded-full bg-white/30"
            />
          )}
        </div>
      </div>
      {showLabel && (
        <span className="shrink-0 text-label-sm font-bold text-primary">
          {clamped}%
        </span>
      )}
    </div>
  );
}
