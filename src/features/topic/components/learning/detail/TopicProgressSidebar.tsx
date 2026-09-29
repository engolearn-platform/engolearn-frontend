import { Brain, ClipboardList, MessagesSquare } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type {
  TopicProgressStat,
  TopicProgressStatIcon,
} from "../../../types/topic-detail.types";

export interface TopicProgressSidebarProps {
  percent: number;
  stats: TopicProgressStat[];
  actionLabel: string;
  onContinue: () => void;
}

const STAT_ICONS: Record<TopicProgressStatIcon, typeof Brain> = {
  vocab: Brain,
  expressions: MessagesSquare,
  practice: ClipboardList,
};

export function TopicProgressSidebar({
  percent,
  stats,
  actionLabel,
  onContinue,
}: TopicProgressSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <h2 className="text-headline-sm font-semibold text-on-surface">
          Tiến độ Chủ đề
        </h2>
        <div>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-label-lg text-on-surface-variant">
              Tổng quan
            </span>
            <span className="text-headline-md font-semibold text-primary">
              {percent}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div aria-hidden="true" className="h-px w-full bg-outline-variant" />
        <div className="flex flex-col gap-4">
          {stats.map((stat) => {
            const Icon = STAT_ICONS[stat.icon];
            return (
              <div key={stat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Icon className="size-5 text-primary" />
                  <span className="text-body-md">{stat.label}</span>
                </div>
                <span className="text-label-lg font-semibold text-on-surface">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <Button
        type="button"
        size="lg"
        onClick={onContinue}
        className="w-full rounded-xl text-headline-sm text-on-primary shadow-md"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
