import { useCallback } from "react";
import type { ComponentType } from "react";
import { useParams, useSearchParams } from "react-router";
import { useFetch } from "@shared/hooks/useFetch";
import { grammarPaths } from "@features/grammar/constants/admin-paths";
import { grammarEditorPanel as panelClass } from "@features/grammar/constants/admin-entry";
import { ActionLink, LoadingView } from "@features/grammar/components/admin/authoring/AuthoringUi";
import { GrammarBlocks } from "@features/grammar/components/admin/authoring/GrammarBlocks";
import { GrammarQuestionForm } from "@features/grammar/components/admin/authoring/GrammarQuestionForm";
import { GrammarQuestions } from "@features/grammar/components/admin/authoring/GrammarQuestions";
import { GrammarLessonReview, GrammarTopicPublish } from "@features/grammar/components/admin/authoring/GrammarReview";
import { useLessonAuthoring } from "@features/grammar/hooks/useGrammarAuthoring";
import type { LessonContext } from "@features/grammar/hooks/useGrammarAuthoring";
import { grammarAdmin } from "@features/grammar/services/grammar-admin.service";

function LessonAuthoringView({ Screen }: { Screen: ComponentType<LessonContext> }) {
  const { topicId = "", lessonId = "" } = useParams();
  return <LessonAuthoringLoader key={topicId + "/" + lessonId} topicId={topicId} lessonId={lessonId} Screen={Screen} />;
}

function LessonAuthoringLoader({ topicId, lessonId, Screen }: { topicId: string; lessonId: string; Screen: ComponentType<LessonContext> }) {
  const { data, loading, error, refetch } = useLessonAuthoring(topicId, lessonId);
  if (loading || !data) return <LoadingView loading={loading} error={error?.message} retry={refetch} />;
  return <Screen {...data} refresh={refetch} />;
}

export function GrammarBlocksView() {
  return <LessonAuthoringView Screen={GrammarBlocks} />;
}

export function GrammarQuestionsView() {
  return <LessonAuthoringView Screen={GrammarQuestions} />;
}

function QuestionEditorRoute(props: LessonContext) {
  const { questionId } = useParams();
  const [search] = useSearchParams();
  const { topic, lesson } = props;
  const question = lesson.questions.find(({ id }) => id === questionId);
  if (!question && questionId !== "new" && questionId != null) {
    return <div className="p-5 md:p-7">
      <section className={panelClass}>
        <h1 className="mb-3 text-base font-bold">Không tìm thấy câu hỏi</h1>
        <ActionLink to={grammarPaths.questions(topic.id, lesson.id)}>Quay lại Câu luyện tập</ActionLink>
      </section>
    </div>;
  }
  const initialType = search.get("type") === "FILL_IN_BLANK" ? "FILL_IN_BLANK" : "MULTIPLE_CHOICE";
  return <GrammarQuestionForm key={question?.id ?? initialType} {...props} question={question} initialType={initialType} />;
}

export function GrammarQuestionFormView() {
  return <LessonAuthoringView Screen={QuestionEditorRoute} />;
}

export function GrammarLessonReviewView() {
  const { topicId = "", lessonId = "" } = useParams();
  return <LessonReviewLoader key={topicId + "/" + lessonId} topicId={topicId} lessonId={lessonId} />;
}

function LessonReviewLoader({ topicId, lessonId }: { topicId: string; lessonId: string }) {
  const [search] = useSearchParams();
  const { data, loading, error, refetch } = useFetch(useCallback(async (signal: AbortSignal) => {
    const [topic, lesson, { checks }] = await Promise.all([
      grammarAdmin.getTopic(topicId, signal),
      grammarAdmin.getLesson(topicId, lessonId, signal),
      grammarAdmin.lessonChecklist(topicId, lessonId, signal),
    ]);
    return { topic, lesson, checks };
  }, [topicId, lessonId]));
  if (loading || !data) return <LoadingView loading={loading} error={error?.message} retry={refetch} />;
  return <GrammarLessonReview {...data} refresh={refetch} preview={search.get("preview") === "1"} />;
}

export function GrammarTopicPublishView() {
  const { topicId = "" } = useParams();
  return <TopicPublishLoader key={topicId} topicId={topicId} />;
}

function TopicPublishLoader({ topicId }: { topicId: string }) {
  const { data, loading, error, refetch } = useFetch(useCallback(async (signal: AbortSignal) => {
    const [topic, { checks }] = await Promise.all([
      grammarAdmin.getTopic(topicId, signal),
      grammarAdmin.topicChecklist(topicId, signal),
    ]);
    return { topic, checks };
  }, [topicId]));
  if (loading || !data) return <LoadingView loading={loading} error={error?.message} retry={refetch} />;
  return <GrammarTopicPublish {...data} refresh={refetch} />;
}

