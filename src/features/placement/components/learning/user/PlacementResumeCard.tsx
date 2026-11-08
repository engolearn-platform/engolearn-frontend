import { ArrowRight, CheckCircle2, Clock3, Save } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type { PlacementCurrentAttempt } from "@features/placement/types/placement.types";

export default function PlacementResumeCard({ attempt, remainingMs, onContinue }: {
  attempt: PlacementCurrentAttempt;
  remainingMs: number;
  onContinue: () => void;
}) {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const time = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const percent = attempt.totalQuestions > 0 ? Math.round(attempt.answeredCount * 100 / attempt.totalQuestions) : 0;
  const savedAt = attempt.lastSavedAt ? new Date(attempt.lastSavedAt) : null;
  const savedLabel = savedAt && !Number.isNaN(savedAt.getTime())
    ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(savedAt) : null;

  return (
    <section aria-labelledby="placement-resume-title" className="space-y-5 rounded-2xl border border-learning-mint-border bg-learning-nav-active p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-learning-note px-3 py-1 text-label-sm font-semibold text-learning-note-ink">Đang làm</span>
        {savedLabel && <p className="flex items-center gap-2 text-label-sm text-on-surface-variant"><Save aria-hidden="true" className="size-4" />Lưu gần nhất: {savedLabel}</p>}
      </div>
      <div className="space-y-2">
        <h2 id="placement-resume-title" className="text-headline-sm font-semibold">Bạn có bài kiểm tra chưa hoàn thành</h2>
        <p className="text-body-md text-on-surface-variant">Tiếp tục từ câu chưa trả lời. Thời gian vẫn được tính từ lúc bắt đầu, kể cả khi bạn rời trang.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-learning-mint-border bg-surface-container-lowest p-5">
          <div className="flex items-center justify-between gap-3 text-label-lg"><span>Đã trả lời</span><strong className="text-primary">{attempt.answeredCount}/{attempt.totalQuestions} câu</strong></div>
          <progress value={attempt.answeredCount} max={attempt.totalQuestions} aria-label="Tiến độ bài kiểm tra đã lưu" className="h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-surface-container-highest [&::-webkit-progress-value]:bg-primary" />
          <p className="flex flex-wrap justify-between gap-2 text-label-sm text-on-surface-variant"><span>{attempt.answeredCount === attempt.totalQuestions ? "Có thể xem lại bài trước khi nộp" : `Câu tiếp theo: ${attempt.nextSection === "READING" ? "Reading" : "Listening"}`}</span><span>{percent}% hoàn thành</span></p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-learning-mint-border bg-surface-container-lowest p-5">
          <Clock3 aria-hidden="true" className="size-7 shrink-0 text-primary" />
          <div><p className="text-label-sm text-on-surface-variant">Thời gian còn lại</p><p role="timer" aria-label="Thời gian còn lại" className="text-headline-lg font-bold tabular-nums">{time}</p></div>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-learning-mint-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-label-lg text-primary"><CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />{attempt.answeredCount > 0 ? "Các đáp án đã chọn đã được lưu" : "Chưa có đáp án được lưu"}</p>
        <Button className="min-h-12 rounded-xl px-5" disabled={remainingMs <= 0} onClick={onContinue}>{remainingMs <= 0 ? "Đang cập nhật trạng thái…" : "Tiếp tục bài làm"}<ArrowRight aria-hidden="true" className="size-4" /></Button>
      </div>
    </section>
  );
}
