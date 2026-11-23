import { createElement } from "react";
import type { RouteObject } from "react-router";
import { ProtectedRoute } from "@features/auth/contract";
import { ROUTES } from "@shared/constants";
import AssessmentLearningLayout from "@features/assessment/components/AssessmentLearningLayout";
import { AssessmentGate } from "@features/assessment/components/AssessmentCommon";
import AssessmentPreparationView from "@features/assessment/views/learning/AssessmentPreparationView";
import AssessmentTakingView from "@features/assessment/views/learning/AssessmentTakingView";
import AssessmentHistoryView from "@features/assessment/views/learning/AssessmentHistoryView";
import AssessmentResultView from "@features/assessment/views/learning/AssessmentResultView";
import AssessmentReviewView from "@features/assessment/views/learning/AssessmentReviewView";
import AssessmentManagementLayout from "./components/AssessmentManagementLayout";
import DraftManagementView from "./views/management/DraftManagementView";

export const AssessmentRoutes: RouteObject[] = [{
  element: createElement(ProtectedRoute, { allowedRoles: ["CONTENT_MANAGER"] }),
  children: [{ path: ROUTES.ADMIN_ASSESSMENT, Component: AssessmentManagementLayout,
    children: [{ index: true, Component: DraftManagementView }] }],
}, {
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
