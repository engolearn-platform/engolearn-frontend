import { formatCountdown } from "@features/placement/constants";
import { cn } from "@shared/utils";
import { Timer } from "lucide-react";

interface PlacementAttemptTimerProps {
  remainingMs: number;
}

export default function PlacementAttemptTimer({
  remainingMs,
}: PlacementAttemptTimerProps) {
  const urgent = remainingMs <= 60_000;

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Thời gian còn lại ${formatCountdown(remainingMs)}`}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-label-lg font-semibold tabular-nums",
        urgent
          ? "border-error/40 bg-error-container text-on-error-container"
          : "border-outline-variant bg-surface-container text-on-surface",
      )}
    >
      <Timer className="size-4" aria-hidden="true" />
      {formatCountdown(remainingMs)}
    </div>
  );
}
