import { CefrSelect } from "@shared/components/management";
import type { ManagementCefrOption } from "@shared/components/management";
import { ChevronDown, FilterX, Search } from "lucide-react";
import type {
  GrammarTopicFilter,
  GrammarTopicStatusFilter,
} from "@features/grammar/types/grammar-topic-management.types";

const CEFR_OPTIONS: ManagementCefrOption[] = [
  { value: "A1", label: "A1 - Sơ cấp" },
  { value: "A2", label: "A2 - Cơ bản" },
  { value: "B1", label: "B1 - Trung cấp" },
  { value: "B2", label: "B2 - Trung cao" },
];

const STATUS_OPTIONS: { value: GrammarTopicStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "published", label: "Đã xuất bản" },
  { value: "in_progress", label: "Đang soạn" },
  { value: "draft", label: "Bản nháp" },
];

const SELECT_CLASS =
  "cursor-pointer appearance-none rounded-xl bg-surface-container-low py-2 pr-8 pl-3 text-label-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none";

const CHEVRON_CLASS =
  "pointer-events-none absolute top-1/2 right-2.5 size-[18px] -translate-y-1/2 text-outline-variant";

interface GrammarTopicFilterBarProps {
  filter: GrammarTopicFilter;
  onChange: (patch: Partial<GrammarTopicFilter>) => void;
  onClear: () => void;
}

export function GrammarTopicFilterBar({
  filter,
  onChange,
  onClear,
}: GrammarTopicFilterBarProps) {
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
          placeholder="Tìm kiếm chủ đề ngữ pháp (Tiếng Anh, Tiếng Việt, mã chủ đề)..."
          className="w-full rounded-xl bg-surface-container-low py-2 pr-4 pl-10 text-body-md text-on-surface transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <CefrSelect
          value={filter.cefr}
          onChange={(cefr) => onChange({ cefr })}
          options={CEFR_OPTIONS}
          className={SELECT_CLASS}
          chevronClassName={CHEVRON_CLASS}
        />
        <label className="relative">
          <span className="sr-only">Lọc theo trạng thái</span>
          <select
            value={filter.status}
            onChange={(event) =>
              onChange({ status: event.target.value as GrammarTopicStatusFilter })
            }
            className={SELECT_CLASS}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className={CHEVRON_CLASS} aria-hidden="true" />
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
