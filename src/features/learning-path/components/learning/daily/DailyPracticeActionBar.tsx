import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface DailyPracticeActionBarProps {
  page: number;
  firstQuestion: number;
  lastQuestion: number;
  questionCount: number;
  answeredCount: number;
  onContinue: () => void;
}

export default function DailyPracticeActionBar({
  page,
  firstQuestion,
  lastQuestion,
  questionCount,
  answeredCount,
  onContinue,
}: DailyPracticeActionBarProps) {
  const finalPage = page === 4;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-on-surface-variant">
          Trang {page}/4 · Câu {firstQuestion}{lastQuestion !== firstQuestion ? `–${lastQuestion}` : ""} trên 10
        </p>
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
          {finalPage
            ? "Bấm “Nộp bài” để kết thúc. Câu bỏ trống sẽ được tính là chưa làm."
            : `Đã chọn ${answeredCount}/${questionCount} câu. Bạn có thể quay lại sửa trước khi nộp bài.`}
        </p>
      </div>
      <Button
        type="button"
        onClick={onContinue}
        className="h-11 min-w-32 rounded-xl px-5 font-semibold"
      >
        {finalPage ? <Check className="size-4" aria-hidden="true" /> : null}
        {finalPage ? "Nộp bài" : "Tiếp tục"}
        {!finalPage && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>
    </div>
  );
}
