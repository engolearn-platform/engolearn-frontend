import type { Skill } from "./assessment.types";

export interface AssessmentHomeSummary {
  asOf: string;
  state: "AVAILABLE" | "NO_COMPLETED_ASSESSMENT";
  latestResult: {
    attemptId: string; submittedAt: string; level: string | null; score: number | null; maxScore: number;
    readingCorrect: number | null; readingTotal: number; listeningCorrect: number | null; listeningTotal: number;
    fullAnalysis: boolean; demonstration: boolean; weakSkills: Skill[];
  } | null;
}
