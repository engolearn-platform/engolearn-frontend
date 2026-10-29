import { CheckCircle2, LockKeyhole, LocateFixed } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { LESSON_SECTIONS, canViewPosition, contentPositions, samePosition } from "@features/topic/utils/topic-lesson";
import type { AttemptDto, LessonContentDto, PositionDto, QuizNavigationEntryDto } from "@features/topic/types/topic-api.types";

export function TopicLessonNav({ attempt, content, viewing, disabled, onSelect, onFrontier, entries = [], review = false }: {
  attempt: AttemptDto; content: LessonContentDto; viewing: PositionDto | null; disabled: boolean;
  onSelect: (position: PositionDto) => void; onFrontier?: () => void; entries?: QuizNavigationEntryDto[]; review?: boolean;
}) {
  const units = contentPositions(content);
  return <nav aria-label={review ? "Nội dung xem lại" : "Cấu trúc bài học"} className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container-low p-5">
    <h2 className="text-headline-sm font-semibold">{review ? "Xem lại bài học" : "Cấu trúc bài học"}</h2>
    {LESSON_SECTIONS.map((section, index) => {
      const practice = section.stage === "FILL_BLANK";
      const rows = practice ? entries.map(entry => ({ stage: entry.type, itemIndex: entry.index, label: `${entry.type === "FILL_BLANK" ? "Điền từ" : "Tình huống"} · Câu ${entry.index + 1}`, entry })) : units.filter(unit => unit.stage === section.stage).map(unit => ({ ...unit, entry: null }));
      const active = practice ? viewing?.stage === "FILL_BLANK" || viewing?.stage === "SITUATIONAL_CHOICE" : viewing?.stage === section.stage;
      const completed = rows.filter(row => row.entry ? row.entry.status === "COMPLETED" : review || canViewPosition(row, attempt, content) && !samePosition(row, attempt.position)).length;
      return <details key={section.stage + String(active)} open={active} className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest">
        <summary className="min-h-12 cursor-pointer px-4 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-primary">{index + 1}. {section.label} <span className="text-label-sm text-on-surface-variant">{completed}/{rows.length}</span></summary>
        <div className="space-y-1 border-t border-outline-variant/40 p-2">{rows.length === 0 && <p className="p-3 text-label-sm text-on-surface-variant">{practice ? "Đang tải danh sách câu hỏi…" : "Không có nội dung"}</p>}{rows.map(row => {
          const allowed = row.entry ? row.entry.status !== "LOCKED" : review || canViewPosition(row, attempt, content);
          const selected = samePosition(row, viewing);
          const status = row.entry ? row.entry.status === "LOCKED" ? "Chưa mở" : row.entry.status === "CURRENT" ? "Đang học" : row.entry.firstTryCorrect ? "Đúng lần đầu" : "Cần thử lại" : !allowed ? "Chưa mở" : !review && samePosition(row, attempt.position) ? "Đang học" : "Đã học";
          return <Button key={row.stage + row.itemIndex} type="button" variant={selected ? "default" : "ghost"} disabled={disabled || !allowed} aria-current={selected ? "step" : undefined} onClick={() => onSelect(row)} className="h-auto min-h-12 w-full justify-start whitespace-normal rounded-xl px-3 py-3 text-left">
            {!allowed ? <LockKeyhole className="size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />}<span className="min-w-0 flex-1 break-words">{row.label}<span className="block text-label-sm font-normal">{status}</span></span>
          </Button>;
        })}</div>
      </details>;
    })}
    {onFrontier && !samePosition(viewing, attempt.position) && <Button type="button" variant="outline" onClick={onFrontier} disabled={disabled} className="min-h-12 w-full whitespace-normal rounded-xl"><LocateFixed className="size-5 shrink-0" aria-hidden="true" />Quay lại vị trí đang học</Button>}
  </nav>;
}
