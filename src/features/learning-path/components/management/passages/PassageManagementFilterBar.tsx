import { FilterX, Search } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { CefrSelect } from "@shared/components/management";
import { PASSAGE_LEVELS, PASSAGE_SKILL_LABELS, PASSAGE_STATUS_LABELS } from "@features/learning-path/types/passage-management.types";
import type { PassageFilters } from "@features/learning-path/types/passage-management.types";

interface Props {
  filter: PassageFilters;
  onChange: (patch: Partial<PassageFilters>) => void;
  onClear: () => void;
}
const selectClass = "min-h-12 rounded-xl bg-surface-container-low px-3 text-label-sm text-on-surface focus-visible:outline-2 focus-visible:outline-primary";

export default function PassageManagementFilterBar({ filter, onChange, onClear }: Props) {
  return <div className="mt-4 flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm xl:flex-row xl:items-center">
    <label className="relative min-w-0 flex-1">
      <Search aria-hidden="true" className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-outline" />
      <span className="sr-only">Tìm kiếm passage</span>
      <input type="search" maxLength={200} value={filter.keyword} onChange={event => onChange({ keyword: event.target.value })}
        placeholder="Tìm kiếm tiêu đề, nội dung passage..."
        className="min-h-12 w-full rounded-xl bg-surface-container-low pr-4 pl-12 text-body-md focus-visible:outline-2 focus-visible:outline-primary" />
    </label>
    <div className="flex flex-wrap items-center gap-3">
      <label><span className="sr-only">Lọc theo kỹ năng</span>
        <select className={selectClass} value={filter.skill} onChange={event => onChange({ skill: event.target.value as PassageFilters["skill"] })}>
          <option value="ALL">Tất cả kỹ năng</option>
          {Object.entries(PASSAGE_SKILL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <CefrSelect value={filter.level} onChange={level => onChange({ level })}
        options={PASSAGE_LEVELS.map(value => ({ value, label: value }))} className={`${selectClass} pr-8`} />
      <label><span className="sr-only">Lọc theo trạng thái</span>
        <select className={selectClass} value={filter.status} onChange={event => onChange({ status: event.target.value as PassageFilters["status"] })}>
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(PASSAGE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <Button variant="ghost" className="min-h-12 text-primary" onClick={onClear}><FilterX aria-hidden="true" className="size-4" />Xóa bộ lọc</Button>
    </div>
  </div>;
}
