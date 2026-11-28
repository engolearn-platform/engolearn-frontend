export interface TopicHomeSummary {
  asOf: string;
  state: "AVAILABLE" | "NO_CURRENT_LEARNING";
  counts: { inProgress: number; completed: number };
  currentTopic: {
    topicId: string; titleEn: string | null; titleVi: string | null; coverUrl: string | null; cefrLevel: string | null;
    progress: { status: string; completedItemCount: number; totalItemCount: number; percent: number };
    currentItem: { itemId: string; title: string } | null;
    nextItem: { itemId: string; title: string } | null;
  } | null;
}
