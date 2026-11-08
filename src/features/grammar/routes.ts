import type { RouteObject } from "react-router";
import LearningLayout from "@/core/layouts/LearningLayout";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import { ROUTES } from "@shared/constants";
import GrammarRoadmapView from "./views/GrammarRoadmapView";
import GrammarTopicListView from "./views/admin/GrammarTopicListView";

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

export const GrammarAdminRoutes: RouteObject[] = [
  {
    path: ROUTES.ADMIN_GRAMMAR,
    Component: ManagementLayout,
    children: [
      {
        path: "",
        Component: GrammarTopicListView,
      },
      // Reserved: create/edit screens (GA-01, GA-02) — chưa có Stitch UI.
      // { path: "create", Component: GrammarTopicCreateView },
    ],
  },
];
