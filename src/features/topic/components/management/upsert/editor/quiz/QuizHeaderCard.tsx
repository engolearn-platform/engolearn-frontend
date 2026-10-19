import { ListChecks, PlusCircle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface QuizHeaderCardProps {
  itemTitleEn: string;
  totalQuestions: number;
  groupCount: number;
  onQuickAdd: () => void;
}

export default function QuizHeaderCard({
  itemTitleEn,
  totalQuestions,
  groupCount,
  onQuickAdd,
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
          Mỗi dạng quiz là một nhóm cố định: phản xạ tình huống và điền từ
          vào chỗ trống. Mỗi nhóm cần tối thiểu 2 câu hỏi, mỗi câu gồm câu
          hỏi, đáp án đúng và giải thích.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden flex-col pr-3 text-right sm:flex">
          <span className="text-label-sm text-on-surface-variant">
            Đã biên soạn
          </span>
          <span className="text-headline-sm font-bold text-primary">
            {totalQuestions} câu hỏi · {groupCount} nhóm
          </span>
        </div>
        <Button
          type="button"
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
