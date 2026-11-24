import { createElement } from "react";
import { Navigate } from "react-router";
import PlacementManagementLayout from "./components/management/PlacementManagementLayout";
import PlacementManagementGuard from "./components/management/PlacementManagementGuard";
import PlacementManagementProvider from "./components/management/PlacementManagementProvider";
import PlacementQuestionBankView from "./views/management/PlacementQuestionBankView";
import PlacementQuestionFormView from "./views/management/PlacementQuestionFormView";
import PlacementQuestionImportView from "./views/management/PlacementQuestionImportView";
import PlacementTestSetListView from "./views/management/PlacementTestSetListView";
import PlacementTestSetEditorView from "./views/management/PlacementTestSetEditorView";
import PlacementTestSetPreviewView from "./views/management/PlacementTestSetPreviewView";
import PlacementAttemptListView from "./views/management/PlacementAttemptListView";
import PlacementAttemptDetailView from "./views/management/PlacementAttemptDetailView";
import { MANAGEMENT_PATHS } from "./constants/placement-management";
import type { RouteObject } from "react-router";
import PlacementAttemptLayout from "./components/learning/attempt/PlacementAttemptLayout";
import PlacementPublicLayout from "./components/learning/PlacementPublicLayout";
import PlacementEntryLayout from "./components/learning/PlacementEntryLayout";
import PlacementResultLayout from "./components/learning/result/PlacementResultLayout";
import { PLACEMENT_ROUTES } from "./constants";
import PlacementAttemptView from "./views/learning/PlacementAttemptView";
import PlacementClaimGateView from "./views/learning/PlacementClaimGateView";
import PlacementResultView from "./views/learning/PlacementResultView";
import PlacementReviewView from "./views/learning/PlacementReviewView";
import PlacementStartView from "./views/learning/PlacementStartView";
import PlacementDevLoginView from "./views/learning/PlacementDevLoginView";

export const PlacementRoutes: RouteObject[] = [
  {
    path: PLACEMENT_ROUTES.ROOT,
    Component: PlacementEntryLayout,
    children: [{ path: "", Component: PlacementStartView }],
  },
  ...(import.meta.env.DEV ? [{
    path: PLACEMENT_ROUTES.DEV_LOGIN,
    Component: PlacementPublicLayout,
    children: [{ path: "", Component: PlacementDevLoginView }],
  }] : []),
  {
    path: PLACEMENT_ROUTES.ATTEMPT_PATTERN,
    Component: PlacementAttemptLayout,
    children: [{ path: "", Component: PlacementAttemptView }],
  },
  {
    path: PLACEMENT_ROUTES.ATTEMPT_SUBMITTED,
    Component: PlacementPublicLayout,
    children: [{ path: "", Component: PlacementClaimGateView }],
  },
  {
    path: PLACEMENT_ROUTES.ATTEMPT_RESULT,
    Component: PlacementResultLayout,
    children: [{ path: "", Component: PlacementResultView }],
  },
  {
    path: PLACEMENT_ROUTES.ATTEMPT_REVIEW,
    Component: PlacementResultLayout,
    children: [{ path: "", Component: PlacementReviewView }],
  },
];

// Management is additive and has a dedicated role boundary; learner route definitions above are unchanged.
export const PlacementManagementRoutes: RouteObject[] = [{
  Component: PlacementManagementGuard,
  children: [{
    path: MANAGEMENT_PATHS.root,
    Component: PlacementManagementLayout,
    children: [{ Component: PlacementManagementProvider, children: [
      { index: true, element: createElement(Navigate, { to: MANAGEMENT_PATHS.sets, replace: true }) },
      { path: "questions", Component: PlacementQuestionBankView },
      { path: "questions/new", Component: PlacementQuestionFormView },
      { path: "questions/import", Component: PlacementQuestionImportView },
      { path: "questions/:questionId/edit", Component: PlacementQuestionFormView },
      { path: "test-sets", Component: PlacementTestSetListView },
      { path: "test-sets/:setId/edit", Component: PlacementTestSetEditorView },
      { path: "test-sets/:setId/preview", Component: PlacementTestSetPreviewView },
      { path: "attempts", Component: PlacementAttemptListView },
      { path: "attempts/:attemptId", Component: PlacementAttemptDetailView },
      { path: "*", element: createElement(Navigate, { to: MANAGEMENT_PATHS.sets, replace: true }) },
    ] }],
  }],
}];
