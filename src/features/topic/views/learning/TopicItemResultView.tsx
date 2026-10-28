import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { TopicState } from "@features/topic/components/learning/catalog/TopicState";
import { TopicResultScore } from "@features/topic/components/learning/attempt/TopicResultScore";
import { TopicRetryDialog } from "@features/topic/components/learning/attempt/TopicRetryDialog";
import { useItemResult, useNextTopicItem } from "@features/topic/hooks/useTopicResult";
import { useTopicLaunch } from "@features/topic/hooks/useTopicLaunch";
import { safeTopicOrigin, topicBlockMessage, topicDetailPath, topicErrorMessage, topicResultPath } from "@features/topic/utils/topic-catalog";

function ItemResult({ topicId, attemptId, origin }: { topicId: string; attemptId: string; origin: string }) {
  const loaded = useItemResult(topicId, attemptId);
  const data = loaded.data;
  const launch = useTopicLaunch(data?.detail ?? null, origin, loaded.refetch);
  const next = useNextTopicItem(data?.result ?? null, origin, loaded.refetch);
  const detailPath = topicDetailPath(topicId, origin);
  if (loaded.error?.status === 410 && loaded.error.code === "ITEM_HIDDEN") return <Navigate to={detailPath} replace state={{ topicNotice: "Nội dung này không còn khả dụng. Vui lòng chọn bài học khác." }} />;
  return <main className="min-h-screen bg-surface px-5 py-6 text-on-surface">
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={detailPath} className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary"><ArrowLeft className="size-5" aria-hidden="true" />Quay lại chủ đề</Link>
      {!data ? <TopicState title={loaded.error ? "Chưa mở được kết quả bài học" : "Đang tải kết quả…"} loading={loaded.loading} error={!!loaded.error}
        description={loaded.error ? topicErrorMessage(loaded.error) : undefined} onRetry={loaded.error ? loaded.refetch : undefined} /> : <>
        <TopicResultScore title={data.result.title} correct={data.result.firstTryCorrectCount} total={data.result.totalQuizCount} percent={data.result.accuracyPercent} />
        {(next.error || launch.error) && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-md text-error">{next.error || launch.error}</p>}
        <section aria-label="Tiếp tục học" className="space-y-4 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 md:p-6">
          {data.result.nextTopicItemId && (data.result.nextItemAvailability.allowed ? <Button type="button" disabled={next.busy || launch.busy || loaded.loading} onClick={() => void next.start()} className="min-h-12 w-full whitespace-normal rounded-xl">
            {next.busy ? "Đang mở bài học…" : "Học bài tiếp theo"}<ArrowRight className="size-5" aria-hidden="true" />
          </Button> : <p className="text-body-md text-on-surface-variant">{topicBlockMessage(data.result.nextItemAvailability.reason)}</p>)}
          {data.detail.progress?.status === "COMPLETED" && <Button asChild className="min-h-12 w-full rounded-xl"><Link to={topicResultPath(topicId, origin)}>Xem tổng kết chủ đề<ArrowRight className="size-5" aria-hidden="true" /></Link></Button>}
          <div className="flex flex-wrap gap-3">
            {data.item?.actions.review.allowed && <Button type="button" variant="outline" disabled={next.busy || launch.busy} onClick={() => launch.choose("review", data.item)} className="min-h-12 rounded-xl"><BookOpen className="size-5" aria-hidden="true" />Xem lại</Button>}
            {data.item?.actions.retry.allowed && <Button type="button" variant="outline" disabled={next.busy || launch.busy} onClick={() => launch.choose("retry", data.item)} className="min-h-12 rounded-xl"><RotateCcw className="size-5" aria-hidden="true" />Làm lại bài này</Button>}
            {data.item?.actions.resumeRetry.allowed && <Button type="button" variant="outline" disabled={next.busy || launch.busy} onClick={() => launch.choose("resumeRetry", data.item)} className="min-h-12 rounded-xl">Tiếp tục làm lại</Button>}
            {data.item?.actions.restartRetry.allowed && <Button type="button" variant="outline" disabled={next.busy || launch.busy} onClick={() => launch.choose("restartRetry", data.item)} className="min-h-12 rounded-xl">Làm lại từ đầu</Button>}
            <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={detailPath}>Về chi tiết chủ đề</Link></Button>
          </div>
        </section>
      </>}
    </div>
    <TopicRetryDialog open={!!launch.confirmation} replacing={!!launch.confirmation?.observedRetrySessionId} cancel={launch.cancel} confirm={launch.confirm} />
  </main>;
}

export default function TopicItemResultView() {
  const { topicId = "", attemptId = "" } = useParams();
  const [parameters] = useSearchParams();
  return <ItemResult key={topicId + ":" + attemptId} topicId={topicId} attemptId={attemptId} origin={safeTopicOrigin(parameters.get("from"))} />;
}
