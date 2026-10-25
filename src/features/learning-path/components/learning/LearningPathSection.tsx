import { CheckCircle2, ChevronRight, FolderOpen, FolderX } from "lucide-react";
import type { ReactNode } from "react";

interface LearningPathSectionProps {
  title: string;
  count: number;
  icon: "active" | "completed" | "cancelled";
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}

const iconMap = {
  active: FolderOpen,
  completed: CheckCircle2,
  cancelled: FolderX,
};

export default function LearningPathSection({
  title,
  count,
  icon,
  collapsible = false,
  expanded = true,
  onToggle,
  children,
}: LearningPathSectionProps) {
  const Icon = iconMap[icon];

  const header = (
    <>
      <Icon className="size-4 shrink-0 text-primary lg:size-[18px]" aria-hidden="true" />

      <span className="text-sm font-bold text-on-surface lg:text-[16px] lg:leading-6">
        {title}
      </span>

      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary lg:size-6">
        {count}
      </span>
    </>
  );

  return (
    <section>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center gap-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3.5 py-3 text-left transition-colors duration-150 hover:border-primary/30 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:h-[50px] lg:min-h-0 lg:gap-3 lg:rounded-[12px] lg:px-4 lg:py-0"
        >
          {header}

          <ChevronRight
            className={`ml-auto size-5 shrink-0 text-on-surface-variant transition-transform duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex items-center gap-2.5 border-b border-outline-variant/40 pb-2.5 lg:min-h-[42.5px] lg:gap-3 lg:pb-0 lg:pl-1">
          {header}
        </div>
      )}

      {expanded && <div className="pt-3 lg:pt-4">{children}</div>}
    </section>
  );
}
