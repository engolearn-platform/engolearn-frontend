import { PlusCircle, SpellCheck } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";

interface VocabularyHeaderCardProps {
  count: number;
  max: number;
  onAdd: () => void;
}

export default function VocabularyHeaderCard({
  count,
  max,
  onAdd,
}: VocabularyHeaderCardProps) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <div className="mb-2 flex items-center gap-2">
          <SpellCheck
            className="size-[22px] text-primary"
            aria-hidden="true"
          />
          <h1 className="text-headline-md font-semibold text-on-surface">
            Danh sách từ vựng
          </h1>
        </div>
        <p className="text-body-md text-on-surface-variant">
          Mỗi topic item nên có tối đa {max} từ cốt lõi để người học ghi nhớ
          hiệu quả trong ngữ cảnh nhà hàng.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden flex-col pr-3 text-right sm:flex">
          <span className="text-label-sm text-on-surface-variant">
            Dung lượng bộ nhớ đề xuất
          </span>
          <span className="text-headline-sm font-bold text-primary">
            {count} / {max} mục từ
          </span>
        </div>
        <Button
          type="button"
          onClick={onAdd}
          className="w-full rounded-xl bg-primary-container text-on-primary hover:bg-primary sm:w-auto"
        >
          <PlusCircle className="size-5" aria-hidden="true" />
          Thêm từ vựng mới
        </Button>
      </div>
    </section>
  );
}
