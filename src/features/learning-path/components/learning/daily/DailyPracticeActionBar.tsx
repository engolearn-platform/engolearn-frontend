import { ArrowRight } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface DailyPracticeActionBarProps {
  page: number;
  firstQuestion: number;
  lastQuestion: number;
  onContinue: () => void;
  disabled?: boolean;
}

export default function DailyPracticeActionBar({
  page,
  firstQuestion,
  lastQuestion,
  onContinue,
  disabled = false,
}: DailyPracticeActionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
      <p className="text-sm font-medium text-on-surface-variant">
        Trang {page}/4 · Câu {firstQuestion}{lastQuestion !== firstQuestion ? `–${lastQuestion}` : ""} trên 10
      </p>
      <Button
        type="button"
        onClick={onContinue}
        disabled={disabled}
        className="h-11 min-w-32 rounded-xl px-5 font-semibold"
      >
        Tiếp tục
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
