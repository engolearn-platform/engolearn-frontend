import { useNavigate, useParams } from "react-router";
import { ROUTES } from "@shared/constants";
import { EmptyState, Loading } from "@shared/components";
import { useTopicContext } from "../../hooks/useTopicContext";
import { ContextTopBar } from "../../components/learning/ContextTopBar";
import { StageStatusCard } from "../../components/learning/StageStatusCard";
import { ContextHeroCard } from "../../components/learning/ContextHeroCard";
import { DialogueSection } from "../../components/learning/DialogueSection";
import { ReadinessCta } from "../../components/learning/ReadinessCta";
import { LessonProgressCard } from "../../components/learning/LessonProgressCard";
import { TopicStructureNav } from "../../components/learning/TopicStructureNav";
import { MemoryTipCard } from "../../components/learning/MemoryTipCard";
import { LearningFooterNav } from "../../components/learning/LearningFooterNav";

export default function TopicContextView() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useTopicContext(topicId ?? "");

  const goBack = () => {
    navigate(-1);
  };
  const goTopics = () => {
    navigate(ROUTES.TOPICS);
  };
  // Audio wiring lands with the real playback API.
  const handlePlayAll = () => {
    /* noop until audio API lands */
  };
  const handlePlayLine = () => {
    /* noop until audio API lands */
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
          title="Không tải được bài học"
          description={
            error ? error.message : "Nội dung bối cảnh hiện chưa có."
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-on-surface">
      <ContextTopBar
        topicTitle={data.topicTitle}
        stageLabel={data.stageCardLabel}
        onBack={goBack}
        onClose={goTopics}
      />
      <main className="w-full bg-background">
        <div className="w-full px-5 py-6">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-center gap-6 lg:flex-row">
            <div className="w-full shrink-0 lg:w-[840px]">
              <div className="flex w-full flex-col gap-6">
                <StageStatusCard
                  topicLabel={data.topicLabel}
                  cefrBadge={data.cefrBadge}
                  stageText={data.stageText}
                  steps={data.steps}
                />
                <ContextHeroCard
                  hero={data.hero}
                  objectivesHeading={data.objectivesHeading}
                  objectives={data.objectives}
                />
                <DialogueSection
                  title={data.dialogue.title}
                  subtitle={data.dialogue.subtitle}
                  audioBadge={data.dialogue.audioBadge}
                  playAllLabel={data.dialogue.playAllLabel}
                  lines={data.dialogue.lines}
                  onPlayAll={handlePlayAll}
                  onPlayLine={handlePlayLine}
                />
                <ReadinessCta
                  title={data.readinessTitle}
                  description={data.readinessDescription}
                  actionLabel={data.readinessActionLabel}
                  onAction={goTopics}
                />
              </div>
            </div>
            <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-[320px]">
              <div className="flex flex-col gap-4">
                <LessonProgressCard
                  percent={data.progressPercent}
                  note={data.progressNote}
                />
                <TopicStructureNav
                  heading={data.structureHeading}
                  items={data.structure}
                />
                <MemoryTipCard
                  title={data.memoryTipTitle}
                  text={data.memoryTipText}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <LearningFooterNav
        onBack={goBack}
        onSkip={goTopics}
        onContinue={goTopics}
      />
    </div>
  );
}
