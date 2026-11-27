import { ListChecks, PlusCircle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface QuizHeaderCardProps {
  itemTitleEn: string;
  totalQuestions: number;
  groupCount: number;
  onQuickAdd: () => void;
  disabled?: boolean;
}

export default function QuizHeaderCard({
  itemTitleEn,
  totalQuestions,
  groupCount,
  onQuickAdd,
  disabled = false,
}: QuizHeaderCardProps) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <div className="mb-2 flex items-center gap-2">
          <ListChecks className="size-[22px] text-primary" aria-hidden="true" />
          <h1 className="text-headline-md font-semibold text-on-surface">
            Bài tập &amp; Quiz — {itemTitleEn}
          </h1>
        </div>
        <p className="text-body-md text-on-surface-variant">
          Khi xuất bản, mỗi dạng quiz cần 3–5 câu hỏi. Bản nháp được phép chưa hoàn chỉnh.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex flex-col pr-3 text-left sm:text-right" aria-label={`Tổng số câu hỏi: ${totalQuestions}`}>
          <span className="text-label-sm text-on-surface-variant">
            Tổng số câu hỏi
          </span>
          <span className="text-headline-sm font-bold text-primary">
            {totalQuestions} câu hỏi · {groupCount} module
          </span>
        </div>
        <Button
          type="button"
          disabled={disabled}
          onClick={onQuickAdd}
          className="w-full rounded-xl bg-primary-container text-on-primary hover:bg-primary sm:w-auto"
        >
          <PlusCircle className="size-5" aria-hidden="true" />
          Thêm câu hỏi nhanh
        </Button>
      </div>
    </section>
  );
}
