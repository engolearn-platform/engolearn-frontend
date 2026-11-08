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
