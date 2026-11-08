import type { RouteObject } from "react-router";
import { PlacementPlaceholderView } from "@features/landing-page/views/LandingEntryView";
import { LANDING_PATHS } from "@features/landing-page/paths";
import LearningPathPreviewView from "@features/landing-page/views/LearningPathPreviewView";

export const LandingPageRoutes: RouteObject[] = [
  { path: LANDING_PATHS.PLACEMENT, Component: PlacementPlaceholderView },
  { path: LANDING_PATHS.LEARNING_PATH_PREVIEW, Component: LearningPathPreviewView },
];
