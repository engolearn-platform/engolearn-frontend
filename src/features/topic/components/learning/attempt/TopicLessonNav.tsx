import { CheckCircle2, ChevronDown, LockKeyhole, LocateFixed } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { LESSON_SECTIONS, canViewPosition, contentPositions, samePosition } from "@features/topic/utils/topic-lesson";
import type { AttemptDto, LessonContentDto, PositionDto } from "@features/topic/types/topic-api.types";

export function TopicLessonNav({ attempt, content, viewing, disabled, onSelect, onFrontier }: {
  attempt: AttemptDto; content: LessonContentDto; viewing: PositionDto | null; disabled: boolean;
  onSelect: (position: PositionDto) => void; onFrontier: () => void;
}) {
  const units = contentPositions(content);
  const practice = viewing === null || viewing.stage === "FILL_BLANK" || viewing.stage === "SITUATIONAL_CHOICE";
  const practiceUnlocked = attempt.status === "COMPLETED" || attempt.position?.stage === "FILL_BLANK" || attempt.position?.stage === "SITUATIONAL_CHOICE";
  return <div className="space-y-5">
    <nav aria-label="Cấu trúc bài học" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="mb-4 text-label-lg font-semibold uppercase text-on-surface-variant">Cấu trúc bài học</h2>
      <div className="space-y-3">{LESSON_SECTIONS.map((section, sectionIndex) => {
        const active = section.stage === "FILL_BLANK" ? practice : viewing?.stage === section.stage;
        const children = units.filter(unit => unit.stage === section.stage);
        return <details key={section.stage + ":" + active} open={active} className="group rounded-xl border border-outline-variant/30 bg-surface/50">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-3 font-semibold text-on-surface focus-visible:outline-2 focus-visible:outline-primary">
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
            <span className={active ? "text-primary" : ""}>{sectionIndex + 1}. {section.label}</span>
          </summary>
          <div className="space-y-1 border-t border-outline-variant/30 p-2">
            {section.stage === "FILL_BLANK" ? <>
              {["Điền từ", "Chọn tình huống"].map((label, index) => <p key={label} className="px-3 py-2 text-label-sm text-on-surface-variant">{index + 1}. {label}</p>)}
              <Button type="button" variant={active ? "default" : "ghost"} disabled={disabled || !practiceUnlocked}
                onClick={onFrontier} className="min-h-12 w-full whitespace-normal rounded-xl">Vị trí luyện tập</Button>
            </> : children.length === 0 ? <p className="px-3 py-2 text-label-sm text-on-surface-variant">Không có nội dung trong phần này</p> :
              children.map(unit => {
                const allowed = canViewPosition(unit, attempt, content);
                const selected = samePosition(unit, viewing);
                const frontier = samePosition(unit, attempt.position);
                return <button type="button" key={unit.stage + unit.itemIndex} disabled={disabled || !allowed}
                  aria-current={selected ? "step" : undefined} onClick={() => onSelect(unit)}
                  className={"flex min-h-12 w-full items-start gap-2 rounded-lg px-3 py-3 text-left text-label-lg transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 " +
                    (selected ? "bg-primary/10 font-semibold text-primary" : "hover:bg-primary/5")}>
                  {!allowed ? <LockKeyhole className="mt-1 size-4 shrink-0" aria-hidden="true" /> : !frontier ? <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" /> : <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                  <span className="min-w-0 flex-1 break-words">{unit.itemIndex + 1}. {unit.label}</span>
                  {frontier && <span className="shrink-0 text-label-sm">Đang học</span>}
                </button>;
              })}
          </div>
        </details>;
      })}</div>
    </nav>
    <Button type="button" variant="outline" onClick={onFrontier} disabled={disabled}
      className="min-h-12 w-full whitespace-normal rounded-xl border-primary/30 bg-primary/5 text-primary">
      <LocateFixed className="size-5 shrink-0" aria-hidden="true" />Quay lại vị trí đang học
    </Button>
  </div>;
}
