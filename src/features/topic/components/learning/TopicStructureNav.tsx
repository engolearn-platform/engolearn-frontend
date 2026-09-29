import { CheckCircle2, Circle, CircleDot, Lock } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type { TopicStructureItem } from "../../types/topic-context.types";

export interface TopicStructureNavProps {
  heading: string;
  items: TopicStructureItem[];
  onNavigate?: (id: string) => void;
}

export function TopicStructureNav({
  heading,
  items,
  onNavigate,
}: TopicStructureNavProps) {
  return (
    <nav className="rounded-xl border border-surface-container-high/60 bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-3 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {heading}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = item.state === "active";
          const isDone = item.state === "done";
          const isAvailable = item.state === "available";
          const isLocked = item.state === "locked";
          const clickable = !isLocked && onNavigate !== undefined;
          return (
            <button
              key={item.id}
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onNavigate(item.id) : undefined}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={isLocked}
              className={cn(
                "flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors",
                isActive
                  ? "border border-primary/20 bg-primary/10"
                  : "text-on-surface-variant hover:bg-surface-container-low",
                !clickable && "cursor-default",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {isActive ? (
                  <CircleDot className="size-5 shrink-0 text-primary" />
                ) : isDone ? (
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                ) : isAvailable ? (
                  <Circle className="size-5 shrink-0 text-primary" />
                ) : (
                  <Lock className="size-5 shrink-0 text-outline" />
                )}
                <span
                  className={cn(
                    "truncate text-label-lg text-on-surface",
                    isActive && "font-semibold text-primary",
                  )}
                >
                  {item.label}
                </span>
              </div>
              {isActive ? (
                <span className="shrink-0 rounded-full bg-primary-fixed/40 px-2 py-0.5 text-label-sm font-semibold text-primary">
                  Đang học
                </span>
              ) : isDone ? (
                <span className="shrink-0 text-label-sm font-medium text-primary">
                  Hoàn tất
                </span>
              ) : isAvailable ? (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-semibold text-primary">
                  Bắt đầu
                </span>
              ) : (
                <span className="shrink-0 text-label-sm text-outline">
                  Chưa mở
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
