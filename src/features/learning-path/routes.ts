import LearningLayout from "@/core/layouts/LearningLayout";
import { ROUTES } from "@shared/constants";
import type { RouteObject } from "react-router";
import LearningPathListView from "./views/learning/LearningPathListView";
import LearningPathDetailView from "./views/learning/LearningPathDetailView";
import LearningPathDailyPracticeView from "./views/learning/LearningPathDailyPracticeView";
import LearningPathDayResultView from "./views/learning/LearningPathDayResultView";

export const LearningPathRoutes: RouteObject[] = [
  {
    path: ROUTES.LEARNING_PATHS,
    Component: LearningLayout,
    children: [
      { path: "", Component: LearningPathListView },
      { path: ":pathId", Component: LearningPathDetailView },
      { path: ":pathId/weeks/:weekNo/days/:dayNo/practice", Component: LearningPathDailyPracticeView },
      { path: ":pathId/weeks/:weekNo/days/:dayNo/result", Component: LearningPathDayResultView },
    ],
  },
];
