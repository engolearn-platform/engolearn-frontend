import { useNavigate, useParams } from "react-router";
import { ROUTES } from "@shared/constants";
import { EmptyState, Loading } from "@shared/components";
import { useTopicDetail } from "../../hooks/useTopicDetail";
import { TopicDetailTopBar } from "../../components/learning/detail/TopicDetailTopBar";
import { TopicDetailHero } from "../../components/learning/detail/TopicDetailHero";
import { UnitList } from "../../components/learning/detail/UnitList";
import { TopicProgressSidebar } from "../../components/learning/detail/TopicProgressSidebar";

export default function TopicDetailView() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useTopicDetail(topicId ?? "");

  const goTopics = () => {
    navigate(ROUTES.TOPICS);
  };
  const goLesson = () => {
    navigate(ROUTES.TOPIC_CONTEXT.replace(":topicId", topicId ?? ""));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-background py-24">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center bg-background py-24">
        <EmptyState
          title="Không tải được chủ đề"
          description={
            error ? error.message : "Nội dung chi tiết hiện chưa có."
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-on-surface">
      <TopicDetailTopBar
        parentLabel={data.parentLabel}
        topicTitle={data.title}
        onBack={goTopics}
      />
      <main className="mx-auto w-full max-w-[1200px] px-5 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="flex flex-col gap-6 md:col-span-8">
            <TopicDetailHero
              title={data.title}
              description={data.description}
              cefrBadge={data.cefrBadge}
              overview={data.overview}
            />
            <UnitList
              units={data.units}
              actionLabels={data.unitActionLabels}
              onStartUnit={goLesson}
            />
          </div>
          <aside className="md:col-span-4 lg:sticky lg:top-20 lg:self-start">
            <TopicProgressSidebar
              percent={data.progressPercent}
              stats={data.stats}
              actionLabel={data.continueLabel}
              onContinue={goLesson}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
