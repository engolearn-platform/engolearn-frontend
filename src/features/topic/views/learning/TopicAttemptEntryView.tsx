import { useParams, useSearchParams } from "react-router";
import { useTopicViewer } from "@features/topic/hooks/topic-viewer.context";
import { safeTopicOrigin } from "@features/topic/utils/topic-catalog";
import TopicLessonView from "./TopicLessonView";
import TopicReviewView from "./TopicReviewView";

export default function TopicAttemptEntryView() {
  const viewer = useTopicViewer();
  const { topicId = "", attemptId = "" } = useParams();
  const [parameters] = useSearchParams();
  const origin = safeTopicOrigin(parameters.get("from"));
  const identity = viewer.learnerId + ":" + topicId + ":" + attemptId;
  return parameters.get("mode") === "review" ? <TopicReviewView key={identity} topicId={topicId} attemptId={attemptId} origin={origin} /> :
    <TopicLessonView key={identity} topicId={topicId} attemptId={attemptId} origin={origin} />;
}
