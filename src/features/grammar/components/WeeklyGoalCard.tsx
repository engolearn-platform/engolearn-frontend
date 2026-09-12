import { Button } from "@/core/components/shadcn/button";
import { Trophy } from "lucide-react";
import type { WeeklyGoal } from "../types/grammar.types";

interface WeeklyGoalCardProps {
  goal: WeeklyGoal;
  onViewDetails?: () => void;
}

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function WeeklyGoalCard({
  goal,
  onViewDetails,
}: WeeklyGoalCardProps) {
  const ratio =
    goal.total > 0
      ? Math.min(1, Math.max(0, goal.completed / goal.total))
      : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);

  return (
    <section
      aria-label="Mục tiêu hiện tại"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-headline-sm font-semibold text-on-surface">
          Mục tiêu hiện tại
        </h3>
        <Trophy
          className="size-6 text-on-secondary-container"
          aria-hidden="true"
        />
      </div>
      <div className="mb-4 text-center">
        <div className="relative inline-flex size-24 items-center justify-center rounded-full border-4 border-primary/20">
          <svg
            className="absolute inset-0 size-full -rotate-90 text-primary"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="text-headline-lg font-bold text-primary">
            {goal.completed}/{goal.total}
          </span>
        </div>
      </div>
      <p className="mb-4 text-center text-body-md text-on-surface-variant">
        Hoàn thành {goal.total} bài học ngữ pháp tuần này
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onViewDetails}
        className="w-full rounded-xl border-primary text-primary hover:bg-primary/5 hover:text-primary"
      >
        Xem chi tiết
      </Button>
    </section>
  );
}
