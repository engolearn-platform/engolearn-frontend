import { cn } from "@shared/utils";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";

interface ListPaginationProps {
  /** Opt-in compact controls for Grammar/Placement; existing consumers retain their layout. */
  compact?: boolean;
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
  compact = false,
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

  if (compact) {
    const count = Math.max(1, resolvedPageCount);
    const current = Math.min(count, Math.max(1, activePage));
    const start = Math.min(Math.max(2, current - 1), Math.max(2, count - 3));
    const end = Math.min(count - 1, start + 2);
    const visible: (number | "before" | "after")[] = count <= 7
      ? Array.from({ length: count }, (_, index) => index + 1)
      : [1, ...(start > 2 ? ["before" as const] : []),
        ...Array.from({ length: end - start + 1 }, (_, index) => start + index),
        ...(end < count - 1 ? ["after" as const] : []), count];
    const controlClass = "inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest text-label-lg font-semibold text-primary hover:bg-learning-mint focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40";
    return <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low/40 p-4 lg:flex-row">
      <label className="flex items-center gap-3 text-label-lg text-on-surface-variant">
        <span>Số dòng mỗi trang</span>
        <select aria-label="Số dòng mỗi trang" className="min-h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-label-lg text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          value={pageSize} onChange={handlePageSizeChange}>
          {pageSizeOptions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <nav aria-label="Phân trang" className="flex items-center justify-center gap-1">
        <button type="button" className={controlClass} aria-label="Trang trước" disabled={!hasPagingControl || current <= 1} onClick={() => selectPage(current - 1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
        <span className="px-3 text-label-lg font-semibold text-on-surface sm:hidden" aria-live="polite">Trang {current}/{count}</span>
        <div className="hidden items-center gap-1 sm:flex">
          {visible.map(item => typeof item === "number"
            ? <button key={item} type="button" aria-label={`Trang ${item}`} aria-current={item === current ? "page" : undefined}
              className={cn(controlClass, item === current && "border-primary bg-primary text-on-primary hover:bg-primary-container")}
              onClick={() => selectPage(item)}>{item}</button>
            : <span key={item} className="grid size-8 place-items-center text-on-surface-variant" aria-hidden="true">…</span>)}
        </div>
        <button type="button" className={controlClass} aria-label="Trang sau" disabled={!hasPagingControl || current >= count} onClick={() => selectPage(current + 1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
      </nav>
    </div>;
  }

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
