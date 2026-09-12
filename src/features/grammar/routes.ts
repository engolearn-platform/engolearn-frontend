import type { RouteObject } from "react-router";
import EngoAppLayout from "@/core/layouts/EngoAppLayout";
import { ROUTES } from "@shared/constants";
import GrammarRoadmapView from "./views/GrammarRoadmapView";

export const GrammarRoutes: RouteObject[] = [
  {
    path: ROUTES.GRAMMAR,
    Component: EngoAppLayout,
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
