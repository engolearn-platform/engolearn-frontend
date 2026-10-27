import { Link, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useTopicLesson } from "@features/topic/hooks/useTopicLesson";
import { useTopicViewer } from "@features/topic/hooks/topic-viewer.context";
import { TopicState, TopicProgressBar } from "@features/topic/components/learning/catalog/TopicState";
import { TopicLessonNav } from "@features/topic/components/learning/attempt/TopicLessonNav";
import { TopicLessonContent } from "@features/topic/components/learning/attempt/TopicLessonContent";
import { canViewPosition, contentPositions, isContentPosition, samePosition, viewingPosition } from "@features/topic/utils/topic-lesson";
import { topicDetailPath, topicErrorMessage } from "@features/topic/utils/topic-catalog";
import type { PositionDto } from "@features/topic/types/topic-api.types";

export default function TopicLessonView({ topicId, attemptId, origin }: { topicId: string; attemptId: string; origin: string }) {
  const lesson = useTopicLesson(topicId, attemptId);
  const viewer = useTopicViewer();
  const [parameters, setParameters] = useSearchParams();
  const { attempt, content } = lesson;
  const detailPath = topicDetailPath(topicId, origin);
  if (!attempt || !content) return <main className="min-h-screen bg-surface p-5">
    <div className="mx-auto max-w-3xl space-y-6 pt-5">
      <Link to={detailPath} className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary"><ArrowLeft className="size-5" aria-hidden="true" />Quay lại chủ đề</Link>
      <TopicState title={lesson.error ? "Không mở được nội dung bài học" : "Đang mở bài học…"} loading={!lesson.error} error={!!lesson.error}
        description={lesson.error ? topicErrorMessage(lesson.error) : undefined} onRetry={lesson.error ? lesson.refetch : undefined} />
    </div>
  </main>;
  const viewing = viewingPosition(parameters, attempt, content);
  const units = contentPositions(content);
  const currentIndex = units.findIndex(unit => samePosition(unit, viewing));
  const previous = currentIndex > 0 ? units[currentIndex - 1] : currentIndex === -1 ? units[units.length - 1] : undefined;
  const nextViewed = units[currentIndex + 1];
  const atFrontier = attempt.status === "IN_PROGRESS" && samePosition(viewing, attempt.position);
  const disabled = lesson.busy || lesson.loading;
  const showContent = viewing && isContentPosition(viewing);
  const phase = viewing?.stage === "CONTEXT" ? 1 : viewing?.stage === "VOCAB" ? 2 : viewing?.stage === "EXPRESSIONS" ? 3 : 4;
  const choose = (position: PositionDto | null) => {
    if (disabled || position && !canViewPosition(position, attempt, content)) return;
    setParameters(current => {
      const query = new URLSearchParams(current);
      if (position) { query.set("stage", position.stage); query.set("index", String(position.itemIndex)); }
      else { query.delete("stage"); query.delete("index"); }
      return query;
    });
  };
  const continueLesson = async () => {
    if (!viewing || !showContent || disabled) return;
    if (atFrontier) {
      const updated = await lesson.advance(viewing);
      if (updated) setParameters(current => {
        const query = new URLSearchParams(current);
        if (updated.position) { query.set("stage", updated.position.stage); query.set("index", String(updated.position.itemIndex)); }
        else { query.delete("stage"); query.delete("index"); }
        return query;
      });
    } else choose(nextViewed && canViewPosition(nextViewed, attempt, content) ? nextViewed : attempt.position);
  };
  return <div className="min-h-screen bg-surface text-on-surface">
    <header className="sticky top-0 z-20 border-b border-outline-variant/40 bg-surface-container-lowest">
      <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-3 px-5 py-3 md:grid-cols-12 md:gap-5">
        <Link to={detailPath} className="flex min-h-12 items-center gap-2 font-semibold text-primary md:col-span-2"><ArrowLeft className="size-5 shrink-0" aria-hidden="true" /><span>Quay lại chủ đề</span></Link>
        <p className="order-3 col-span-2 min-w-0 break-words text-label-lg font-semibold md:order-none md:col-span-4">{content.title}</p>
        <div className="order-4 col-span-2 space-y-1 rounded-xl bg-surface px-3 py-2 md:order-none md:col-span-3">
          <div className="flex justify-between gap-3 text-label-sm"><span>Tiến độ bài học</span><strong className="text-primary">{attempt.progress.percent}%</strong></div>
          <TopicProgressBar percent={attempt.progress.percent} label="Tiến độ bài học" />
        </div>
        <div className="flex items-center justify-end gap-3 md:col-span-3"><span className="text-label-sm text-on-surface-variant">Giai đoạn {phase}/4</span>
          <Link to={detailPath} aria-label="Đóng bài học" className="flex size-12 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface"><X className="size-5" aria-hidden="true" /></Link>
          <span title={viewer.displayName ?? "Học viên"} className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-on-primary sm:flex">{(viewer.displayName ?? "H").slice(0, 1)}</span>
        </div>
      </div>
    </header>
    <main className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 px-5 py-6 lg:grid-cols-12">
      <aside className="lg:sticky lg:top-28 lg:order-2 lg:col-span-4">
        <TopicLessonNav attempt={attempt} content={content} viewing={viewing} disabled={disabled} onSelect={choose} onFrontier={() => choose(attempt.position)} />
      </aside>
      <div className="min-w-0 space-y-5 lg:col-span-8" aria-busy={disabled}>
        {lesson.mutationError && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-md text-error">{lesson.mutationError}</p>}
        {lesson.accessError && <p role="status" className="text-label-sm text-on-surface-variant">Chưa cập nhật được lần truy cập gần nhất. Tiến độ bài học không bị ảnh hưởng.</p>}
        {showContent && !atFrontier && <p role="status" className="rounded-xl bg-primary/5 px-4 py-3 text-label-lg text-primary">Đang xem lại nội dung đã học</p>}
        <TopicLessonContent key={viewing ? viewing.stage + ":" + viewing.itemIndex : "complete"} content={content} position={viewing} />
      </div>
    </main>
    <footer className="sticky bottom-0 z-10 border-t border-outline-variant/40 bg-surface-container-lowest px-5 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" disabled={disabled || !previous || !canViewPosition(previous, attempt, content)} onClick={() => { if (previous) choose(previous); }} className="min-h-12 rounded-xl">
          <ArrowLeft className="size-4" aria-hidden="true" />Quay lại
        </Button>
        {showContent ? <Button type="button" disabled={disabled} onClick={() => void continueLesson()} className="min-h-12 rounded-xl px-6">
          {lesson.busy ? "Đang lưu…" : atFrontier ? "Tiếp tục" : "Xem tiếp"}<ArrowRight className="size-4" aria-hidden="true" />
        </Button> : <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={detailPath}>Về chi tiết chủ đề</Link></Button>}
      </div>
    </footer>
  </div>;
}
