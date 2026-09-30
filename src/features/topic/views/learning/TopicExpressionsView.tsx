import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ROUTES } from "@shared/constants";
import { EmptyState, Loading } from "@shared/components";
import { useTopicExpressions } from "../../hooks/useTopicExpressions";
import { buildTopicVocabPath, getFirstVocabId } from "../../hooks/useTopicVocab";
import {
  deriveSidebarStates,
  useTopicProgressContext,
} from "../../hooks/TopicProgressContext";
import { STAGE_TO_PART } from "../../types/topic-progress.types";
import { ContextTopBar } from "../../components/learning/ContextTopBar";
import { LessonProgressCard } from "../../components/learning/LessonProgressCard";
import { TopicStructureNav } from "../../components/learning/TopicStructureNav";
import { MemoryTipCard } from "../../components/learning/MemoryTipCard";
import { LearningFooterNav } from "../../components/learning/LearningFooterNav";
import { ExpressionsProgressHeader } from "../../components/learning/expressions/ExpressionsProgressHeader";
import { ExpressionsHeroCard } from "../../components/learning/expressions/ExpressionsHeroCard";
import { ExpressionGroupCard } from "../../components/learning/expressions/ExpressionGroupCard";
import { ExpressionSequenceGroup } from "../../components/learning/expressions/ExpressionSequenceGroup";
import { ExpressionReadinessCta } from "../../components/learning/expressions/ExpressionReadinessCta";
import { ExpressionLessonNav } from "../../components/learning/expressions/ExpressionLessonNav";

export default function TopicExpressionsView() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const resolvedTopicId = topicId ?? "";
  const { data, loading, error } = useTopicExpressions(resolvedTopicId);
  const { furthest, currentStage, setCurrentStage, reportProgress } =
    useTopicProgressContext();

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingSequence, setPlayingSequence] = useState(false);
  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const reachedEndRef = useRef(false);
  const reportedRef = useRef<string | null>(null);

  // Mark current stage on mount.
  useEffect(() => {
    setCurrentStage("SENTENCES");
  }, [setCurrentStage]);

  useEffect(() => {
    return () => {
      if (audioTimer.current) {
        clearTimeout(audioTimer.current);
      }
    };
  }, []);

  // Reset transient state when topic changes.
  useEffect(() => {
    setPlayingId(null);
    setPlayingSequence(false);
    reachedEndRef.current = false;
    reportedRef.current = null;
  }, [resolvedTopicId]);

  const dataId = data?.id ?? null;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reachedEndRef.current = true;
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dataId]);

  // Report progress once when sentinel reached (recipe 04 §6).
  useEffect(() => {
    if (!data || !reachedEndRef.current) return;
    if (reportedRef.current === data.id) return;
    reportedRef.current = data.id;
    void reportProgress("SENTENCES", 0);
  }, [data, reportProgress]);

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
          title="Không tải được mẫu câu"
          description={
            error ? error.message : "Nội dung mẫu câu hiện chưa có."
          }
        />
      </div>
    );
  }

  const goBack = () => navigate(-1);
  const goTopics = () => navigate(ROUTES.TOPICS);
  const goVocab = () =>
    navigate(buildTopicVocabPath(resolvedTopicId, getFirstVocabId()));
  const goPractice = () => {
    navigate(ROUTES.TOPIC_PRACTICE.replace(":topicId", resolvedTopicId));
  };
  const goStructure = (id: string) => {
    if (id === "context") {
      navigate(ROUTES.TOPIC_CONTEXT.replace(":topicId", resolvedTopicId));
    } else if (id === "vocab") {
      goVocab();
    } else if (id === "expressions") {
      // already here
    } else if (id === "practice") {
      goPractice();
    }
  };

  const simulateAudio = (done: () => void) => {
    if (audioTimer.current) clearTimeout(audioTimer.current);
    audioTimer.current = setTimeout(done, 900);
  };
  const handlePlay = (id: string) => {
    setPlayingId(id);
    simulateAudio(() => setPlayingId(null));
  };
  const handlePlaySequence = () => {
    setPlayingSequence(true);
    simulateAudio(() => setPlayingSequence(false));
  };

  const structureItems = deriveSidebarStates(
    data.structure,
    STAGE_TO_PART,
    furthest,
    currentStage,
  );

  return (
    <div className="min-h-full bg-background text-on-surface">
      <ContextTopBar
        topicTitle={data.topicTitle}
        stageLabel={data.stageLabel}
        onBack={goBack}
        onClose={goTopics}
      />
      <main className="w-full bg-background">
        <div className="w-full px-5 py-6">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-center gap-6 lg:flex-row">
            <div className="w-full shrink-0 lg:w-[840px]">
              <div className="flex w-full flex-col gap-6">
                <ExpressionsProgressHeader
                  topicLabel={data.topicLabel}
                  cefrBadge={data.cefrBadge}
                  progressText={data.progressText}
                  steps={data.steps}
                />
                <ExpressionsHeroCard
                  stageTag={data.heroStageTag}
                  sectionBadge={data.heroSectionBadge}
                  title={data.heroTitle}
                  description={data.heroDescription}
                  meta={data.heroMeta}
                />
                {data.purposes.map((purpose) => {
                  if (purpose.connectingWords && purpose.sequenceExample) {
                    return (
                      <ExpressionSequenceGroup
                        key={purpose.id}
                        orderIndex={purpose.orderIndex}
                        titleVi={purpose.purposeVi}
                        titleEn={purpose.purposeEn}
                        pillLabel="Nâng cấp phản xạ"
                        sequenceExample={purpose.sequenceExample}
                        connectingWords={purpose.connectingWords}
                        isPlayingSequence={playingSequence}
                        onPlaySequence={handlePlaySequence}
                      />
                    );
                  }
                  return (
                    <ExpressionGroupCard
                      key={purpose.id}
                      orderIndex={purpose.orderIndex}
                      titleVi={purpose.purposeVi}
                      titleEn={purpose.purposeEn}
                      pillIcon={purpose.orderIndex === 1 ? "chat" : "tune"}
                      pillLabel={
                        purpose.orderIndex === 1
                          ? `${purpose.examples.length} mẫu câu`
                          : "Cấu trúc linh hoạt"
                      }
                      examples={purpose.examples}
                      playingId={playingId}
                      onPlay={handlePlay}
                    />
                  );
                })}
                <ExpressionReadinessCta
                  title={data.readinessTitle}
                  description={data.readinessDescription}
                  questionCountLabel={data.readinessQuestionCountLabel}
                  expLabel={data.readinessExpLabel}
                />
                <ExpressionLessonNav
                  prevLabel={data.lessonPrevLabel}
                  nextLabel={data.lessonNextLabel}
                  onPrev={goVocab}
                  onNext={goPractice}
                />
                <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
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
                  items={structureItems}
                  onNavigate={goStructure}
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
        onContinue={goPractice}
      />
    </div>
  );
}