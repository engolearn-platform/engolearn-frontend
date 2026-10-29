import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { TopicState } from "@features/topic/components/learning/catalog/TopicState";
import { TopicResultScore } from "@features/topic/components/learning/attempt/TopicResultScore";
import { TopicRetryDialog } from "@features/topic/components/learning/attempt/TopicRetryDialog";
import { useTopicResult } from "@features/topic/hooks/useTopicResult";
import { useTopicLaunch } from "@features/topic/hooks/useTopicLaunch";
import { safeTopicOrigin, topicDetailPath, topicErrorMessage, topicItemResultPath } from "@features/topic/utils/topic-catalog";

function TopicResult({ topicId, origin }: { topicId: string; origin: string }) {
  const loaded = useTopicResult(topicId);
  const data = loaded.data;
  const launch = useTopicLaunch(data?.detail ?? null, origin, loaded.refetch);
  if (loaded.error?.code === "TOPIC_RESET") return <Navigate to={topicDetailPath(topicId, origin)} replace />;
  return <main className="min-h-screen bg-surface px-5 py-6 text-on-surface">
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={topicDetailPath(topicId, origin)} className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary"><ArrowLeft className="size-5" aria-hidden="true" />Quay lại chủ đề</Link>
      {!data ? <TopicState title={loaded.error ? "Chưa mở được tổng kết chủ đề" : "Đang tải tổng kết…"} loading={loaded.loading} error={!!loaded.error}
        description={loaded.error ? topicErrorMessage(loaded.error) : undefined} onRetry={loaded.error ? loaded.refetch : undefined} /> : <>
        <TopicResultScore title={data.result.titleVi} correct={data.result.firstTryCorrectCount} total={data.result.totalQuizCount} percent={data.result.accuracyPercent} />
        {launch.error && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-md text-error">{launch.error}</p>}
        <section aria-label="Kết quả từng bài học" className="space-y-4">
          <h2 className="text-headline-sm font-semibold">Kết quả từng bài học</h2>
          {data.result.items.map(item => {
            const current = data.detail.items.find(value => value.topicItemId === item.topicItemId);
            const currentReference = current?.completedAttemptId === item.completedAttemptId;
            return <article key={item.topicItemId} className="space-y-4 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-body-lg font-semibold">{item.title}</h3><strong className="text-body-lg text-primary">{item.firstTryCorrectCount}/{item.totalQuizCount} · {item.accuracyPercent}%</strong></div>
              {item.hasNewContent && <p className="text-label-sm text-on-surface-variant">Có nội dung mới</p>}
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={topicItemResultPath(topicId, item.completedAttemptId, origin)}>Kết quả bài học<ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
                {currentReference && item.actions.review.allowed && current.actions.review.allowed && <Button type="button" variant="outline" disabled={launch.busy} onClick={() => launch.choose("review", current)} className="min-h-12 rounded-xl"><BookOpen className="size-4" aria-hidden="true" />Xem lại</Button>}
                {currentReference && current.actions.resumeRetry.allowed && <Button type="button" variant="outline" disabled={launch.busy} onClick={() => launch.choose("resumeRetry", current)} className="min-h-12 rounded-xl">Tiếp tục làm lại</Button>}
                {currentReference && !item.actions.resumeRetry.allowed && item.actions.retry.allowed && current.actions.retry.allowed && <Button type="button" variant="outline" disabled={launch.busy} onClick={() => launch.choose("retry", current)} className="min-h-12 rounded-xl"><RotateCcw className="size-4" aria-hidden="true" />Làm lại</Button>}
              </div>
            </article>;
          })}
        </section>
        {data.result.resetAvailability.allowed && data.detail.resetAvailability.allowed && <Button type="button" variant="outline" disabled={launch.busy} onClick={() => launch.choose("reset")} className="min-h-12 rounded-xl"><RotateCcw className="size-5" aria-hidden="true" />Làm lại chủ đề</Button>}
        {data.detail.retrySession?.scope === "TOPIC" && data.detail.retrySession.status === "IN_PROGRESS" && (data.detail.retrySession.currentAttemptId || data.detail.retrySession.nextTopicItemId) && <Button type="button" variant="outline" disabled={launch.busy} onClick={() => launch.choose("resumeTopicRetry")} className="min-h-12 rounded-xl">Tiếp tục lượt làm lại</Button>}
      </>}
    </div>
    <TopicRetryDialog open={!!launch.confirmation} reset={launch.confirmation?.action === "reset"} cancel={launch.cancel} confirm={launch.confirm} />
  </main>;
}

export default function TopicResultView() {
  const { topicId = "" } = useParams();
  const [parameters] = useSearchParams();
  return <TopicResult key={topicId} topicId={topicId} origin={safeTopicOrigin(parameters.get("from"))} />;
}
