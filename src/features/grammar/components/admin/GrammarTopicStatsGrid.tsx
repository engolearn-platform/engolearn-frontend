import type { LucideIcon } from "lucide-react";
import { BookOpenText, CircleCheck, Clock, NotebookPen } from "lucide-react";
import type { GrammarTopicStats } from "@features/grammar/types/grammar-topic-management.types";

interface GrammarTopicStatsGridProps {
  stats: GrammarTopicStats;
}

interface GrammarTopicStatCell {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
  valueClassName: string;
}

export function GrammarTopicStatsGrid({ stats }: GrammarTopicStatsGridProps) {
  const cells: GrammarTopicStatCell[] = [
    {
      label: "Tổng chủ đề",
      value: stats.total,
      icon: BookOpenText,
      iconClassName: "bg-primary/10 text-primary",
      valueClassName: "text-on-surface",
    },
    {
      label: "Đã xuất bản",
      value: stats.published,
      icon: CircleCheck,
      iconClassName: "bg-primary/10 text-primary",
      valueClassName: "text-primary",
    },
    {
      label: "Đang soạn",
      value: stats.inProgress,
      icon: Clock,
      iconClassName: "bg-secondary-container/50 text-on-secondary-container",
      valueClassName: "text-secondary",
    },
    {
      label: "Bản nháp",
      value: stats.draft,
      icon: NotebookPen,
      iconClassName: "bg-surface-container-high text-on-surface-variant",
      valueClassName: "text-on-surface-variant",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cells.map((cell) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.label}
            className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <span className="text-label-sm text-on-surface-variant">{cell.label}</span>
              <span className={`text-headline-sm font-bold ${cell.valueClassName}`}>
                {cell.value}
              </span>
            </div>
            <span
              className={`flex size-10 items-center justify-center rounded-lg ${cell.iconClassName}`}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
          </div>
        );
      })}
    </div>
  );
}
