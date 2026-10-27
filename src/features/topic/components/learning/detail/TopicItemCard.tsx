import { Check, Clock3, LockKeyhole, Play, Sparkles } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { topicBlockMessage } from "@features/topic/utils/topic-catalog";
import type { TopicItemSummaryDto } from "@features/topic/types/topic-api.types";
import type { TopicLaunchAction } from "@features/topic/hooks/useTopicLaunch";

export function TopicItemCard({ item, index, current, learner, busy, onAction }: {
  item: TopicItemSummaryDto; index: number; current: boolean; learner: boolean; busy: boolean; onAction: (action: TopicLaunchAction, item: TopicItemSummaryDto) => void;
}) {
  const completed = learner && item.learningStatus === "COMPLETED";
  const locked = learner && item.learningStatus === "NOT_STARTED" && !item.actions.start.allowed;
  const reason = topicBlockMessage(item.actions.start.reason);
  return <article className={"rounded-2xl border bg-surface-container-lowest p-5 shadow-sm md:p-6 " + (current ? "border-2 border-primary" : "border-outline-variant/60")}>
    <div className="flex items-start gap-4">
      <span className={"flex size-12 shrink-0 items-center justify-center rounded-full " + (completed ? "bg-primary text-on-primary" : current ? "bg-primary/10 text-primary" : "bg-surface-container-low text-on-surface-variant")}>
        {completed ? <Check className="size-6" aria-hidden="true" /> : locked ? <LockKeyhole className="size-5" aria-hidden="true" /> : current ? <Play className="size-5" aria-hidden="true" /> : <span className="text-label-lg font-semibold">{String(index + 1).padStart(2, "0")}</span>}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3"><h2 className={"text-headline-sm font-semibold " + (current ? "text-primary" : "text-on-surface")}>Bài {index + 1}: {item.title}</h2>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-label-sm text-on-surface-variant"><Clock3 className="size-4" aria-hidden="true" />{item.durationMinutes} phút</span></div>
        <p className="text-body-md text-on-surface-variant">{item.description}</p>
        <div className="flex flex-wrap gap-2 text-label-sm text-on-surface-variant">
          {[item.vocabularyCount + " từ vựng", item.expressionCount + " mẫu câu", item.quizCount + " bài tập"].map(label => <span className="rounded-md border border-outline-variant/50 bg-surface px-2 py-1" key={label}>{label}</span>)}
        </div>
        {learner && <div className="flex flex-wrap gap-2">
          <span className={"rounded-full px-3 py-1 text-label-sm font-medium " + (completed || current ? "bg-primary/10 text-primary" : "bg-surface-container-low text-on-surface-variant")}>{completed ? "Đã hoàn thành" : item.learningStatus === "IN_PROGRESS" ? "Đang học" : "Chưa học"}</span>
          {current && item.learningStatus !== "IN_PROGRESS" && <span className="rounded-full bg-primary px-3 py-1 text-label-sm font-medium text-on-primary">Bài tiếp theo</span>}
          {item.hasNewContent && <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container"><Sparkles className="size-3.5" aria-hidden="true" />Có nội dung mới</span>}
        </div>}
        {locked && reason && <p className="text-label-sm text-on-surface-variant">{reason}</p>}
        {learner && <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/40 pt-4">
          {item.actions.review.allowed && item.completedAttemptId && <Button type="button" variant="outline" disabled={busy} onClick={() => onAction("review", item)} className="min-h-11 rounded-xl">Xem lại</Button>}
          {item.actions.resumeRetry.allowed && item.retryAttempt && <Button type="button" disabled={busy} onClick={() => onAction("resumeRetry", item)} className="min-h-11 rounded-xl">Tiếp tục làm lại</Button>}
          {item.actions.retry.allowed && <Button type="button" variant="outline" disabled={busy} onClick={() => onAction("retry", item)} className="min-h-11 rounded-xl">Làm lại</Button>}
          {item.actions.restartRetry.allowed && <Button type="button" variant="ghost" disabled={busy} onClick={() => onAction("restartRetry", item)} className="min-h-11 rounded-xl">Làm lại từ đầu</Button>}
          {item.actions.continue.allowed && item.learningAttempt && <Button type="button" disabled={busy} onClick={() => onAction("continue", item)} className="min-h-12 rounded-xl px-6">{busy ? "Đang mở…" : "Tiếp tục bài học"}</Button>}
          {item.learningStatus === "NOT_STARTED" && <Button type="button" disabled={busy || !item.actions.start.allowed} onClick={() => onAction("start", item)} className="min-h-12 rounded-xl px-6">{busy ? "Đang mở…" : "Bắt đầu học"}</Button>}
        </div>}
      </div>
    </div>
  </article>;
}
