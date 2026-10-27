import { TOPIC_LEVELS } from "@features/topic/utils/topic-catalog";
import type { CefrLevelDto } from "@features/topic/types/topic-api.types";

export default function TopicFilterChips({ selected, currentLevel, onChange }: { selected: string; currentLevel: CefrLevelDto | null; onChange: (value: string) => void }) {
  const levels = [{ value: "all", label: "Tất cả" }, ...(currentLevel ? [{ value: "mine", label: "Đúng level của bạn (" + currentLevel + ")" }] : []), ...TOPIC_LEVELS.map(value => ({ value, label: value }))];
  return <div role="group" aria-label="Lọc theo trình độ" className="flex flex-wrap items-center gap-2">
    <span className="mr-1 text-label-lg text-on-surface-variant">Trình độ:</span>
    {levels.map(level => <button type="button" key={level.value} aria-pressed={selected === level.value} onClick={() => onChange(level.value)}
      className={"min-h-11 rounded-full px-4 py-2 text-label-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
        (selected === level.value ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-primary/10")}>{level.label}</button>)}
  </div>;
}
