import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Circle, CircleDot, LockKeyhole, LocateFixed } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { LESSON_SECTIONS, canViewPosition, contentPositions, samePosition } from "@features/topic/utils/topic-lesson";
import type { AttemptDto, LessonContentDto, PositionDto, QuizNavigationEntryDto } from "@features/topic/types/topic-api.types";

export function TopicLessonNav({ attempt, content, viewing, disabled, onSelect, onFrontier, entries = [], review = false }: {
  attempt: AttemptDto; content: LessonContentDto; viewing: PositionDto | null; disabled: boolean;
  onSelect: (position: PositionDto) => void; onFrontier?: () => void; entries?: QuizNavigationEntryDto[]; review?: boolean;
}) {
  const units = contentPositions(content);
  const viewedStage = viewing?.stage === "SITUATIONAL_CHOICE" ? "FILL_BLANK" : viewing?.stage;
  const learningStage = attempt.status === "IN_PROGRESS" ? attempt.position?.stage === "SITUATIONAL_CHOICE" ? "FILL_BLANK" : attempt.position?.stage : undefined;
  const viewedGroup = viewing?.stage === "FILL_BLANK" || viewing?.stage === "SITUATIONAL_CHOICE" ? viewing.stage : undefined;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({ ...(viewedStage ? { [viewedStage]: true } : {}), ...(learningStage ? { [learningStage]: true } : {}), ...(viewedGroup ? { ["quiz:" + viewedGroup]: true } : {}) }));
  useEffect(() => { setExpanded(previous => ({ ...previous, ...(viewedStage ? { [viewedStage]: true } : {}), ...(viewedGroup ? { ["quiz:" + viewedGroup]: true } : {}) })); }, [viewedStage, viewedGroup]);
  const progress = attempt.progress;
  // These are committed server counters, independent of viewed/unlocked rows.
  const contentCompleted = Math.max(0, progress.completedStepCount - progress.completedQuizCount);
  const contextCompleted = Math.min(1, contentCompleted);
  // learnedExpressionCount counts examples, but each purpose is one navigation
  // step. Derive committed purpose steps from the server's completed-step total.
  const purposesCompleted = Math.max(0, contentCompleted - contextCompleted - progress.learnedVocabularyCount);
  const committed: Record<string, number> = { CONTEXT: contextCompleted, VOCAB: progress.learnedVocabularyCount, EXPRESSIONS: purposesCompleted };
  return <nav aria-label={review ? "Nội dung xem lại" : "Cấu trúc bài học"} className="overflow-hidden rounded-2xl border border-learning-outline bg-surface-container-lowest shadow-sm">
    <div className="sticky top-0 z-10 border-b border-learning-outline bg-surface-container-lowest p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-headline-sm font-semibold">Cấu trúc bài học</h2>
        {onFrontier && learningStage && <Button type="button" variant="ghost" onClick={onFrontier} disabled={disabled} className={"min-h-12 rounded-xl border px-3 text-label-sm font-semibold text-primary hover:bg-learning-mint " + (samePosition(viewing, attempt.position) ? "border-transparent bg-surface-container-low" : "border-learning-nav-border bg-learning-mint")}><LocateFixed className="size-4 shrink-0" aria-hidden="true" />Về mục đang học</Button>}
      </div>
    </div>
    <div className="space-y-2 p-3 lg:max-h-screen lg:overflow-y-auto lg:scroll-thin">{LESSON_SECTIONS.map((section, index) => {
      const practice = section.stage === "FILL_BLANK";
      const rows = practice ? entries.map(entry => ({ stage: entry.type, itemIndex: entry.index, label: `Câu ${entry.index + 1}`, entry })) : units.filter(unit => unit.stage === section.stage).map(unit => ({ ...unit, entry: null }));
      const total = practice ? progress.totalQuizCount : rows.length;
      const completed = Math.min(total, practice ? progress.completedQuizCount : attempt.status === "COMPLETED" ? total : committed[section.stage] ?? 0);
      const full = total > 0 && completed === total;
      const partial = completed > 0 && !full;
      const learning = learningStage === section.stage;
      const StageIcon = full ? CheckCircle2 : learning || partial ? CircleDot : Circle;
      const renderRow = (row: typeof rows[number]) => {
        const rowCompleted = row.entry ? row.entry.status === "COMPLETED" : attempt.status === "COMPLETED" || row.itemIndex < completed;
        const current = !rowCompleted && samePosition(row, attempt.position);
        const allowed = row.entry ? row.entry.status !== "LOCKED" : canViewPosition(row, attempt, content);
        const selected = samePosition(row, viewing);
        const StatusIcon = !allowed ? LockKeyhole : rowCompleted ? CheckCircle2 : current ? CircleDot : Circle;
        const status = !allowed ? "Chưa mở" : current ? "Đang học" : rowCompleted ? row.entry ? row.entry.firstTryCorrect ? "Đúng lần đầu" : "Cần thử lại" : "Đã học" : "Chưa hoàn thành";
        return <Button key={row.stage + row.itemIndex} type="button" variant="ghost" disabled={disabled || !allowed} aria-current={selected ? "step" : undefined} onClick={() => onSelect(row)} className={"h-auto min-h-12 w-full justify-start gap-3 whitespace-normal rounded-xl border px-3 py-3 text-left focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 " + (selected ? "border-primary bg-primary text-on-primary hover:bg-primary hover:text-on-primary" : rowCompleted ? "border-transparent bg-surface-container-low hover:bg-learning-mint" : current ? "border-learning-nav-border bg-surface-container-lowest text-primary hover:bg-learning-mint" : "border-transparent hover:bg-surface-container-low")}>
          <StatusIcon className={"size-4 shrink-0 " + (selected ? "text-on-primary" : allowed && (rowCompleted || current) ? "text-primary" : "text-on-surface-variant")} aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words"><span className="block text-label-lg font-semibold">{row.label}</span><span className="mt-1 block text-label-sm font-normal">{status}</span></span>
          {selected && <span className="shrink-0 rounded-lg bg-on-primary/15 px-2 py-1 text-label-sm font-semibold text-on-primary">Đang xem</span>}
        </Button>;
      };
      return <details key={section.stage} data-learning-category={learning ? "current" : undefined} open={!!expanded[section.stage]} onToggle={event => { const open = event.currentTarget.open; setExpanded(previous => previous[section.stage] === open ? previous : { ...previous, [section.stage]: open }); }} className={"group rounded-xl border " + (learning ? "border-learning-nav-border bg-learning-nav-active" : "border-transparent bg-surface-container-low")}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-3 focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <StageIcon className={"size-4 shrink-0 " + (completed || learning ? "text-primary" : "text-on-surface-variant")} aria-hidden="true" />
          <span className={"min-w-0 flex-1 text-label-lg font-semibold " + (learning ? "text-primary" : "text-on-surface")}>
            {index + 1}. {section.label}{learning && <span className="mt-1 flex items-center gap-1 text-label-sm font-semibold text-primary"><span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />Đang học</span>}
          </span>
          <span title={`Đã hoàn thành ${completed}/${total} mục`} className="inline-flex shrink-0 items-center rounded-full bg-learning-mint px-3 py-1 text-label-sm font-semibold text-primary">{completed}/{total}</span>
          <ChevronDown className="size-4 shrink-0 text-on-surface-variant transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className={"space-y-1 border-t p-2 " + (learning ? "border-learning-nav-border" : "border-learning-outline")}>{rows.length === 0 && <p className="p-3 text-label-sm text-on-surface-variant">{practice && total > 0 ? "Đang tải danh sách câu hỏi…" : "Không có nội dung"}</p>}
          {practice ? ["FILL_BLANK", "SITUATIONAL_CHOICE"].map((type, groupIndex) => { const children = rows.filter(row => row.stage === type); const done = children.filter(row => row.entry?.status === "COMPLETED").length; return children.length > 0 && <details key={type} open={!!expanded["quiz:" + type]} onToggle={event => { const open = event.currentTarget.open; setExpanded(previous => previous["quiz:" + type] === open ? previous : { ...previous, ["quiz:" + type]: open }); }} className="group/subgroup space-y-1 border-b border-learning-nav-border last:border-b-0">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-2 py-3 text-label-lg font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"><ChevronDown className="size-4 shrink-0 -rotate-90 group-open/subgroup:rotate-0" aria-hidden="true" /><span className="min-w-0 flex-1">Dạng {groupIndex + 1}: {type === "FILL_BLANK" ? "Điền từ" : "Chọn tình huống"}</span><span className="rounded-full bg-learning-mint px-2 py-1 text-label-sm text-primary">{done}/{children.length}</span></summary>
            <div className="space-y-2 pb-3 pl-2">{children.map(renderRow)}</div>
          </details>; }) : rows.map(renderRow)}
        </div>
      </details>;
    })}</div>
  </nav>;
}
