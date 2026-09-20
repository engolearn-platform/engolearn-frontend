import { ChevronDown, FilterX, Search } from "lucide-react";
import type { TopicManagementFilter } from "../../types/topic.types";

interface TopicManagementFilterBarProps {
  filter: TopicManagementFilter;
  categories: string[];
  onChange: (patch: Partial<TopicManagementFilter>) => void;
  onClear: () => void;
}

export default function TopicManagementFilterBar({
  filter,
  categories,
  onChange,
  onClear,
}: TopicManagementFilterBarProps) {
  return (
    <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm xl:flex-row xl:items-center">
      <div className="relative min-w-[280px] flex-1">
        <Search
          className="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-outline-variant"
          aria-hidden="true"
        />
        <input
          type="text"
          value={filter.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Tìm kiếm topic (Tiếng Anh, Tiếng Việt, mã chủ đề)..."
          className="w-full rounded-xl bg-surface-container-low py-2 pr-4 pl-10 text-body-md text-on-surface transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="relative">
          <span className="sr-only">Lọc theo trình độ CEFR</span>
          <select
            value={filter.cefr}
            onChange={(event) =>
              onChange({ cefr: event.target.value as TopicManagementFilter["cefr"] })
            }
            className="cursor-pointer appearance-none rounded-xl bg-surface-container-low py-2 pr-8 pl-3 text-label-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            <option value="ALL">Tất cả trình độ (CEFR)</option>
            <option value="A1">A1 - Mới bắt đầu</option>
            <option value="A2">A2 - Sơ cấp</option>
            <option value="B1">B1 - Trung cấp</option>
            <option value="B2">B2 - Trung cao cấp</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2.5 size-[18px] -translate-y-1/2 text-outline-variant"
            aria-hidden="true"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Lọc theo danh mục</span>
          <select
            value={filter.category}
            onChange={(event) => onChange({ category: event.target.value })}
            className="cursor-pointer appearance-none rounded-xl bg-surface-container-low py-2 pr-8 pl-3 text-label-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2.5 size-[18px] -translate-y-1/2 text-outline-variant"
            aria-hidden="true"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Lọc theo trạng thái</span>
          <select
            value={filter.status}
            onChange={(event) =>
              onChange({ status: event.target.value as TopicManagementFilter["status"] })
            }
            className="cursor-pointer appearance-none rounded-xl bg-surface-container-low py-2 pr-8 pl-3 text-label-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản (Published)</option>
            <option value="draft">Bản nháp (Draft)</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2.5 size-[18px] -translate-y-1/2 text-outline-variant"
            aria-hidden="true"
          />
        </label>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-label-sm text-primary transition-colors hover:text-primary-container"
        >
          <FilterX className="size-4" aria-hidden="true" />
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
}
