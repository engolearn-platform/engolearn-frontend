import { Zap, CheckCircle2, ListChecks, Clock, Link2, Play, Lock, ArrowRight } from "lucide-react";
import { Card } from "@shared/components/Card";
import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils/cn";

type Status = "inProgress" | "completed" | "locked";

export interface TopicCardProps {
  id: string;
  title: string;
  imgSrc: string;
  status: Status;
  vocabCount: number;
  duration: string;
  progress?: number;
  linkLabel?: string;
  onAction?: () => void;
}

export function TopicCard({ title, imgSrc, status, vocabCount, duration, progress, linkLabel, onAction }: TopicCardProps) {
  const isLocked = status === "locked";
  const isInProgress = status === "inProgress";
  const isCompleted = status === "completed";

  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group relative p-0 rounded-2xl border-outline-variant/40",
        isLocked && "opacity-75 grayscale-[30%]"
      )}
    >
      {/* Image / Banner area */}
      <div className="h-32 bg-surface-container-low relative overflow-hidden">
        {isLocked ? (
          <div className="h-full flex items-center justify-center bg-surface-container-high">
            <Lock className="size-8 text-on-surface-variant/40" />
          </div>
        ) : (
          <img src={imgSrc} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        {/* Status badge */}
        {!isLocked && (
          <div
            className={cn(
              "absolute top-3 left-3 px-2 py-1 rounded-md text-label-sm font-semibold flex items-center gap-1 shadow-sm",
              isInProgress
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface text-primary border border-outline-variant/20"
            )}
          >
            {isInProgress && <Zap className="size-3.5" fill="currentColor" />}
            {isCompleted && <CheckCircle2 className="size-3.5 text-primary" fill="currentColor" />}
            {isInProgress ? "Đang học" : "Đã xong"}
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-[2px] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-surface shadow-sm flex items-center justify-center text-on-surface-variant">
              <Lock className="size-5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col h-full">
        <h3 className={cn("text-headline-sm font-semibold text-on-surface mb-2", !isLocked && "group-hover:text-primary transition-colors", isLocked && "text-on-surface-variant")}>
          {title}
        </h3>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-on-surface-variant text-label-sm bg-surface-container-low px-2 py-1 rounded-md">
            <ListChecks className="size-3.5" />
            {vocabCount} Từ vựng
          </span>
          <span className="inline-flex items-center gap-1 text-on-surface-variant text-label-sm bg-surface-container-low px-2 py-1 rounded-md">
            <Clock className="size-3.5" />
            {duration}
          </span>
        </div>

        {/* Progress bar (in-progress only) */}
        {isInProgress && typeof progress === "number" && (
          <div className="mb-4">
            <div className="flex justify-between text-label-sm mb-1 text-on-surface-variant">
              <span>Tiến độ</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Completed progress bar (100%) */}
        {isCompleted && (
          <div className="mb-4">
            <div className="flex justify-between text-label-sm mb-1 text-primary">
              <span>Hoàn thành</span>
              <span>100%</span>
            </div>
            <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
            </div>
          </div>
        )}

        {/* Locked hint */}
        {isLocked && (
          <p className="text-body-md text-sm text-on-surface-variant/80 mb-4 line-clamp-2">
            Hoàn thành bài học "Thói quen hằng ngày" để mở khóa chủ đề này.
          </p>
        )}

        {/* Footer */}
        <div className={cn("mt-auto flex items-center justify-between", isCompleted && "pt-1 border-t border-outline-variant/20")}>
          <span className="text-xs text-on-surface-variant/80 flex items-center gap-1">
            <Link2 className="size-3.5" />
            {linkLabel ?? ""}
          </span>
          {isInProgress && (
            <Button variant="default" size="icon" onClick={onAction} className="rounded-full">
              <Play className="size-4" fill="currentColor" />
            </Button>
          )}
          {isCompleted && (
            <button className="text-primary text-label-sm font-semibold flex items-center gap-1 hover:underline">
              Ôn tập <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
