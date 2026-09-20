import type { RouteObject } from "react-router";
import LearningLayout from "@/core/layouts/LearningLayout";
import { ROUTES } from "@shared/constants";
import GrammarRoadmapView from "./views/GrammarRoadmapView";

export const GrammarRoutes: RouteObject[] = [
  {
    path: ROUTES.GRAMMAR,
    Component: LearningLayout,
    children: [
      {
        path: "",
        Component: GrammarRoadmapView,
      },
      // Reserved: unit detail screen ("Chi tiết ngữ pháp").
      // { path: ":unitId", Component: GrammarUnitView },
    ],
  },
];
