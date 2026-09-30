import { useParams } from "react-router";
import LearningLayout from "./LearningLayout";
import { TopicProgressProvider } from "@features/topic/hooks/TopicProgressContext";

/**
 * LearningLayout wrapper for learner topic routes. Mounts the shared
 * `TopicProgressProvider` so all learner views (context, vocab, expressions)
 * share the same progress state — `furthest` (forward-only tracking) +
 * `currentStage` (which page the user is on right now).
 */
export default function TopicLearningLayout() {
  const { topicId } = useParams();
  return (
    <TopicProgressProvider topicItemId={topicId ?? ""}>
      <LearningLayout />
    </TopicProgressProvider>
  );
}