import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@shared/utils";

interface TopicManagementPaginationProps {
  total: number;
}

const PAGE_BUTTONS = [1, 2, 3, 4];

export default function TopicManagementPagination({ total }: TopicManagementPaginationProps) {
  const [page, setPage] = useState(1);

  return (
    <div className="flex flex-col items-center justify-between gap-3 bg-surface-container-low/40 p-4 sm:flex-row">
      <p className="text-label-sm text-on-surface-variant">
        Hiển thị <span className="font-semibold text-on-surface">1–6</span> trong tổng số{" "}
        <span className="font-semibold text-on-surface">{total}</span> chủ đề
      </p>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-label-sm text-on-surface-variant">Mỗi trang:</span>
          <span className="relative">
            <select
              aria-label="Số dòng mỗi trang"
              className="cursor-pointer appearance-none rounded-lg bg-surface-container-lowest py-1 pr-7 pl-2.5 text-label-sm text-on-surface shadow-xs focus:outline-none"
            >
              <option>6 dòng / trang</option>
              <option>10 dòng / trang</option>
              <option>20 dòng / trang</option>
              <option>50 dòng / trang</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-1.5 size-4 -translate-y-1/2 text-outline-variant"
              aria-hidden="true"
            />
          </span>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            aria-label="Trang trước"
            className="flex size-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-lowest disabled:opacity-50"
          >
            <ChevronLeft className="size-[18px]" aria-hidden="true" />
          </button>
          {PAGE_BUTTONS.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              aria-current={page === pageNumber ? "page" : undefined}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-label-sm font-semibold transition-colors",
                page === pageNumber
                  ? "bg-primary-container text-on-primary shadow-xs"
                  : "text-on-surface hover:bg-surface-container-lowest",
              )}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            aria-label="Trang sau"
            className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-lowest"
          >
            <ChevronRight className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
