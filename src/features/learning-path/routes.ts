import { ROUTES } from "@shared/constants";
import type { RouteObject } from "react-router";
import { createElement } from "react";
import { ProtectedRoute } from "@features/auth/contract";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import PassageManagementListView from "@features/learning-path/views/management/PassageManagementListView";
import LearningPathListView from "./views/learning/LearningPathListView";
import LearningPathDetailView from "./views/learning/LearningPathDetailView";
import LearningPathDailyPracticeView from "./views/learning/LearningPathDailyPracticeView";
import LearningPathDayResultView from "./views/learning/LearningPathDayResultView";

export const LearningPathRoutes: RouteObject[] = [
  {
    path: ROUTES.LEARNING_PATHS,
    children: [
      { index: true, Component: LearningPathListView },
      { path: ":pathId", Component: LearningPathDetailView },
      { path: ":pathId/weeks/:weekNo/days/:dayNo/practice", Component: LearningPathDailyPracticeView },
      { path: ":pathId/weeks/:weekNo/days/:dayNo/result", Component: LearningPathDayResultView },
    ],
  },
];

function PassageManagementGuard() {
  return createElement(ProtectedRoute, { allowedRoles: ["CONTENT_MANAGER"] });
}

export const LearningPathManagementRoutes: RouteObject[] = [{
  Component: PassageManagementGuard,
  children: [{
    path: ROUTES.ADMIN_PASSAGES,
    Component: ManagementLayout,
    children: [{ index: true, Component: PassageManagementListView }],
  }],
}];
