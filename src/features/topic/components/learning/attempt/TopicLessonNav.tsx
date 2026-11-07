import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Circle, CircleDot, LockKeyhole, LocateFixed, Play } from "lucide-react";
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
  const previousLearningStage = useRef(learningStage);
  useEffect(() => {
    const previousStage = previousLearningStage.current;
    previousLearningStage.current = learningStage;
    const advanced = !review && previousStage && learningStage &&
      LESSON_SECTIONS.findIndex(section => section.stage === learningStage) > LESSON_SECTIONS.findIndex(section => section.stage === previousStage);
    setExpanded(previous => {
      // Progress can arrive before the URL follows it. Closing the old learning
      // category takes precedence over expanding that still-viewed category.
      if (advanced) return { ...previous, [previousStage]: false, [learningStage]: true, ...(viewedStage === learningStage && viewedGroup ? { ["quiz:" + viewedGroup]: true } : {}) };
      return { ...previous, ...(viewedStage ? { [viewedStage]: true } : {}), ...(viewedGroup ? { ["quiz:" + viewedGroup]: true } : {}) };
    });
  }, [learningStage, viewedStage, viewedGroup, review]);
  // Native toggle events are queued and can arrive after a progress update.
  // Summary clicks (also emitted for keyboard activation) keep React in control.
  const toggleSection = (key: string) => setExpanded(previous => ({ ...previous, [key]: !previous[key] }));
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
      const locked = !review && attempt.status !== "COMPLETED" && !learning &&
        index > LESSON_SECTIONS.findIndex(item => item.stage === learningStage) &&
        !rows.some(row => row.entry ? row.entry.status !== "LOCKED" : canViewPosition(row, attempt, content));
      const StageIcon = locked ? LockKeyhole : full ? Check : learning ? Play : partial ? CircleDot : Circle;
      const renderRow = (row: typeof rows[number]) => {
        const rowCompleted = row.entry ? row.entry.status === "COMPLETED" : attempt.status === "COMPLETED" || row.itemIndex < completed;
        const current = !rowCompleted && samePosition(row, attempt.position);
        const allowed = row.entry ? row.entry.status !== "LOCKED" : canViewPosition(row, attempt, content);
        const selected = samePosition(row, viewing);
        const StatusIcon = !allowed ? LockKeyhole : rowCompleted ? Check : current ? Play : Circle;
        const status = !allowed ? null : selected ? "Đang xem" : rowCompleted ? "Đã xong" : current ? "Đang học" : null;
        const quizResult = row.entry?.status === "COMPLETED" ? row.entry.firstTryCorrect ? "Đúng lần đầu" : "Cần thử lại" : undefined;
        return <Button key={row.stage + row.itemIndex} type="button" variant="ghost" disabled={disabled || !allowed} aria-current={selected ? "step" : undefined} title={quizResult} onClick={() => onSelect(row)} className={"h-auto min-h-12 w-full justify-start gap-3 whitespace-normal rounded-xl border px-3 py-3 text-left focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 " + (selected ? "border-learning-nav-border bg-learning-mint text-primary hover:bg-learning-mint" : "border-transparent bg-transparent hover:border-learning-outline hover:bg-surface-container-low")}>
          <span className={"flex size-5 shrink-0 items-center justify-center rounded-full " + (rowCompleted ? "bg-primary text-on-primary" : current ? "text-primary" : "text-on-surface-variant")}><StatusIcon className="size-4" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1 break-words text-label-lg font-semibold">{row.label}</span>
          {status && <span className={"shrink-0 rounded-lg px-2 py-1 text-label-sm font-semibold " + (selected ? "bg-surface-container-lowest text-primary" : current ? "text-primary" : "text-on-surface-variant")}>{status}</span>}
        </Button>;
      };
      return <details key={section.stage} data-learning-category={learning ? "current" : undefined} open={!!expanded[section.stage]} className={"group overflow-hidden rounded-xl border " + (learning ? "border-learning-nav-border bg-surface-container-lowest" : locked ? "border-transparent bg-surface" : "border-transparent bg-surface-container-low")}>
        <summary onClick={event => { event.preventDefault(); toggleSection(section.stage); }} className={"flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-3 group-open:rounded-b-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden " + (learning ? "bg-learning-mint" : "")}>
          <span className={"flex size-5 shrink-0 items-center justify-center rounded-full " + (full ? "bg-primary text-on-primary" : learning ? "text-primary" : "text-on-surface-variant")}><StageIcon className="size-4" aria-hidden="true" /></span>
          <span className={"min-w-0 flex-1 text-label-lg font-semibold " + (learning ? "text-primary" : locked ? "text-on-surface-variant" : "text-on-surface")}>
            {index + 1}. {section.label}
          </span>
          <span title={`Đã hoàn thành ${completed}/${total} mục`} className={"inline-flex shrink-0 items-center rounded-full px-3 py-1 text-label-sm font-semibold " + (locked ? "bg-surface-container-low text-on-surface-variant" : "bg-learning-mint text-primary")}>{completed}/{total}</span>
          <ChevronDown className="size-4 shrink-0 text-on-surface-variant transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className={"space-y-1 border-t bg-surface-container-lowest p-2 " + (learning ? "border-learning-nav-border" : "border-learning-outline")}>{rows.length === 0 && <p className="p-3 text-label-sm text-on-surface-variant">{practice && total > 0 ? "Đang tải danh sách câu hỏi…" : "Không có nội dung"}</p>}
          {practice ? ["FILL_BLANK", "SITUATIONAL_CHOICE"].map((type, groupIndex) => { const children = rows.filter(row => row.stage === type); const done = children.filter(row => row.entry?.status === "COMPLETED").length; return children.length > 0 && <details key={type} open={!!expanded["quiz:" + type]} className="group/subgroup space-y-1 border-b border-learning-nav-border last:border-b-0">
            <summary onClick={event => { event.preventDefault(); toggleSection("quiz:" + type); }} className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-2 py-3 text-label-lg font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"><ChevronDown className="size-4 shrink-0 -rotate-90 group-open/subgroup:rotate-0" aria-hidden="true" /><span className="min-w-0 flex-1">Dạng {groupIndex + 1}: {type === "FILL_BLANK" ? "Điền từ" : "Chọn tình huống"}</span><span className="rounded-full bg-learning-mint px-2 py-1 text-label-sm text-primary">{done}/{children.length}</span></summary>
            <div className="space-y-2 pb-3 pl-2">{children.map(renderRow)}</div>
          </details>; }) : rows.map(renderRow)}
        </div>
      </details>;
    })}</div>
  </nav>;
}
