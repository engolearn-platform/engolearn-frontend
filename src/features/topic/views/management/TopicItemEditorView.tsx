import { Navigate, useParams } from "react-router";
import { adminTopicItemsPath, topicItemSectionPath } from "@shared/constants";
import { isTopicItemSectionKey } from "@features/topic/types/topic-create.types";
import TopicItemContextEditorView from "./TopicItemContextEditorView";
import TopicItemQuizEditorView from "./TopicItemQuizEditorView";
import TopicItemVocabularyEditorView from "./TopicItemVocabularyEditorView";
import TopicItemExpressionsEditorView from "./TopicItemExpressionsEditorView";

export default function TopicItemEditorView() {
  const { itemId, sectionKey, topicId } = useParams();

  if (!sectionKey || !isTopicItemSectionKey(sectionKey)) {
    return (
      <Navigate
        to={
          itemId
            ? topicItemSectionPath(itemId, "context", topicId)
            : adminTopicItemsPath(topicId)
        }
        replace
      />
    );
  }
  if (sectionKey === "context") {
    return <TopicItemContextEditorView />;
  }
  if (sectionKey === "vocabulary") {
    return <TopicItemVocabularyEditorView />;
  }
  if (sectionKey === "expressions") {
    return <TopicItemExpressionsEditorView />;
  }
  return <TopicItemQuizEditorView />;
}
