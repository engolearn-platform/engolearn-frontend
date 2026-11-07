import type { RouteObject } from "react-router";
import { PlacementPlaceholderView } from "@features/landing-page/views/LandingEntryView";
import { LANDING_PATHS } from "@features/landing-page/paths";

export const LandingPageRoutes: RouteObject[] = [
  { path: LANDING_PATHS.PLACEMENT, Component: PlacementPlaceholderView },
];
