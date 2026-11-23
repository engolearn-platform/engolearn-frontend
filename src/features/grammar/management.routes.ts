import { createElement } from "react";
import { ProtectedRoute } from "@features/auth/contract";
import type { RouteObject } from "react-router";
import GrammarManagementGuard from "@features/grammar/components/management/GrammarManagementGuard";
import { grammarPaths } from "@features/grammar/constants/management-paths";
import {
  GrammarBlocksView, GrammarLessonReviewView, GrammarQuestionFormView, GrammarQuestionsView, GrammarTopicPublishView,
} from "@features/grammar/views/management/GrammarAuthoringViews";
import {
  GrammarLessonFormView, GrammarLessonListView, GrammarTopicFormView, GrammarTopicListView,
} from "@features/grammar/views/management/GrammarTopicViews";
export const GrammarManagementRoutes: RouteObject[] = [{
  element: createElement(ProtectedRoute, { allowedRoles: ["CONTENT_MANAGER"] }),
  children: [{
  path: grammarPaths.root,
  Component: GrammarManagementGuard,
  children: [
    { index: true, Component: GrammarTopicListView },
    { path: "new", Component: GrammarTopicFormView },
    { path: ":topicId", Component: GrammarTopicFormView },
    { path: ":topicId/lessons", Component: GrammarLessonListView },
    { path: ":topicId/lessons/new", Component: GrammarLessonFormView },
    { path: ":topicId/lessons/:lessonId", Component: GrammarLessonFormView },
    { path: ":topicId/lessons/:lessonId/blocks", Component: GrammarBlocksView },
    { path: ":topicId/lessons/:lessonId/questions", Component: GrammarQuestionsView },
    { path: ":topicId/lessons/:lessonId/questions/:questionId", Component: GrammarQuestionFormView },
    { path: ":topicId/lessons/:lessonId/review", Component: GrammarLessonReviewView },
    { path: ":topicId/publish", Component: GrammarTopicPublishView },
  ],
  }],
}];
