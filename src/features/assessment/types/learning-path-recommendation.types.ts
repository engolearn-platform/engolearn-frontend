export interface LearningPathRecommendation {
  state: "AVAILABLE" | "NO_WEAK_SKILLS" | "NO_ELIGIBLE_SKILLS" | "ALREADY_CREATED";
  message: string | null;
  existingPathId: string | null;
  level: string;
  durationWeeks: number;
  daysPerWeek: number;
  questionsPerDay: number;
  microSkills: {
    name: string;
    skill: string;
    correct: number;
    total: number;
    percent: number;
    band: string;
  }[];
}
