import type { RouteObject } from "react-router";
import { ROUTES } from "@shared/constants";
import GrammarLearnerGuard from "@features/grammar/components/learning/GrammarLearnerGuard";
import GrammarRoadmapView from "@features/grammar/views/learning/GrammarRoadmapView";
import GrammarTopicView from "@features/grammar/views/learning/GrammarTopicView";
import GrammarTopicSummaryView from "@features/grammar/views/learning/GrammarTopicSummaryView";
import GrammarTheoryView from "@features/grammar/views/learning/GrammarTheoryView";
import GrammarPracticeView from "@features/grammar/views/learning/GrammarPracticeView";

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

export { GrammarManagementRoutes } from "@features/grammar/management.routes";
