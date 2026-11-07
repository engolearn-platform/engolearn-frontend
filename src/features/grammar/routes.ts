import type { RouteObject } from "react-router";
import { ROUTES } from "@shared/constants";
import GrammarRoadmapView from "./views/GrammarRoadmapView";

export const GrammarRoutes: RouteObject[] = [
  {
    path: ROUTES.GRAMMAR,
    children: [
      {
        index: true,
        Component: GrammarRoadmapView,
      },
      // Reserved: unit detail screen ("Chi tiết ngữ pháp").
      // { path: ":unitId", Component: GrammarUnitView },
    ],
  },
];
