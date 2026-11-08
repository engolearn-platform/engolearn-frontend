import { cn } from "@shared/utils";
import type { ManagementCefrLevel } from "@shared/components/management";

const CEFR_STYLES: Record<ManagementCefrLevel, string> = {
  A1: "bg-primary/10 text-primary",
  A2: "bg-tertiary/10 text-tertiary",
  B1: "bg-secondary-container/50 text-on-secondary-container",
  B2: "bg-secondary-container text-on-secondary-container",
};

interface GrammarTopicCefrBadgeProps {
  level: ManagementCefrLevel;
}

export function GrammarTopicCefrBadge({ level }: GrammarTopicCefrBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-label-sm font-bold",
        CEFR_STYLES[level],
      )}
    >
      {level}
    </span>
  );
}
