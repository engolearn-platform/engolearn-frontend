import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@shared/utils";
import LearningNavContent from "./LearningNavContent";
import { BRAND_ICON } from "./learningNav";

const SIDEBAR_PREFERENCE_KEY = "engolearn:learner-sidebar-compact";

function readPreference(): boolean | null {
  try {
    const value = window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY);
    return value === "compact" ? true : value === "expanded" ? false : null;
  } catch {
    return null;
  }
}

function useDefaultExpanded(): boolean {
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 80rem)");
    const update = () => setExpanded(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return expanded;
}

interface LearningSidebarProps {
  isAuthenticated: boolean;
}

export default function LearningSidebar({
  isAuthenticated,
}: LearningSidebarProps) {
  const [compactOverride, setCompactOverride] = React.useState<boolean | null>(readPreference);
  const defaultExpanded = useDefaultExpanded();
  const compact = compactOverride ?? !defaultExpanded;
  const BrandIcon = BRAND_ICON;

  const toggleCompact = () => {
    const nextCompact = !compact;
    setCompactOverride(nextCompact);
    try {
      window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, nextCompact ? "compact" : "expanded");
    } catch {
      // The shell remains usable when browser storage is unavailable.
    }
  };

  return (
    <aside
      aria-label="Thanh điều hướng học tập"
      className={cn(
        "z-10 hidden h-dvh shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest transition-[width] duration-200 md:flex",
        compact ? "w-[4.5rem]" : "w-[17rem]",
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center border-b border-outline-variant", compact ? "justify-center px-2" : "gap-3 px-5")}>
        <Link to="/" aria-label="EngoLearn, trang chủ" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BrandIcon className="size-5" aria-hidden="true" />
          </span>
          {!compact && <span className="truncate text-xl font-bold tracking-tight text-primary">EngoLearn</span>}
        </Link>
      </div>

      <LearningNavContent
        compact={compact}
        isAuthenticated={isAuthenticated}
      />

      <div className={cn("hidden border-t border-outline-variant p-2 md:block", compact && "px-3")}>
        <button
          id="learning-sidebar-toggle"
          type="button"
          aria-label={compact ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          aria-pressed={!compact}
          onClick={toggleCompact}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary"
        >
          {compact ? <ChevronRight className="size-4" aria-hidden="true" /> : <><ChevronLeft className="size-4" aria-hidden="true" /><span>Thu gọn</span></>}
        </button>
      </div>
    </aside>
  );
}
