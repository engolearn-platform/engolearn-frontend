import { LockKeyhole } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "@shared/utils";
import type { GrammarLevel } from "@features/grammar/types/grammar-admin.types";
import type { GrammarRoadmapLevel } from "@features/grammar/types/grammar.types";

const labels = { A1: "Sơ cấp", A2: "Cơ bản", B1: "Trung cấp", B2: "Trung cao" };
interface Props { levels: GrammarRoadmapLevel[]; active: GrammarLevel; onSelect: (level: GrammarLevel) => void }
export default function CefrTabs({ levels, active, onSelect }: Props) {
  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = levels.length - 1;
    const next = event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
        : event.key === "Home" ? 0 : event.key === "End" ? last : null;
    if (next === null) return;
    event.preventDefault(); onSelect(levels[next].level);
    document.getElementById(`grammar-level-${levels[next].level}`)?.focus();
  }
  return <div role="tablist" aria-label="Trình độ ngữ pháp" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {levels.map((group, index) => <button key={group.level} id={`grammar-level-${group.level}`} type="button" role="tab"
      tabIndex={active === group.level ? 0 : -1} aria-selected={active === group.level}
      aria-controls={`grammar-level-panel-${group.level}`} aria-label={`${group.level}, ${labels[group.level]}${group.unlocked ? "" : ", chưa mở khóa"}`}
      onClick={() => onSelect(group.level)} onKeyDown={(event) => handleKey(event, index)}
      className={cn("min-w-0 space-y-3 rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        active === group.level ? "border-primary bg-learning-mint" : "border-learning-outline bg-white hover:border-primary")}>
      <span className="flex items-center justify-between gap-2 text-label-lg font-bold">
        {group.level} · {labels[group.level]} {!group.unlocked && <LockKeyhole className="size-4 shrink-0" aria-hidden="true" />}
      </span>
      <span className="block h-2 overflow-hidden rounded-full bg-learning-outline" aria-hidden="true">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${group.percent}%` }} />
      </span>
      <span className="block text-label-sm text-on-surface-variant">{group.completedTopics}/{group.totalTopics} chủ đề · {group.percent}%</span>
    </button>)}
  </div>;
}
