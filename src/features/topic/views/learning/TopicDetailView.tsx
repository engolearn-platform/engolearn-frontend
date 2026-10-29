import { useCallback } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { ArrowLeft, BookOpen, CheckCheck, Clock3, ListChecks, MessagesSquare, Sparkles } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { TopicRetryDialog } from "@features/topic/components/learning/attempt/TopicRetryDialog";
import { useTopicViewer } from "@features/topic/hooks/topic-viewer.context";
import { useTopicDetail, useTopicProgress } from "@features/topic/hooks/useTopicDetail";
import { useTopicLaunch } from "@features/topic/hooks/useTopicLaunch";
import { TopicState, TopicProgressBar } from "@features/topic/components/learning/catalog/TopicState";
import { TopicItemCard } from "@features/topic/components/learning/detail/TopicItemCard";
import { primaryTopicItem, safeTopicOrigin, topicErrorMessage, topicResultPath, TOPIC_LEVELS } from "@features/topic/utils/topic-catalog";

export default function TopicDetailView() {
  const { topicId = "" } = useParams();
  const location = useLocation();
  const notice = (location.state as { topicNotice?: string } | null)?.topicNotice;
  const [parameters] = useSearchParams();
  const origin = safeTopicOrigin(parameters.get("from"));
  const viewer = useTopicViewer();
  const learner = viewer.kind === "LEARNER";
  const detail = useTopicDetail(topicId);
  const progress = useTopicProgress(topicId, learner);
  const refresh = useCallback(() => { detail.refetch(); if (learner) progress.refetch(); }, [detail.refetch, progress.refetch, learner]);
  const launch = useTopicLaunch(detail.data, origin, refresh);
  const data = detail.data;
  const next = data ? primaryTopicItem(data.items) : null;
  const nextIndex = data?.items.findIndex(item => item.topicItemId === next?.topicItemId) ?? -1;
  return <div className="min-h-screen bg-surface pb-10 text-on-surface">
    <header className="border-b border-outline-variant/50 bg-surface-container-lowest">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center px-5 md:px-8"><Link to={origin} className="flex min-h-12 items-center gap-3 rounded-xl font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft className="size-5 shrink-0" aria-hidden="true" /><span>Chủ đề{data ? " / " + data.titleVi : ""}</span></Link></div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-6 md:px-8">
      {notice && <p role="status" className="mb-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-body-md">{notice}</p>}
      {!data ? <TopicState title={detail.error ? (detail.error.status === 404 ? "Không tìm thấy chủ đề" : "Không tải được chủ đề") : "Đang tải chủ đề…"} description={detail.error ? topicErrorMessage(detail.error) : undefined} loading={!detail.error} error={!!detail.error} onRetry={detail.error ? detail.refetch : undefined} /> :
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <section className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm md:p-6">
              <div className="flex items-start justify-between gap-4"><h1 className="text-headline-lg font-bold text-primary">{data.titleVi}</h1><span className="shrink-0 rounded-full bg-primary/10 px-4 py-2 text-label-lg font-semibold text-primary">{data.cefrLevel}</span></div>
              {learner && viewer.cefrLevel && TOPIC_LEVELS.indexOf(data.cefrLevel) > TOPIC_LEVELS.indexOf(viewer.cefrLevel) && <span className="inline-flex rounded-full bg-secondary-container px-3 py-1 text-label-sm font-medium text-on-secondary-container">Chưa phù hợp level</span>}
              <p className="text-body-md text-on-surface-variant">{data.description}</p>
              {data.hasNewContent && learner && <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container"><Sparkles className="size-4" aria-hidden="true" />Có nội dung mới</span>}
              <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-outline-variant/40 pt-4 text-label-sm text-on-surface-variant">
                {[[BookOpen, data.items.length + " tình huống"], [BookOpen, data.vocabularyCount + " từ vựng"], [MessagesSquare, data.expressionCount + " mẫu câu"], [ListChecks, data.quizCount + " bài tập"], [Clock3, data.durationMinutes + " phút"]].map(([Icon, label], index) => {
                  const MetaIcon = Icon as typeof BookOpen; return <span className="inline-flex items-center gap-1.5" key={index}><MetaIcon className="size-4 text-primary" aria-hidden="true" />{label as string}</span>;
                })}
              </div>
            </section>
            {launch.error && <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-md text-error">{launch.error}</div>}
            {data.items.length ? <section aria-label="Các bài học tình huống" className="space-y-4">{data.items.map((item, index) => <TopicItemCard key={item.topicItemId} item={item} index={index} current={next?.topicItemId === item.topicItemId} learner={learner} busy={launch.busy} onAction={launch.choose} />)}</section> : <TopicState title="Chủ đề chưa có bài học hiển thị" description="Vui lòng quay lại sau để xem nội dung được cập nhật." />}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-6 lg:col-span-4">
            {!learner ? <TopicState title="Khám phá trước khi bắt đầu" description="Đăng nhập để học các tình huống và lưu tiến độ của bạn." /> :
              <section className="space-y-5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
                <h2 className="text-headline-sm font-semibold">Tiến độ chủ đề</h2>
                {progress.error ? <TopicState error title="Không tải được tiến độ" description={topicErrorMessage(progress.error)} onRetry={progress.refetch} /> : !progress.data ? <p role="status" className="text-body-md text-on-surface-variant">Đang tải tiến độ…</p> : <>
                  <div className="space-y-3"><div className="flex items-end justify-between gap-3"><span className="text-label-lg text-on-surface-variant">Tổng quan ({progress.data.completedItemCount}/{progress.data.totalItemCount} bài)</span><strong className="text-headline-lg text-primary">{progress.data.percent}%</strong></div><TopicProgressBar percent={progress.data.percent} label="Tiến độ chủ đề" /></div>
                  <dl className="space-y-4 border-t border-outline-variant/50 pt-5">
                    {[
                      [CheckCheck, "Bài học hoàn thành", progress.data.completedItemCount + " / " + progress.data.totalItemCount + " bài"],
                      [BookOpen, "Từ vựng đã học", progress.data.metrics.learnedVocabularyCount + " / " + progress.data.metrics.totalVocabularyCount + " từ"],
                      [MessagesSquare, "Mẫu câu đã học", progress.data.metrics.learnedExpressionCount + " / " + progress.data.metrics.totalExpressionCount + " mẫu"],
                      [ListChecks, "Quiz đã hoàn thành", progress.data.metrics.completedQuizCount + " / " + progress.data.metrics.totalQuizCount + " câu"],
                    ].map(([Icon, label, value], index) => { const MetricIcon = Icon as typeof BookOpen; return <div key={index} className="flex flex-wrap items-center justify-between gap-2"><dt className="flex items-center gap-2 text-label-lg text-on-surface-variant"><MetricIcon className="size-5 text-primary" aria-hidden="true" />{label as string}</dt><dd className="text-label-lg font-semibold">{value as string}</dd></div>; })}
                  </dl><p className="text-label-sm text-on-surface-variant">Theo lượt học hiện tại</p>
                </>}
                {next && <Button type="button" disabled={launch.busy} onClick={() => launch.choose(next.actions.continue.allowed ? "continue" : "start", next)} className="min-h-14 w-full rounded-xl text-base font-semibold">{launch.busy ? "Đang mở…" : (next.actions.continue.allowed ? "Tiếp tục học" : "Bắt đầu học") + " (Bài " + (nextIndex + 1) + ")"}</Button>}
                {!next && data.progress?.status === "COMPLETED" && <p className="text-body-md font-medium text-primary">Bạn đã hoàn thành chủ đề này.</p>}
                {data.progress?.status === "COMPLETED" && <Button asChild className="min-h-12 w-full rounded-xl"><Link to={topicResultPath(topicId, origin)}>Xem tổng kết chủ đề</Link></Button>}
                {data.retrySession?.scope === "TOPIC" && data.retrySession.status === "IN_PROGRESS" && (data.retrySession.currentAttemptId || data.retrySession.nextTopicItemId) && <Button type="button" variant="outline" disabled={launch.busy} onClick={() => launch.choose("resumeTopicRetry")} className="min-h-12 w-full rounded-xl">Tiếp tục lượt làm lại</Button>}
                {data.resetAvailability.allowed && <Button type="button" variant="outline" disabled={launch.busy} onClick={() => launch.choose("reset")} className="min-h-12 w-full rounded-xl">Làm lại chủ đề</Button>}
                <p className="rounded-xl bg-surface p-4 text-label-sm leading-relaxed text-on-surface-variant">Bạn có thể xem chi tiết mọi chủ đề. Điều kiện level chỉ áp dụng khi bắt đầu lượt học hoặc lượt làm lại mới.</p>
              </section>}
          </aside>
        </div>}
    </main>
    <TopicRetryDialog open={!!launch.confirmation} reset={launch.confirmation?.action === "reset"} cancel={launch.cancel} confirm={launch.confirm} />
  </div>;
}
