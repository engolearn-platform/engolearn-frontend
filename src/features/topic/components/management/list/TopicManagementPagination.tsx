import { ChevronLeft, ChevronRight } from "lucide-react";

interface TopicManagementPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export default function TopicManagementPagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: TopicManagementPaginationProps) {
  const currentPage = page + 1;
  const canPrev = page > 0;
  const canNext = totalPages > 0 && page < totalPages - 1;

  return (
    <div className="flex flex-col items-center justify-between gap-3 bg-surface-container-low/40 p-4 sm:flex-row">
      <p className="text-label-sm text-on-surface-variant">
        Trang <span className="font-semibold text-on-surface">{currentPage}</span> /{" "}
        <span className="font-semibold text-on-surface">{Math.max(totalPages, 1)}</span> • Tổng số{" "}
        <span className="font-semibold text-on-surface">{totalElements}</span> chủ đề
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canPrev}
          aria-label="Trang trước"
          onClick={() => canPrev && onPageChange(page - 1)}
          className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-lowest disabled:opacity-50"
        >
          <ChevronLeft className="size-[18px]" aria-hidden="true" />
        </button>
        <span className="px-2 text-label-sm text-on-surface-variant">
          {currentPage}
        </span>
        <button
          type="button"
          disabled={!canNext}
          aria-label="Trang sau"
          onClick={() => canNext && onPageChange(page + 1)}
          className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-lowest disabled:opacity-50"
        >
          <ChevronRight className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
