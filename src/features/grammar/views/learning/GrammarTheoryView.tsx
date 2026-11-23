import { Navigate, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { GrammarBackLink, GrammarLoadError, GrammarName, GrammarLoading, GrammarPage, GrammarRouteNotice } from "@features/grammar/components/learning/GrammarLearningUi";
import GrammarPracticeStartButton from "@features/grammar/components/learning/GrammarPracticeStartButton";
import GrammarTheoryBlock from "@features/grammar/components/learning/GrammarTheoryBlock";
import StatusBadge from "@features/grammar/components/learning/StatusBadge";
import { useGrammarTheory } from "@features/grammar/hooks/useGrammarLearning";
import { useGrammarSeen } from "@features/grammar/hooks/useGrammarSeen";
import { grammarPaths } from "@features/grammar/services/grammar-learning.service";
import type { GrammarTheory } from "@features/grammar/types/grammar.types";

function TheoryContent({ lesson, reload }: { lesson: GrammarTheory; reload: () => void }) {
  const { topicId, id, contentVersion } = lesson;
  const { contentRef, seen, error, retry } = useGrammarSeen(topicId, id, contentVersion);
  const status = lesson.status === "NOT_STARTED" && seen ? "IN_PROGRESS" : lesson.status;
  const changed = error?.code === "GRAMMAR_CONTENT_VERSION_CONFLICT";
  const waitingForFirstView = status === "NOT_STARTED" && !seen;

  return (
    <>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label-lg font-semibold text-primary">Bài {lesson.number}</span>
          <StatusBadge status={status} />
        </div>
        <div className="space-y-1">
          <h1 className="wrap-break-word text-headline-lg font-bold"><GrammarName titleEn={lesson.titleEn} titleVi={lesson.titleVi} /></h1>
        </div>
        {lesson.objective && <p className="wrap-break-word text-body-md text-on-surface-variant">{lesson.objective}</p>}
      </header>
      {error && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-learning-outline bg-white p-4">
          <p role="alert" className="text-body-md text-error">
            {changed ? "Bài học vừa được cập nhật." : "Chưa ghi nhận được lượt xem bài học."}
          </p>
          <Button variant="ghost" className="min-h-12 text-primary" onClick={changed ? reload : retry}>
            {changed ? "Tải nội dung mới" : "Thử lại"}
          </Button>
        </div>
      )}
      <p className="text-label-lg text-on-surface-variant">Mở từng phần để đọc. Bạn có thể xem lại bất kỳ phần nào; đọc xong hãy luyện đủ 5 câu.</p>
      <ol ref={contentRef} className="space-y-4" aria-label="Nội dung lý thuyết">
        {lesson.blocks.map((block, index) => <li key={block.id}><GrammarTheoryBlock block={block} collapsible initialOpen={index === 0 || lesson.status === "COMPLETED"} /></li>)}
      </ol>
      {status !== "COMPLETED" && <p className="text-body-md text-on-surface-variant">
        Bạn có thể luyện tập ngay để tự kiểm tra và quay lại lý thuyết khi cần.
      </p>}
      <GrammarPracticeStartButton topicId={topicId} lessonId={id} disabled={waitingForFirstView}>
        {status === "COMPLETED" ? "Làm lại luyện tập" : "Bắt đầu luyện tập"}
      </GrammarPracticeStartButton>
      {waitingForFirstView && !error && <p role="status" className="text-label-sm text-on-surface-variant">Đang ghi nhận lượt xem bài học…</p>}
    </>
  );
}

function TheoryPage({ topicId, lessonId }: { topicId: string; lessonId: string }) {
  const { data, loading, error, refetch } = useGrammarTheory(topicId, lessonId);
  if (error?.status === 403 || error?.status === 404) {
    const grammarNotice = error.status === 403
      ? "Bài học này chưa mở khóa."
      : "Bài học này hiện không còn khả dụng.";
    return <Navigate to={grammarPaths.topic(topicId)} replace state={{ grammarNotice }} />;
  }

  return (
    <GrammarPage>
      <GrammarBackLink to={grammarPaths.topic(topicId)}>Về chủ đề</GrammarBackLink>
      <GrammarRouteNotice />
      {loading && <GrammarLoading />}
      {!loading && !data && <GrammarLoadError message="Không tải được nội dung bài học." retry={refetch} />}
      {!loading && data && <TheoryContent key={data.contentVersion} lesson={data} reload={refetch} />}
    </GrammarPage>
  );
}

export default function GrammarTheoryView() {
  const { topicId, lessonId } = useParams();
  return topicId && lessonId
    ? <TheoryPage key={`${topicId}/${lessonId}`} topicId={topicId} lessonId={lessonId} />
    : <Navigate to={grammarPaths.roadmap} replace />;
}
