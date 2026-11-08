import type { RouteObject } from "react-router";
import AssessmentLearningLayout from "@features/assessment/components/AssessmentLearningLayout";
import { AssessmentGate } from "@features/assessment/components/AssessmentCommon";
import AssessmentPreparationView from "@features/assessment/views/learning/AssessmentPreparationView";
import AssessmentTakingView from "@features/assessment/views/learning/AssessmentTakingView";
import AssessmentHistoryView from "@features/assessment/views/learning/AssessmentHistoryView";
import AssessmentResultView from "@features/assessment/views/learning/AssessmentResultView";
import AssessmentReviewView from "@features/assessment/views/learning/AssessmentReviewView";
export const AssessmentRoutes: RouteObject[] = [{
  Component: AssessmentGate,
  children: [{
    path: "/assessment", Component: AssessmentLearningLayout, children: [
      {index: true, Component: AssessmentPreparationView},
      {path: "history", Component: AssessmentHistoryView},
      {path: "attempts/:attemptId/result", Component: AssessmentResultView},
      {path: "attempts/:attemptId/review", Component: AssessmentReviewView},
    ],
  }, {path: "/assessment/taking", Component: AssessmentTakingView}],
}];
