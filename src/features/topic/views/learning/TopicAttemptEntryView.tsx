import TopicLessonView from "./TopicLessonView";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, BookOpen, BookmarkCheck } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useFetch } from "@shared/hooks";
import { topicApi } from "@features/topic/services/topic-api.service";
import { TopicState, TopicProgressBar } from "@features/topic/components/learning/catalog/TopicState";
import { safeTopicOrigin, topicDetailPath, topicPositionLabel, topicErrorMessage } from "@features/topic/utils/topic-catalog";

function TopicAttemptReceiptView() {
  const { topicId = "", attemptId = "" } = useParams();
  const [parameters] = useSearchParams();
  const origin = safeTopicOrigin(parameters.get("from"));
  const review = parameters.get("mode") === "review";
  const [accessError, setAccessError] = useState(false);
  const [accessKey] = useState(() => crypto.randomUUID());
  const result = useFetch(useCallback(async (signal: AbortSignal) => {
    const attempt = review ? (await topicApi.getItemReview(attemptId, signal)).attempt : await topicApi.getAttempt(attemptId, signal);
    if (!attempt || attempt.topicId !== topicId || attempt.attemptId !== attemptId || !attempt.progress || typeof attempt.progress.percent !== "number" || attempt.progress.percent < 0 || attempt.progress.percent > 100) throw Object.assign(new Error("Invalid attempt"), { code: "CONTRACT_MISMATCH" });
    return attempt;
  }, [attemptId, topicId, review]));
  useEffect(() => {
    if (!result.data) return;
    const controller = new AbortController();
    void topicApi.recordAttemptAccess(attemptId, { idempotencyKey: accessKey, signal: controller.signal }).catch(() => { if (!controller.signal.aborted) setAccessError(true); });
    return () => controller.abort();
  }, [result.data, attemptId, accessKey]);
  return <main className="min-h-screen bg-surface px-5 py-6 text-on-surface">
    <div className="mx-auto max-w-3xl space-y-6">
      <Link className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary" to={topicDetailPath(topicId, origin)}><ArrowLeft className="size-5" aria-hidden="true" />Quay lại chủ đề</Link>
      {!result.data ? <TopicState title={result.error ? "Không mở được bài học" : "Đang mở bài học…"} description={result.error ? topicErrorMessage(result.error) : undefined} error={!!result.error} loading={!result.error} onRetry={result.error ? result.refetch : undefined} /> :
        <section className="space-y-5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
          <BookOpen className="size-10 text-primary" aria-hidden="true" /><h1 className="text-headline-lg font-bold">{review ? "Xem lại bài học" : "Bài học của bạn"}</h1>
          <p className="flex items-center gap-2 text-body-md text-primary"><BookmarkCheck className="size-5" aria-hidden="true" />{result.data.status === "COMPLETED" ? "Đã hoàn thành" : "Tiến trình đã được lưu"}</p>
          <div className="space-y-3"><div className="flex justify-between gap-3 text-body-md"><span>{result.data.position ? topicPositionLabel(result.data.position.stage, result.data.position.itemIndex) : "Hoàn thành bài học"}</span><strong>{result.data.progress.percent}%</strong></div><TopicProgressBar percent={result.data.progress.percent} label="Tiến độ bài học" /></div>
          {accessError && <p role="alert" className="text-label-sm text-on-surface-variant">Chưa cập nhật được lần truy cập gần nhất.</p>}
          <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={topicDetailPath(topicId, origin)}>Xem chi tiết chủ đề</Link></Button>
        </section>}
    </div>
  </main>;
}

export default function TopicAttemptEntryView() {
  const { topicId = "", attemptId = "" } = useParams();
  const [parameters] = useSearchParams();
  return parameters.get("mode") === "review" ? <TopicAttemptReceiptView key={attemptId} /> :
    <TopicLessonView key={topicId + ":" + attemptId} topicId={topicId} attemptId={attemptId} origin={safeTopicOrigin(parameters.get("from"))} />;
}
