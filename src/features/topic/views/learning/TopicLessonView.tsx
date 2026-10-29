import { useContentReadiness } from "@features/topic/hooks/useContentReadiness";
import { useTopicQuizNavigation } from "@features/topic/hooks/useTopicQuizNavigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { useTopicLesson } from "@features/topic/hooks/useTopicLesson";
import { useTopicQuiz } from "@features/topic/hooks/useTopicQuiz";
import { useTopicViewer } from "@features/topic/hooks/topic-viewer.context";
import { TopicState, TopicProgressBar } from "@features/topic/components/learning/catalog/TopicState";
import { TopicLessonNav } from "@features/topic/components/learning/attempt/TopicLessonNav";
import { TopicLessonContent } from "@features/topic/components/learning/attempt/TopicLessonContent";
import { TopicQuiz } from "@features/topic/components/learning/attempt/TopicQuiz";
import { clearTopicPendingAction, clearTopicAttemptActions } from "@features/topic/services/topic-mutation-journal";
import { canViewPosition, contentPositions, isContentPosition, samePosition, viewingPosition } from "@features/topic/utils/topic-lesson";
import { topicDetailPath, topicErrorMessage, topicItemResultPath } from "@features/topic/utils/topic-catalog";
import type { PositionDto } from "@features/topic/types/topic-api.types";

export default function TopicLessonView({ topicId, attemptId, origin }: { topicId: string; attemptId: string; origin: string }) {
  const lesson = useTopicLesson(topicId, attemptId);
  const viewer = useTopicViewer();
  const [parameters, setParameters] = useSearchParams();
  const navigate = useNavigate();
  const { attempt, content } = lesson;
  const detailPath = topicDetailPath(topicId, origin);
  const onHidden = useCallback(() => {
    document.querySelectorAll("audio[data-topic-audio]").forEach(audio => (audio as HTMLAudioElement).pause());
    clearTopicPendingAction(JSON.stringify([viewer.learnerId, attemptId, "quiz-answer"]));
    clearTopicPendingAction(JSON.stringify([viewer.learnerId, attemptId, "completion"]));
    clearTopicAttemptActions(viewer.learnerId, attemptId);
    void navigate(detailPath, { replace: true, state: { topicNotice: "Nội dung này không còn khả dụng. Vui lòng chọn bài học khác." } });
  }, [navigate, detailPath, viewer.learnerId, attemptId]);
  const quiz = useTopicQuiz({ attempt, learnerId: viewer.learnerId, attemptId, topicId, generation: lesson.generation, onAttempt: lesson.updateAttempt, onHidden, refreshLesson: lesson.refetch });
  const navigation = useTopicQuizNavigation(attempt, lesson.updateAttempt);
  const entries = navigation.data?.entries ?? [];
  const viewing = quiz.feedback && quiz.quiz && !parameters.has("stage") ? { stage: quiz.quiz.type, itemIndex: quiz.quiz.index } : attempt && content ? viewingPosition(parameters, attempt, content, entries) : null;
  const atFrontier = attempt?.status === "IN_PROGRESS" && samePosition(viewing, attempt.position);
  const showContent = !!viewing && isContentPosition(viewing);
  const readiness = useContentReadiness(JSON.stringify([viewer.learnerId, attemptId, attempt?.topicItemVersionId, viewing]), showContent && atFrontier);
  const continueSource = useRef<PositionDto | null>(null);
  useLayoutEffect(() => {
    if (continueSource.current && viewing && !samePosition(continueSource.current, viewing)) {
      continueSource.current = null;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [viewing]);
  useEffect(() => { if (lesson.error?.code === "TOPIC_RESET" || navigation.error?.code === "TOPIC_RESET") { clearTopicAttemptActions(viewer.learnerId, attemptId); void navigate(detailPath, { replace: true, state: { topicNotice: "Tiến độ chủ đề đã được xoá. Hãy chọn bài học từ trạng thái mới nhất." } }); } }, [lesson.error, navigation.error, viewer.learnerId, attemptId, navigate, detailPath]);
  const continueQuiz = () => {
    if (attempt?.status === "COMPLETED") { void navigate(topicItemResultPath(topicId, attemptId, origin), { replace: true }); return; }
    continueSource.current = viewing;
    quiz.dismissFeedback();
    setParameters(current => { const query = new URLSearchParams(current); query.delete("stage"); query.delete("index"); return query; });
  };
  const quizMessages = <>
    {quiz.error && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-md text-error">{quiz.error}</p>}
    {(quiz.needsCompletion || quiz.completionPending) ? <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <p role="status" className="text-body-md">Các câu trả lời đã được lưu. Hoàn tất bài học để mở kết quả của bạn.</p>
      <Button type="button" disabled={quiz.busy || lesson.loading || !attempt} onClick={() => void quiz.complete()} className="min-h-12 rounded-xl">{quiz.busy ? "Đang hoàn tất…" : quiz.completionPending ? "Kiểm tra yêu cầu hoàn tất" : "Hoàn tất bài học"}</Button>
    </div> : quiz.contractMismatch ? <Button type="button" variant="outline" disabled={quiz.busy || lesson.loading} onClick={quiz.refetch} className="min-h-12 rounded-xl">Tải lại tiến độ</Button> : quiz.pending && !quiz.busy && <div className="space-y-3 rounded-xl border border-outline-variant bg-surface p-4">
      <p role="status" className="text-body-md">Có một đáp án chưa xác định kết quả. Thử lại sẽ gửi đúng yêu cầu đã lưu, không tạo lượt trả lời mới.</p>
      <Button type="button" disabled={quiz.busy || !attempt} onClick={() => void quiz.answer()} className="min-h-12 rounded-xl">{quiz.busy ? "Đang kiểm tra…" : "Thử lại yêu cầu đã gửi"}</Button>
    </div>}
  </>;
  if (!attempt) return <main className="min-h-screen bg-surface p-5">
    <div className="mx-auto max-w-3xl space-y-6 pt-5">
      <Link to={detailPath} className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary"><ArrowLeft className="size-5" aria-hidden="true" />Quay lại chủ đề</Link>
      <TopicState title={lesson.error ? "Không mở được nội dung bài học" : "Đang mở bài học…"} loading={!lesson.error} error={!!lesson.error}
        description={lesson.error ? topicErrorMessage(lesson.error) : undefined} onRetry={lesson.error ? lesson.refetch : undefined} />
    </div>
  </main>;
  if (attempt.status === "COMPLETED" && !quiz.feedback) return <Navigate to={topicItemResultPath(topicId, attemptId, origin)} replace />;
  if (!content) return <main className="min-h-screen bg-surface p-5 text-on-surface">
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={detailPath} className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary"><ArrowLeft className="size-5" aria-hidden="true" />Quay lại chủ đề</Link>
      {quizMessages}
      {quiz.quiz && (quiz.pending || quiz.feedback) ? <>
        <TopicQuiz quiz={quiz.quiz} feedback={quiz.feedback} selected={quiz.selected} busy={quiz.busy} pending={quiz.pending} wrong={quiz.wrong} disabled={quiz.blocked} onAnswer={optionId => void quiz.answer(optionId)} />
        {quiz.feedback && <Button type="button" onClick={continueQuiz} className="min-h-12 rounded-xl">Tiếp tục</Button>}
      </> : <TopicState title="Bài học đã hoàn thành" description="Tiến độ hoàn thành đã được lưu. Bạn có thể trở về chủ đề để xem các bài học tiếp theo." />}
    </div>
  </main>;
  const units = [...contentPositions(content), ...entries.map(entry => ({ stage: entry.type, itemIndex: entry.index, label: entry.quizId }))];
  const currentIndex = units.findIndex(unit => samePosition(unit, viewing));
  const previous = currentIndex > 0 ? units[currentIndex - 1] : currentIndex === -1 ? units[units.length - 1] : undefined;
  const nextViewed = units[currentIndex + 1];
  const disabled = lesson.busy || lesson.loading || quiz.busy || quiz.pending || quiz.completionPending || quiz.needsCompletion || quiz.contractMismatch || quiz.blocked;
  const reviewed = !showContent && entries.find(entry => entry.type === viewing?.stage && entry.index === viewing.itemIndex && entry.status === "COMPLETED");
  const phase = viewing?.stage === "CONTEXT" ? 1 : viewing?.stage === "VOCAB" ? 2 : viewing?.stage === "EXPRESSIONS" ? 3 : 4;
  const choose = (position: PositionDto | null, scrollToTop = false) => {
    if (disabled || position && !canViewPosition(position, attempt, content, entries)) return;
    if (scrollToTop && position && !samePosition(position, viewing)) continueSource.current = viewing;
    if (quiz.feedback) quiz.dismissFeedback();
    setParameters(current => {
      const query = new URLSearchParams(current);
      if (position) { query.set("stage", position.stage); query.set("index", String(position.itemIndex)); }
      else { query.delete("stage"); query.delete("index"); }
      return query;
    });
  };
  const continueLesson = async () => {
    if (!viewing || !showContent || disabled || !readiness.ready) return;
    if (atFrontier) {
      const updated = await lesson.advance(viewing);
      if (updated) {
        continueSource.current = viewing;
        setParameters(current => {
          const query = new URLSearchParams(current);
          if (updated.position) { query.set("stage", updated.position.stage); query.set("index", String(updated.position.itemIndex)); }
          else { query.delete("stage"); query.delete("index"); }
          return query;
        });
      }
    } else choose(nextViewed && canViewPosition(nextViewed, attempt, content, entries) ? nextViewed : attempt.position, true);
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
        <TopicLessonNav attempt={attempt} content={content} viewing={viewing} disabled={disabled} entries={entries} onSelect={choose} onFrontier={() => choose(attempt.position)} />
      </aside>
      <div ref={readiness.contentRef} className="min-w-0 scroll-mt-56 space-y-5 pb-5 lg:col-span-8 lg:scroll-mt-32" aria-busy={disabled}>
        {attempt.mode === "RETRY" && <p role="status" className="rounded-xl bg-primary/5 p-4 text-body-md text-primary">Lượt làm lại · Kết quả hiện tại được giữ tới khi bạn hoàn thành bài này.</p>}
        {lesson.mutationError && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-md text-error">{lesson.mutationError}</p>}
        {lesson.accessError && <p role="status" className="text-label-sm text-on-surface-variant">Chưa cập nhật được lần truy cập gần nhất. Tiến độ bài học không bị ảnh hưởng.</p>}
        {showContent && !atFrontier && <p role="status" className="rounded-xl bg-primary/5 px-4 py-3 text-label-lg text-primary">Đang xem lại nội dung đã học</p>}
        {showContent && viewing ? <TopicLessonContent key={viewing.stage + ":" + viewing.itemIndex} content={content} position={viewing} /> : reviewed && reviewed.quiz ? <TopicQuiz key={reviewed.quizId} quiz={reviewed.quiz} feedback={reviewed.feedback} selected={reviewed.feedback?.correctOptionId ?? null} busy={false} pending={false} wrong={false} disabled onAnswer={() => {}} /> : <>
          {quizMessages}
          {quiz.needsCompletion || quiz.completionPending ? null : quiz.quiz ? <TopicQuiz key={quiz.quiz.quizId} quiz={quiz.quiz} feedback={quiz.feedback} selected={quiz.selected} busy={quiz.busy} pending={quiz.pending} wrong={quiz.wrong} disabled={disabled} onAnswer={optionId => void quiz.answer(optionId)} /> :
            <TopicState title={quiz.blocked ? "Chưa thể tiếp tục trả lời" : quiz.readError ? "Không tải được câu hỏi" : "Đang tải câu hỏi…"} loading={quiz.loading && !quiz.blocked} error={!!quiz.readError || quiz.blocked}
              description={quiz.readError ? topicErrorMessage(quiz.readError) : undefined} onRetry={quiz.readError ? quiz.refetch : undefined} />}
        </>}
        <div ref={readiness.bottomRef} aria-hidden="true" className="h-1" />
      </div>
    </main>
    <footer ref={readiness.footerRef} className="sticky bottom-0 z-10 border-t border-outline-variant/40 bg-surface-container-lowest px-5 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" disabled={disabled || !previous || !canViewPosition(previous, attempt, content, entries)} onClick={() => { if (previous) choose(previous); }} className="min-h-12 rounded-xl">
          <ArrowLeft className="size-4" aria-hidden="true" />Quay lại
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p id="continue-reason" role="status" className="text-label-sm text-on-surface-variant">{lesson.busy || quiz.busy ? "Đang lưu…" : quiz.pending ? "Chưa xác định kết quả yêu cầu. Hãy kiểm tra yêu cầu đã gửi." : quiz.blocked || quiz.contractMismatch || quiz.completionPending || quiz.needsCompletion ? "Khôi phục tiến độ trước khi tiếp tục." : showContent && !readiness.ready ? "Đọc đến cuối nội dung để tiếp tục." : !showContent && !reviewed && !quiz.feedback ? "Trả lời đúng câu hỏi để tiếp tục." : lesson.loading ? "Đang tải tiến độ…" : ""}</p>
          <Button type="button" aria-describedby="continue-reason" disabled={disabled || (showContent ? !readiness.ready : !reviewed && !quiz.feedback)} onClick={() => { if (showContent) void continueLesson(); else if (reviewed) choose(nextViewed && canViewPosition(nextViewed, attempt, content, entries) ? nextViewed : attempt.position, true); else continueQuiz(); }} className="min-h-12 rounded-xl px-6">Tiếp tục<ArrowRight className="size-4" aria-hidden="true" /></Button>
        </div>
      </div>
    </footer>
  </div>;
}
