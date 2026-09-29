import { useParams } from "react-router";
import TopicItemContextEditorView from "./TopicItemContextEditorView";
import TopicItemSectionPlaceholderView from "./TopicItemSectionPlaceholderView";

export default function TopicItemEditorView() {
  const { sectionKey } = useParams();

  if (sectionKey === "context") {
    return <TopicItemContextEditorView />;
  }
  return <TopicItemSectionPlaceholderView />;
}
