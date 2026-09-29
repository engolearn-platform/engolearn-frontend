import { CircleDot, Lock } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type { TopicStructureItem } from "../../types/topic-context.types";

export interface TopicStructureNavProps {
  heading: string;
  items: TopicStructureItem[];
}

export function TopicStructureNav({ heading, items }: TopicStructureNavProps) {
  return (
    <nav className="rounded-xl border border-surface-container-high/60 bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-3 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {heading}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = item.state === "active";
          return (
            <div
              key={item.id}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-lg p-3 transition-colors",
                isActive
                  ? "border border-primary/20 bg-primary/10"
                  : "text-on-surface-variant hover:bg-surface-container-low",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {isActive ? (
                  <CircleDot className="size-5 shrink-0 text-primary" />
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
              ) : (
                <span className="shrink-0 text-label-sm text-outline">
                  Chưa mở
                </span>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
