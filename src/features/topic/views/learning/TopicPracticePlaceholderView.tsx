import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ROUTES } from "@shared/constants";
import { EmptyState } from "@shared/components";
import { useTopicProgressContext } from "../../hooks/TopicProgressContext";
import { ContextTopBar } from "../../components/learning/ContextTopBar";

/**
 * Placeholder for the Practice (EXERCISES) stage. The Stitch UI for this
 * stage does not exist yet — this view only exists so sidebar/footer
 * navigation to `/topics/:topicId/practice` lands on a sensible screen
 * instead of a blank no-match. Replace with the real view when the
 * Practice screen is built (see docs/features/topic/learner/).
 */
export default function TopicPracticePlaceholderView() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { setCurrentStage } = useTopicProgressContext();

  // Mark current stage so shared sidebar highlights Practice as active.
  useEffect(() => {
    setCurrentStage("EXERCISES");
  }, [setCurrentStage]);

  const goBack = () => {
    navigate(-1);
  };
  const goTopics = () => {
    navigate(ROUTES.TOPICS);
  };

  return (
    <div className="min-h-full bg-background text-on-surface">
      <ContextTopBar
        topicTitle={topicId ?? ""}
        stageLabel="Giai đoạn 4 / 4"
        onBack={goBack}
        onClose={goTopics}
      />
      <div className="flex items-center justify-center bg-background py-24">
        <EmptyState
          title="Màn Luyện tập & Phản xạ đang phát triển"
          description="Hoàn thành mẫu câu giao tiếp để mở khóa phần luyện tập khi có UI chính thức."
        />
      </div>
    </div>
  );
}
