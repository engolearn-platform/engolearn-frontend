import type { RouteObject } from "react-router";
import GrammarAdminGuard from "./components/admin/GrammarAdminGuard";
import { grammarPaths } from "./constants/admin-paths";
import {
  GrammarBlocksView, GrammarLessonReviewView, GrammarQuestionFormView, GrammarQuestionsView, GrammarTopicPublishView,
} from "./views/admin/GrammarAuthoringViews";
import {
  GrammarLessonFormView, GrammarLessonListView, GrammarTopicFormView, GrammarTopicListView,
} from "./views/admin/GrammarTopicViews";
export const GrammarAdminRoutes: RouteObject[] = [{
  path: grammarPaths.root,
  Component: GrammarAdminGuard,
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
}];
