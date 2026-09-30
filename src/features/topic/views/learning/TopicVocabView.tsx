import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ROUTES } from "@shared/constants";
import { EmptyState, Loading } from "@shared/components";
import { useTopicVocab } from "../../hooks/useTopicVocab";
import {
  buildTopicVocabPath,
  getFirstVocabId,
} from "../../hooks/useTopicVocab";
import { buildTopicExpressionsPath } from "../../hooks/useTopicExpressions";
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
import { VocabProgressHeader } from "../../components/learning/vocab/VocabProgressHeader";
import { VocabHeroCard } from "../../components/learning/vocab/VocabHeroCard";
import type { PlayingAccent } from "../../components/learning/vocab/VocabHeroCard";
import { VocabSentencesCard } from "../../components/learning/vocab/VocabSentencesCard";
import { VocabQuickCheckCard } from "../../components/learning/vocab/VocabQuickCheckCard";
import { VocabLessonNav } from "../../components/learning/vocab/VocabLessonNav";

export default function TopicVocabView() {
  const { topicId, vocabId } = useParams();
  const navigate = useNavigate();
  const resolvedTopicId = topicId ?? "";
  const resolvedVocabId = vocabId ?? "";
  const { data, loading, error } = useTopicVocab(
    resolvedTopicId,
    resolvedVocabId,
  );
  const { furthest, currentStage, setCurrentStage, reportProgress } =
    useTopicProgressContext();

  // Mark current stage on mount.
  useEffect(() => {
    setCurrentStage("VOCAB");
  }, [setCurrentStage]);

  const [playingAccent, setPlayingAccent] = useState<PlayingAccent>(null);
  const [playingSentenceId, setPlayingSentenceId] = useState<string | null>(
    null,
  );
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const reportedRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioTimer.current) {
        clearTimeout(audioTimer.current);
      }
    };
  }, []);

  // Reset transient audio/simulation state whenever the vocab changes.
  useEffect(() => {
    setPlayingAccent(null);
    setPlayingSentenceId(null);
    setAnsweredCorrectly(false);
    setReachedEnd(false);
    reportedRef.current = null;
  }, [resolvedVocabId]);

  // "Completed" = scrolled to the end of the content. Re-arms whenever the
  // vocab content (re)mounts after loading.
  const vocabKey = data?.id ?? null;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReachedEnd(true);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [vocabKey]);

  // Completion = reached the end AND answered the quick check correctly.
  // Fires the PATCH once per vocab; furthest only moves forward.
  useEffect(() => {
    if (!data || !reachedEnd || !answeredCorrectly) {
      return;
    }
    if (reportedRef.current === data.id) {
      return;
    }
    reportedRef.current = data.id;
    void reportProgress("VOCAB", data.currentIndex);
  }, [data, reachedEnd, answeredCorrectly, reportProgress]);

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
          title="Không tải được từ vựng"
          description={
            error ? error.message : "Nội dung từ vựng hiện chưa có."
          }
        />
      </div>
    );
  }

  const goBack = () => {
    navigate(-1);
  };
  const goTopics = () => {
    navigate(ROUTES.TOPICS);
  };
  const goStep = (id: string) => {
    navigate(buildTopicVocabPath(resolvedTopicId, id));
  };
  const goPrev = () => {
    if (data.prevVocabId) {
      navigate(buildTopicVocabPath(resolvedTopicId, data.prevVocabId));
    }
  };
  const goNext = () => {
    if (data.nextVocabId) {
      navigate(buildTopicVocabPath(resolvedTopicId, data.nextVocabId));
    } else {
      // End of vocab list → continue to Useful Expressions.
      navigate(buildTopicExpressionsPath(resolvedTopicId));
    }
  };
  const goStructure = (id: string) => {
    if (id === "context") {
      navigate(ROUTES.TOPIC_CONTEXT.replace(":topicId", resolvedTopicId));
    } else if (id === "vocab") {
      // Already inside the VOCAB part — jump to its entry instead of
      // dumping the learner back to the topic list.
      navigate(buildTopicVocabPath(resolvedTopicId, getFirstVocabId()));
    } else if (id === "expressions") {
      navigate(buildTopicExpressionsPath(resolvedTopicId));
    } else if (id === "practice") {
      navigate(ROUTES.TOPIC_PRACTICE.replace(":topicId", resolvedTopicId));
    }
  };

  // Sidebar reflects both `furthest` (tracking) and `currentStage`
  // (where the user is now). Navigation itself is never blocked.
  const structureItems = deriveSidebarStates(
    data.structure,
    STAGE_TO_PART,
    furthest,
    currentStage,
  );

  // Audio wiring lands with the real TTS API; for now simulate the
  // 900ms playing state from the Stitch prototype.
  const simulateAudio = (done: () => void) => {
    if (audioTimer.current) {
      clearTimeout(audioTimer.current);
    }
    audioTimer.current = setTimeout(done, 900);
  };
  const handlePlayUk = () => {
    setPlayingAccent("uk");
    simulateAudio(() => setPlayingAccent(null));
  };
  const handlePlayUs = () => {
    setPlayingAccent("us");
    simulateAudio(() => setPlayingAccent(null));
  };
  const handlePlaySentence = (id: string) => {
    setPlayingSentenceId(id);
    simulateAudio(() => setPlayingSentenceId(null));
  };

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
                <VocabProgressHeader
                  topicLabel={data.topicLabel}
                  cefrBadge={data.cefrBadge}
                  progressText={data.progressText}
                  steps={data.steps}
                  onSelectStep={goStep}
                />
                <VocabHeroCard
                  hero={data.hero}
                  playingAccent={playingAccent}
                  onPlayUk={handlePlayUk}
                  onPlayUs={handlePlayUs}
                />
                <VocabSentencesCard
                  title={data.sentencesTitle}
                  countLabel={data.sentencesCountLabel}
                  sentences={data.sentences}
                  playingId={playingSentenceId}
                  onPlaySentence={handlePlaySentence}
                />
                <VocabQuickCheckCard
                  key={data.id}
                  quickCheck={data.quickCheck}
                  onCorrectAnswer={() => setAnsweredCorrectly(true)}
                />
                <VocabLessonNav
                  prevLabel={data.lessonPrevLabel}
                  nextLabel={data.lessonNextLabel}
                  hasPrev={data.prevVocabId !== null}
                  onPrev={goPrev}
                  onNext={goNext}
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
        onContinue={goNext}
      />
    </div>
  );
}
