import type { RouteObject } from "react-router";
import { LANDING_PATHS } from "@features/landing-page/paths";
import LearningPathPreviewView from "@features/landing-page/views/LearningPathPreviewView";

// PlacementRoutes exclusively owns /placement; keep main's public preview route.
export const LandingPageRoutes: RouteObject[] = [
  { path: LANDING_PATHS.LEARNING_PATH_PREVIEW, Component: LearningPathPreviewView },
];