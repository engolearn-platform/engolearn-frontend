import { useParams } from "react-router";
import TopicItemContextEditorView from "./TopicItemContextEditorView";
import TopicItemSectionPlaceholderView from "./TopicItemSectionPlaceholderView";
import TopicItemVocabularyEditorView from "./TopicItemVocabularyEditorView";
import TopicItemExpressionsEditorView from "./TopicItemExpressionsEditorView";

export default function TopicItemEditorView() {
  const { sectionKey } = useParams();

  if (sectionKey === "context") {
    return <TopicItemContextEditorView />;
  }
  if (sectionKey === "vocabulary") {
    return <TopicItemVocabularyEditorView />;
  }
  if (sectionKey === "expressions") {
    return <TopicItemExpressionsEditorView />;
  }
  return <TopicItemSectionPlaceholderView />;
}
