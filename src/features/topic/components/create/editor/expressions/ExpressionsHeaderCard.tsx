import { MessagesSquare, PlusCircle } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface ExpressionsHeaderCardProps {
  itemTitleEn: string;
  totalExamples: number;
  purposeCount: number;
  maxPurposes: number;
  onAdd: () => void;
}

export default function ExpressionsHeaderCard({
  itemTitleEn,
  totalExamples,
  purposeCount,
  maxPurposes,
  onAdd,
}: ExpressionsHeaderCardProps) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <div className="mb-2 flex items-center gap-2">
          <MessagesSquare
            className="size-[22px] text-primary"
            aria-hidden="true"
          />
          <h1 className="text-headline-md font-semibold text-on-surface">
            Mẫu câu giao tiếp — {itemTitleEn}
          </h1>
        </div>
        <p className="text-body-md text-on-surface-variant">
          Mẫu câu thuộc về toàn bộ tình huống, giúp người học phản xạ tự nhiên
          trong ngữ cảnh thực tế. Tối đa {maxPurposes} nhóm mục đích, mỗi nhóm
          tối đa 3 mẫu câu.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden flex-col pr-3 text-right sm:flex">
          <span className="text-label-sm text-on-surface-variant">
            Đã biên soạn
          </span>
          <span className="text-headline-sm font-bold text-primary">
            {totalExamples} mẫu câu · {purposeCount}/{maxPurposes} nhóm
          </span>
        </div>
        <Button
          type="button"
          onClick={onAdd}
          className="w-full rounded-xl bg-primary-container text-on-primary hover:bg-primary sm:w-auto"
        >
          <PlusCircle className="size-5" aria-hidden="true" />
          Thêm mẫu câu mới
        </Button>
      </div>
    </section>
  );
}
