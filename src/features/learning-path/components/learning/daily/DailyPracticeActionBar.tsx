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
  const complete = answeredCount === questionCount;
  const finalPage = page === 4;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-on-surface-variant">
          Trang {page}/4 · Câu {firstQuestion}{lastQuestion !== firstQuestion ? `–${lastQuestion}` : ""} trên 10
        </p>
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
          {finalPage && complete
            ? "Bạn đã trả lời đủ 10 câu. Bấm “Nộp bài” để xem kết quả ngày."
            : complete
              ? "Câu trả lời sẽ được lưu khi bạn bấm “Tiếp tục”."
              : `Trả lời ${questionCount === 1 ? "câu hỏi" : `cả ${questionCount} câu`} để tiếp tục`}
        </p>
      </div>
      <Button
        type="button"
        disabled={!complete}
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
