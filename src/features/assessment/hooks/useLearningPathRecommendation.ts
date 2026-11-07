import { useCallback } from "react";
import { useAssessmentQuery } from "@features/assessment/hooks/useAssessmentQuery";
import { learningPathRecommendationApi } from "@features/assessment/services/learningPathRecommendationApi";

export function useLearningPathRecommendation(assessmentAttemptId: string) {
  const fetcher = useCallback((signal: AbortSignal) =>
    learningPathRecommendationApi.get(assessmentAttemptId, signal), [assessmentAttemptId]);
  return useAssessmentQuery(fetcher);
}
