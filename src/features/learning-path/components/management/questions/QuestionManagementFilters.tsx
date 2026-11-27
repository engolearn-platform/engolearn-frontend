import { FilterX, Search } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { CefrSelect } from "@shared/components/management";
import { PASSAGE_LEVELS, PASSAGE_SKILL_LABELS, PASSAGE_STATUS_LABELS } from "@features/learning-path/types/passage-management.types";
import { QUESTION_MICRO_SKILLS } from "@features/learning-path/types/question-management.types";
import type { QuestionFilters } from "@features/learning-path/types/question-management.types";

const selectClass = "min-h-12 max-w-full rounded-xl bg-surface-container-low px-3 text-label-sm text-on-surface focus-visible:outline-2 focus-visible:outline-primary";
export default function QuestionManagementFilters({ filter, onChange, onClear }: {
  filter: QuestionFilters; onChange: (patch: Partial<QuestionFilters>) => void; onClear: () => void;
}) {
  const skills = QUESTION_MICRO_SKILLS.filter(item => filter.skill === "ALL" || item.skill === filter.skill);
  return <section aria-label="Bộ lọc câu hỏi" className="mt-4 space-y-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
    <div className="flex flex-col gap-3 lg:flex-row">
      <label className="relative min-w-0 flex-1">
        <Search aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-outline" />
        <span className="sr-only">Tìm kiếm câu hỏi theo nội dung hoặc mã</span>
        <input type="search" maxLength={200} value={filter.keyword} onChange={event => onChange({ keyword: event.target.value })}
          placeholder="Tìm kiếm nội dung hoặc mã câu hỏi..." className={`${selectClass} w-full pl-12 text-body-md`} />
      </label>
      <label className="min-w-0 lg:w-72"><span className="sr-only">Lọc theo mã passage</span>
        <input placeholder="Lọc theo mã passage" maxLength={100} value={filter.passageId}
          onChange={event => onChange({ passageId: event.target.value })} className={`${selectClass} w-full`} />
      </label>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <label><span className="sr-only">Kỹ năng</span><select className={selectClass} value={filter.skill}
        onChange={event => onChange({ skill: event.target.value as QuestionFilters["skill"], microSkill: "" })}>
        <option value="ALL">Tất cả kỹ năng</option>{Object.entries(PASSAGE_SKILL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className="min-w-0"><span className="sr-only">Kỹ năng nhỏ</span><select className={selectClass} value={filter.microSkill} onChange={event => onChange({ microSkill: event.target.value })}>
        <option value="">Tất cả kỹ năng nhỏ</option>{skills.map(skill => <option key={skill.value} value={skill.value}>{skill.label}</option>)}
        {filter.microSkill && !skills.some(item => item.value === filter.microSkill) && <option value={filter.microSkill}>{filter.microSkill}</option>}
      </select></label>
      <CefrSelect value={filter.level} onChange={level => onChange({ level })} options={PASSAGE_LEVELS.map(value => ({ value, label: value }))} className={selectClass} />
      <label><span className="sr-only">Trạng thái</span><select className={selectClass} value={filter.status} onChange={event => onChange({ status: event.target.value as QuestionFilters["status"] })}>
        <option value="ALL">Tất cả trạng thái</option>{Object.entries(PASSAGE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <Button variant="ghost" className="min-h-12 text-primary" onClick={onClear}><FilterX aria-hidden="true" className="size-4" />Xóa bộ lọc</Button>
    </div>
  </section>;
}
