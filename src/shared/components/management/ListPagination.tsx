import { cn } from "@shared/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";

interface ListPaginationProps {
  total: number;
  to: number;
  from?: number;
  itemNoun?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  pageCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const DEFAULT_PAGE_SIZE = 6;
const DEFAULT_PAGE_SIZE_OPTIONS = [6, 10, 20, 50];

export function ListPagination({
  total,
  to,
  from = 1,
  itemNoun = "chủ đề",
  pageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  pageCount,
  page,
  onPageChange,
  onPageSizeChange,
}: ListPaginationProps) {
  const [internalPage, setInternalPage] = useState(1);
  const activePage = page ?? internalPage;
  const resolvedPageCount = pageCount ?? Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: resolvedPageCount }, (_, index) => index + 1);
  // Mũi tên trước/sau chỉ hoạt động khi consumer điều khiển phân trang.
  // Ở chế độ uncontrolled chúng giữ nguyên hành vi cũ: "Trang trước" luôn
  // disabled, "Trang sau" không có handler (đổi trang qua nút số).
  const hasPagingControl = onPageChange !== undefined;

  const selectPage = (nextPage: number) => {
    if (onPageChange) {
      onPageChange(nextPage);
      return;
    }
    setInternalPage(nextPage);
  };

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange?.(Number(event.target.value));
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 bg-surface-container-low/40 p-4 sm:flex-row">
      <p className="text-label-sm text-on-surface-variant">
        Hiển thị <span className="font-semibold text-on-surface">{from}–{to}</span> trong tổng số{" "}
        <span className="font-semibold text-on-surface">{total}</span> {itemNoun}
      </p>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-label-sm text-on-surface-variant">Mỗi trang:</span>
          <span className="relative">
            <select
              aria-label="Số dòng mỗi trang"
              className="cursor-pointer appearance-none rounded-lg bg-surface-container-lowest py-1 pr-7 pl-2.5 text-label-sm text-on-surface shadow-xs focus:outline-none"
              {...(onPageSizeChange
                ? { value: pageSize, onChange: handlePageSizeChange }
                : { defaultValue: pageSize })}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} dòng / trang
                </option>
              ))}
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
            disabled={!hasPagingControl || activePage <= 1}
            onClick={hasPagingControl ? () => selectPage(activePage - 1) : undefined}
            aria-label="Trang trước"
            className="flex size-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-lowest disabled:opacity-50"
          >
            <ChevronLeft className="size-[18px]" aria-hidden="true" />
          </button>
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => selectPage(pageNumber)}
              aria-current={activePage === pageNumber ? "page" : undefined}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-label-sm font-semibold transition-colors",
                activePage === pageNumber
                  ? "bg-primary-container text-on-primary shadow-xs"
                  : "text-on-surface hover:bg-surface-container-lowest",
              )}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            disabled={!hasPagingControl ? false : activePage >= resolvedPageCount}
            onClick={hasPagingControl ? () => selectPage(activePage + 1) : undefined}
            aria-label="Trang sau"
            className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-lowest disabled:opacity-50"
          >
            <ChevronRight className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
