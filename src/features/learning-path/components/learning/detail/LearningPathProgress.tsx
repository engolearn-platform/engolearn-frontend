import { cn } from "@shared/utils";

interface LearningPathProgressProps {
  value: number;
  label: string;
  className?: string;
  fillClassName?: string;
}

export default function LearningPathProgress({
  value,
  label,
  className,
  fillClassName,
}: LearningPathProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-surface-container-high", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className={cn("h-full rounded-full bg-primary", fillClassName)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
