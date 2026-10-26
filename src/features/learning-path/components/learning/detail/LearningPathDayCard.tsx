import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils";
import { percentage, scoreLabel } from "@features/learning-path/utils/learningPathMetrics";
import type { LearningPathDay } from "@features/learning-path/types/learning-path-detail.types";
import LearningPathProgress from "./LearningPathProgress";

interface LearningPathDayCardProps {
  day: LearningPathDay;
  closedWeek: boolean;
}

export default function LearningPathDayCard({ day, closedWeek }: LearningPathDayCardProps) {
  const progress = percentage(day.answered, day.assigned) ?? 0;
  const practiceScore = day.correct === null ? null : percentage(day.correct, day.answered);
  const statusLabel = day.status === "COMPLETED" ? "Hoàn thành" :
    day.status === "CLOSED" ? "Đã đóng · chưa hoàn thành" :
      day.status === "IN_PROGRESS" ? "Đang làm dở" : "Chưa bắt đầu";
  const active = day.status === "IN_PROGRESS";
  const actionLabel = closedWeek ? "Xem kết quả" : active ? "Tiếp tục luyện tập" : "Bắt đầu luyện tập";

  return (
    <article className={cn(
      "flex h-full flex-col rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm",
      active && "border-primary/30",
    )}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-on-surface">Ngày {day.number}</h3>
        <span className={cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium",
          day.status === "COMPLETED" && "border-primary/20 bg-primary/10 text-primary",
          day.status === "CLOSED" && "border-secondary-container bg-secondary-container/30 text-on-secondary-container",
          active && "border-secondary-container bg-secondary-container/30 text-on-secondary-container",
          day.status === "NOT_STARTED" && "border-outline-variant/50 bg-surface-container-low text-on-surface-variant",
        )}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 border-t border-outline-variant/40 pt-4">
        <div className="flex justify-between gap-2 text-sm">
          <span className="text-on-surface-variant">Tiến độ</span>
          <span className="font-semibold text-on-surface">{day.answered}/{day.assigned} câu</span>
        </div>
        <LearningPathProgress
          value={progress}
          label={`Ngày ${day.number}: ${progress}% hoàn thành`}
          fillClassName={day.status === "CLOSED" ? "bg-secondary-container" : undefined}
          className="mt-2"
        />
      </div>

      {closedWeek && (
        <div className="mt-4 flex justify-between gap-2 border-t border-outline-variant/40 pt-3 text-sm">
          <span className="text-on-surface-variant">Practice Score</span>
          <span className="font-semibold text-primary">{scoreLabel(practiceScore)}</span>
        </div>
      )}

      <Button
        type="button"
        variant={closedWeek || !active ? "outline" : "default"}
        disabled
        title={closedWeek ? "Màn kết quả ngày chưa được dựng." : "Màn làm bài chưa được dựng."}
        className={cn(
          "mt-5 h-11 w-full rounded-xl font-semibold disabled:cursor-not-allowed disabled:opacity-100",
          (closedWeek || !active) && "border-primary text-primary disabled:bg-white disabled:text-primary",
        )}
      >
        {!closedWeek && !active && <Play className="size-3.5" />}
        {actionLabel}
        {(closedWeek || active) && <ArrowRight className="size-4" />}
      </Button>
    </article>
  );
}
