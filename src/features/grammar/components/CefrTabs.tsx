import { cn } from "@shared/utils";
import type { CefrLevel, CefrTab } from "../types/grammar.types";

interface CefrTabsProps {
  tabs: CefrTab[];
  active: CefrLevel;
  onSelect: (level: CefrLevel) => void;
}

export default function CefrTabs({ tabs, active, onSelect }: CefrTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Chọn trình độ"
      className="scrollbar-hide flex gap-2 overflow-x-auto pb-2"
    >
      {tabs.map((tab) => {
        const isActive = tab.level === active;
        return (
          <button
            key={tab.level}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onSelect(tab.level)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-label-lg whitespace-nowrap transition-colors",
              isActive
                ? "border-primary bg-primary font-semibold text-on-primary"
                : "border-tertiary bg-transparent text-tertiary hover:bg-surface-container-low",
              tab.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
