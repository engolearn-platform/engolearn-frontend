import { createContext, useContext } from "react";
import type { ViewerDto } from "@features/topic/types/topic-api.types";

export const TopicViewerContext = createContext<ViewerDto | null>(null);
export function useTopicViewer() {
  const viewer = useContext(TopicViewerContext);
  if (!viewer) throw new Error("Topic viewer provider is missing.");
  return viewer;
}
