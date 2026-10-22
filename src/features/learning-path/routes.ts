import LearningLayout from "@/core/layouts/LearningLayout";
import { ROUTES } from "@shared/constants";
import type { RouteObject } from "react-router";
import LearningPathListView from "./views/learning/LearningPathListView";

export const LearningPathRoutes: RouteObject[] = [
  {
    path: ROUTES.LEARNING_PATHS,
    Component: LearningLayout,
    children: [{ path: "", Component: LearningPathListView }],
  },
];
