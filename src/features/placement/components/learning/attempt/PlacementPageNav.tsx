import { Button } from "@/core/components/shadcn/button";
import { cn } from "@shared/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PlacementPageNavProps {
  firstOrder: number;
  lastOrder: number;
  totalQuestions: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export default function PlacementPageNav({
  firstOrder,
  lastOrder,
  totalQuestions,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  className,
}: PlacementPageNavProps) {
  const rangeLabel =
    firstOrder === lastOrder
      ? `Câu ${firstOrder} / ${totalQuestions}`
      : `Câu ${firstOrder}–${lastOrder} / ${totalQuestions}`;

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-label-lg font-semibold text-on-surface-variant">
        {rangeLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={onPrevious}
          disabled={!canPrevious}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Trang trước
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={onNext}
          disabled={!canNext}
        >
          Trang tiếp
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
