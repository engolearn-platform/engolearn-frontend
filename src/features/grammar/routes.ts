import type { RouteObject } from "react-router";
import { ROUTES } from "@shared/constants";
import GrammarLearnerGuard from "@features/grammar/components/GrammarLearnerGuard";
import GrammarRoadmapView from "@features/grammar/views/GrammarRoadmapView";
import GrammarTopicView from "@features/grammar/views/GrammarTopicView";
import GrammarTopicSummaryView from "@features/grammar/views/GrammarTopicSummaryView";
import GrammarTheoryView from "@features/grammar/views/GrammarTheoryView";
import GrammarPracticeView from "@features/grammar/views/GrammarPracticeView";

export const GrammarRoutes: RouteObject[] = [
  {
    path: ROUTES.GRAMMAR,
    Component: GrammarLearnerGuard,
    children: [
      {
        index: true,
        Component: GrammarRoadmapView,
      },
      { path: "topics/:topicId", Component: GrammarTopicView },
      { path: "topics/:topicId/summary", Component: GrammarTopicSummaryView },
      { path: "topics/:topicId/lessons/:lessonId", Component: GrammarTheoryView },
      { path: "topics/:topicId/lessons/:lessonId/practice", Component: GrammarPracticeView },
    ],
  },
];

export { GrammarAdminRoutes } from "./admin.routes";
