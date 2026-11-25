import { ArrowRight, BookOpen, ClipboardList, LockKeyhole } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Card, EmptyState } from "@shared/components";
import { cn } from "@shared/utils";
import { GrammarBackLink, GrammarLoadError, GrammarName, GrammarLoading, GrammarPage, GrammarRouteNotice } from "@features/grammar/components/learning/GrammarLearningUi";
import GrammarPracticeStartButton from "@features/grammar/components/learning/GrammarPracticeStartButton";
import ProgressBar from "@features/grammar/components/learning/ProgressBar";
import StatusBadge from "@features/grammar/components/learning/StatusBadge";
import { useGrammarTopic } from "@features/grammar/hooks/useGrammarLearning";
import { grammarPaths } from "@features/grammar/services/grammar-learning.service";
import type { GrammarTopicDetail } from "@features/grammar/types/grammar.types";

function LessonCard({ topicId, lesson }: { topicId: string; lesson: GrammarTopicDetail["lessons"][number] }) {
  return <li className="min-w-0 space-y-2">
    {lesson.hasUpdate && <p className="ml-5 inline-flex rounded-full bg-learning-note px-3 py-1 text-label-lg font-semibold text-learning-note-ink">Có cập nhật</p>}
    <Card className={cn("flex flex-col gap-4 rounded-2xl border-learning-outline bg-white p-5 sm:flex-row sm:items-start", lesson.status === "IN_PROGRESS" && "border-primary")}>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full font-bold", lesson.status === "COMPLETED" ? "bg-learning-mint text-primary" : "bg-surface-container-low text-on-surface-variant")} aria-hidden="true">
        {!lesson.unlocked ? <LockKeyhole className="size-4" /> : lesson.number}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2"><span className="text-label-lg font-semibold text-primary">Bài {lesson.number}</span><StatusBadge status={lesson.unlocked ? lesson.status : "LOCKED"} /></div>
        <div className="space-y-1"><h3 className="wrap-break-word text-headline-sm font-bold"><GrammarName titleEn={lesson.titleEn} titleVi={lesson.titleVi} /></h3></div>
        <p className="wrap-break-word text-body-md text-on-surface-variant">{lesson.objective}</p>
        <p className="text-label-lg text-on-surface-variant">{typeof lesson.blockCount === "number" ? `${lesson.blockCount} nội dung` : "Đọc nội dung"} · 5 câu luyện tập{lesson.bestScore !== null && ` · Điểm cao nhất ${lesson.bestScore}/5`}</p>
        {lesson.unlocked ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild variant={lesson.status === "COMPLETED" ? "outline" : "default"} className="min-h-12 rounded-xl"><Link to={grammarPaths.lesson(topicId, lesson.id)}>{lesson.status === "COMPLETED" ? "Ôn lại bài học" : "Mở bài học"}<ArrowRight aria-hidden="true" /></Link></Button>
          {lesson.status === "COMPLETED" && <GrammarPracticeStartButton topicId={topicId} lessonId={lesson.id} secondary>Làm lại luyện tập</GrammarPracticeStartButton>}
        </div> : <p className="flex items-center gap-2 text-label-lg text-on-surface-variant"><LockKeyhole className="size-4 shrink-0" aria-hidden="true" />Hoàn thành bài trước để mở khóa bài này.</p>}
      </div>
    </Card>
  </li>;
}
function TopicPage({ topicId }: { topicId: string }) {
  const { data, loading, error, refetch } = useGrammarTopic(topicId);
  if (error?.status === 403 || error?.status === 404) return <Navigate to={grammarPaths.roadmap} replace state={{ grammarNotice: error.status === 403 ? "Trình độ của chủ đề này chưa mở khóa." : "Chủ đề này hiện không còn khả dụng." }} />;
  return <GrammarPage wide><GrammarBackLink to={grammarPaths.roadmap}>Lộ trình ngữ pháp</GrammarBackLink><GrammarRouteNotice />
    {loading && <GrammarLoading />}{!loading && !data && <GrammarLoadError message="Không tải được chủ đề ngữ pháp." retry={refetch} />}
    {!loading && data && <>
      <Card className="flex flex-col gap-5 rounded-2xl border-learning-outline bg-white p-5 sm:flex-row sm:items-center">
        <div className="relative grid size-20 shrink-0 place-items-center text-headline-md font-bold text-primary"
          role="progressbar" aria-label="Tiến độ chủ đề" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.topic.percent}
          aria-valuetext={`${data.topic.completedLessons} trên ${data.topic.totalLessons} bài hoàn thành`}>
          <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="4" className="stroke-learning-mint" />
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="4" pathLength="100" strokeDasharray="100"
              strokeDashoffset={100 - Math.min(100, Math.max(0, data.topic.percent))} strokeLinecap="round" className="stroke-primary" />
          </svg>
          <span aria-hidden="true">{data.topic.completedLessons}/{data.topic.totalLessons}</span>
        </div>
        <header className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-learning-mint px-3 py-1 text-label-lg font-semibold text-primary">{data.topic.level}</span><StatusBadge status={data.topic.status} /></div><h1 className="wrap-break-word text-headline-lg font-bold"><GrammarName titleEn={data.topic.titleEn} titleVi={data.topic.titleVi} /></h1><p className="wrap-break-word text-body-md text-on-surface-variant">{data.topic.description}</p></header>
      </Card>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2" aria-labelledby="grammar-topic-lessons"><h2 id="grammar-topic-lessons" className="text-headline-md font-bold">Các bài học</h2>
          {data.lessons.length ? <ol className="space-y-4">{data.lessons.map((lesson) => <LessonCard key={lesson.id} topicId={topicId} lesson={lesson} />)}</ol> : <EmptyState title="Sắp ra mắt" description="Chủ đề này chưa có bài học đã xuất bản." />}
          {data.topic.status === "COMPLETED" && <Card className="space-y-4 rounded-2xl border-learning-outline bg-white p-5"><h2 className="text-headline-sm font-bold">Ôn lại chủ đề</h2><p className="text-body-md text-on-surface-variant">Xem nhanh công thức, ghi nhớ và các lỗi thường gặp. Điểm cao nhất của bạn được giữ nguyên.</p><Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={grammarPaths.summary(topicId)}><ClipboardList aria-hidden="true" />Tóm tắt chủ đề</Link></Button></Card>}
        </section>
        <aside className="space-y-4 rounded-2xl border border-learning-outline bg-white p-5"><h2 className="flex items-center gap-2 text-headline-sm font-bold"><BookOpen className="size-5 text-primary" aria-hidden="true" />Mục tiêu của bạn</h2><ProgressBar label="Tiến độ chủ đề" value={data.topic.percent} description={`${data.topic.completedLessons}/${data.topic.totalLessons} bài hoàn thành`} /><p className="text-body-md text-on-surface-variant">Đúng từ 3/5 câu để hoàn thành một bài và mở bài tiếp theo.</p></aside>
      </div>
    </>}
  </GrammarPage>;
}
export default function GrammarTopicView() { const { topicId } = useParams(); return topicId ? <TopicPage key={topicId} topicId={topicId} /> : <Navigate to={grammarPaths.roadmap} replace />; }
