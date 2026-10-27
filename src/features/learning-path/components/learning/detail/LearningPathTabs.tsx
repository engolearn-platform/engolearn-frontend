import { CheckCircle2, LockKeyhole } from "lucide-react";
import { cn } from "@shared/utils";
import type {
  LearningPathDetail,
  LearningPathTab,
} from "@features/learning-path/types/learning-path-detail.types";

interface LearningPathTabsProps {
  path: LearningPathDetail;
  selected: LearningPathTab;
  onSelect: (tab: LearningPathTab) => void;
}

export default function LearningPathTabs({ path, selected, onSelect }: LearningPathTabsProps) {
  const tabs: { key: LearningPathTab; label: string; locked: boolean; closed: boolean }[] = [
    ...path.weeks.map((week) => ({
      key: week.number,
      label: `Tuần ${week.number}`,
      locked: week.status === "LOCKED",
      closed: week.status === "CLOSED",
    })),
    {
      key: "summary",
      label: "Tổng kết",
      locked: path.status !== "COMPLETED",
      closed: false,
    },
  ];

  return (
    <div className="overflow-x-auto border-b border-outline-variant/50" role="tablist" aria-label="Thông tin lộ trình">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected === tab.key}
            aria-controls="learning-path-tab-panel"
            disabled={tab.locked}
            onClick={() => onSelect(tab.key)}
            className={cn(
              "inline-flex min-h-12 items-center gap-1.5 border-b-2 border-transparent px-4 text-sm font-semibold text-on-surface-variant transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selected === tab.key && "border-primary bg-primary/5 text-primary",
              tab.locked && "cursor-not-allowed opacity-50",
              !tab.locked && selected !== tab.key && "hover:text-primary",
            )}
          >
            {tab.locked ? <LockKeyhole className="size-3.5" aria-hidden="true" /> :
              tab.closed ? <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" /> :
              tab.key !== "summary" ? <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
