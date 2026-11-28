export interface GrammarHomeSummary {
  asOf: string;
  state: "AVAILABLE" | "NOT_STARTED" | "NO_CURRENT_LEARNING";
  counts: { completedLessons: number; inProgressLessons: number };
  currentTopic: {
    topicId: string; titleEn: string | null; titleVi: string | null; level: string;
    completedLessons: number; totalLessons: number;
    lesson: { lessonId: string; titleEn: string | null; titleVi: string | null; status: string; lastScore: number | null; bestScore: number | null; maxScore: number };
  } | null;
}
