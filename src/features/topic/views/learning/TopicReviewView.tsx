import { Link, Navigate, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { TopicState } from "@features/topic/components/learning/catalog/TopicState";
import { TopicLessonContent } from "@features/topic/components/learning/attempt/TopicLessonContent";
import { TopicQuiz } from "@features/topic/components/learning/attempt/TopicQuiz";
import { useTopicReview } from "@features/topic/hooks/useTopicReview";
import { contentPositions, samePosition } from "@features/topic/utils/topic-lesson";
import { topicDetailPath, topicErrorMessage, topicItemResultPath } from "@features/topic/utils/topic-catalog";
import type { PositionDto } from "@features/topic/types/topic-api.types";

export default function TopicReviewView({ topicId, attemptId, origin }: { topicId: string; attemptId: string; origin: string }) {
  const loaded = useTopicReview(topicId, attemptId);
  const [query, setQuery] = useSearchParams();
  const detailPath = topicDetailPath(topicId, origin);
  const failure = loaded.error ?? (loaded.accessError?.code === "RESULT_CHANGED" || loaded.accessError?.code === "ITEM_HIDDEN" ? loaded.accessError : null);
  if (failure?.status === 410 && failure.code === "ITEM_HIDDEN") return <Navigate to={detailPath} replace state={{ topicNotice: "Nội dung này không còn khả dụng." }} />;
  const data = failure ? null : loaded.data;
  const units = data ? contentPositions(data.content) : [];
  const reviewed = data?.quizzes.find(entry => entry.quiz.quizId === query.get("quizId"));
  const candidate = { stage: query.get("stage"), itemIndex: Number(query.get("index")) } as PositionDto;
  const position = units.find(unit => samePosition(unit, candidate)) ?? units[0];
  const choose = (content: PositionDto | null, quizId?: string) => setQuery(previous => {
    const next = new URLSearchParams(previous);
    if (content) { next.set("stage", content.stage); next.set("index", String(content.itemIndex)); next.delete("quizId"); }
    else { next.delete("stage"); next.delete("index"); if (quizId) next.set("quizId", quizId); }
    return next;
  });
  return <main className="min-h-screen bg-surface px-5 py-6 text-on-surface">
    <div className="mx-auto max-w-7xl space-y-5">
      <Link to={detailPath} className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary"><ArrowLeft className="size-5" aria-hidden="true" />Quay lại chủ đề</Link>
      {!data ? <TopicState title={failure ? "Không mở được phần xem lại" : "Đang tải bài học…"} loading={loaded.loading} error={!!failure}
        description={failure ? topicErrorMessage(failure) : undefined} onRetry={failure?.code === "RESULT_CHANGED" ? undefined : loaded.refetch} /> : <>
        <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-label-lg font-semibold text-primary">Xem lại · Chỉ đọc</p><h1 className="text-headline-lg font-bold">{data.content.title}</h1></div>
          <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={topicItemResultPath(topicId, attemptId, origin)}>Kết quả bài học</Link></Button>
        </header>
        {loaded.accessError && <p role="status" className="text-label-sm text-on-surface-variant">Chưa cập nhật được lần truy cập gần nhất.</p>}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <nav aria-label="Nội dung xem lại" className="space-y-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 lg:col-span-4">
            <details open={!reviewed}><summary className="min-h-12 cursor-pointer py-3 font-semibold">Nội dung đã học</summary><div className="space-y-1">{units.map(unit =>
              <Button key={unit.stage + unit.itemIndex} type="button" variant={!reviewed && samePosition(position, unit) ? "default" : "ghost"} aria-current={!reviewed && samePosition(position, unit) ? "step" : undefined}
                onClick={() => choose(unit)} className="h-auto min-h-12 w-full justify-start whitespace-normal rounded-xl px-3 py-3 text-left">{unit.label}</Button>)}</div></details>
            <details open={!!reviewed}><summary className="min-h-12 cursor-pointer py-3 font-semibold">Bài tập đã hoàn thành</summary><div className="space-y-1">{data.quizzes.map(entry =>
              <Button key={entry.quiz.quizId} type="button" variant={reviewed?.quiz.quizId === entry.quiz.quizId ? "default" : "ghost"} aria-current={reviewed?.quiz.quizId === entry.quiz.quizId ? "step" : undefined}
                onClick={() => choose(null, entry.quiz.quizId)} className="h-auto min-h-12 w-full justify-start whitespace-normal rounded-xl px-3 py-3 text-left">{entry.quiz.type === "FILL_BLANK" ? "Điền từ" : "Tình huống"} · Câu {entry.quiz.index + 1}</Button>)}</div></details>
          </nav>
          <div className="min-w-0 space-y-4 lg:col-span-8">{reviewed ? <>
            <p className="rounded-xl bg-primary/5 p-4 text-body-md text-primary">{reviewed.firstTryCorrect ? "Đúng ngay lần đầu" : "Chưa đúng ngay lần đầu"}</p>
            <TopicQuiz key={reviewed.quiz.quizId} quiz={reviewed.quiz} feedback={reviewed.feedback} selected={reviewed.feedback.correctOptionId} busy={false} pending={false} wrong={false} disabled onAnswer={() => {}} />
          </> : position && <TopicLessonContent key={position.stage + position.itemIndex} content={data.content} position={position} readOnly />}</div>
        </div>
      </>}
    </div>
  </main>;
}
