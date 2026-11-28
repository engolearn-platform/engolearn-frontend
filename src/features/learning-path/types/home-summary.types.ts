export interface LearningPathHomeSummary {
  asOf: string;
  state: "AVAILABLE" | "ASSESSMENT_REQUIRED" | "PAST_PATHS_ONLY" | "RECOMMENDATION_AVAILABLE" | "NO_WEAK_SKILLS" | "NO_ELIGIBLE_SKILLS";
  counts: { active: number; completed: number; cancelled: number };
  currentPath: {
    pathId: string; level: string | null; status: string; microSkills: string[];
    currentWeekNo: number | null; totalWeeks: number | null;
    assigned: number | null; answered: number | null; correct: number | null; canPractice: boolean;
  } | null;
  suggestion: { assessmentAttemptId: string | null; recommendationState: string | null; existingPathId: string | null; action: string } | null;
}
