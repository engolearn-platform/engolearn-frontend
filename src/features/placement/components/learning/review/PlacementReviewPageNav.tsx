import { Button } from "@/core/components/shadcn/button";
import type { PlacementReviewQuestion } from "@features/placement/types/placement-review.types";

export default function PlacementReviewPageNav({
  pages,
  pageIndex,
  totalQuestions,
  onSelectOrder,
}: {
  pages: PlacementReviewQuestion[][];
  pageIndex: number;
  totalQuestions: number;
  onSelectOrder: (order: number) => void;
}) {
  const page = pages[pageIndex];
  const firstOrder = page[0].order;
  const lastOrder = page[page.length - 1].order;

  return (
    <nav
      aria-label="Phân trang xem lại bài làm"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4"
    >
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={pageIndex === 0}
        onClick={() => onSelectOrder(pages[pageIndex - 1][0].order)}
        className="rounded-xl"
      >
        Trang trước
      </Button>
      <span className="text-label-lg font-semibold text-on-surface">
        {firstOrder === lastOrder ? `Câu ${firstOrder}` : `Câu ${firstOrder}–${lastOrder}`}
        {` / ${totalQuestions}`}
      </span>
      <Button
        type="button"
        size="lg"
        disabled={pageIndex >= pages.length - 1}
        onClick={() => onSelectOrder(pages[pageIndex + 1][0].order)}
        className="rounded-xl"
      >
        Trang tiếp
      </Button>
    </nav>
  );
}
