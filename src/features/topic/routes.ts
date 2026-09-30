import type { RouteObject } from "react-router";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import LearningLayout from "@/core/layouts/LearningLayout";
import TopicLearningLayout from "@/core/layouts/TopicLearningLayout";
import { ROUTES } from "@shared/constants";
import TopicPage from "./views/TopicPage";
import TopicCreateBasicInfoView from "./views/management/TopicCreateBasicInfoView";
import TopicCreateItemsView from "./views/management/TopicCreateItemsView";
import TopicItemEditorView from "./views/management/TopicItemEditorView";
import TopicDetailView from "./views/learning/TopicDetailView";
import TopicContextView from "./views/learning/TopicContextView";
import TopicVocabView from "./views/learning/TopicVocabView";
import TopicExpressionsView from "./views/learning/TopicExpressionsView";
import TopicPracticePlaceholderView from "./views/learning/TopicPracticePlaceholderView";
import TopicManagementListView from "./views/management/TopicManagementListView";

export const TopicRoutes: RouteObject[] = [
  {
    path: "/topics",
    Component: LearningLayout,
    children: [
      {
        path: "",
        Component: TopicPage,
      },
    ],
  },
  {
    // Shared learner layout: one TopicLearningLayout instance wraps all
    // learner stages so TopicProgressProvider mounts once and `furthest` +
    // `currentStage` survive navigation between context/vocab/expressions.
    // (Top-level absolute children under "/topics" are rejected by
    // react-router, hence the pathless layout parent.)
    Component: TopicLearningLayout,
    children: [
      {
        path: ROUTES.TOPIC_DETAIL,
        children: [
          {
            path: "",
            Component: TopicDetailView,
          },
        ],
      },
      {
        path: ROUTES.TOPIC_CONTEXT,
        children: [
          {
            path: "",
            Component: TopicContextView,
          },
        ],
      },
      {
        path: ROUTES.TOPIC_VOCAB,
        children: [
          {
            path: "",
            Component: TopicVocabView,
          },
        ],
      },
      {
        path: ROUTES.TOPIC_EXPRESSIONS,
        children: [
          {
            path: "",
            Component: TopicExpressionsView,
          },
        ],
      },
      {
        path: ROUTES.TOPIC_PRACTICE,
        children: [
          {
            path: "",
            Component: TopicPracticePlaceholderView,
          },
        ],
      },
    ],
  },
  {
    path: ROUTES.ADMIN_TOPICS,
    Component: ManagementLayout,
    children: [
      {
        path: "",
        Component: TopicManagementListView,
      },
      {
        path: "create",
        Component: TopicCreateBasicInfoView,
      },
      {
        path: "create/items",
        Component: TopicCreateItemsView,
      },
      {
        path: "create/items/:itemId/:sectionKey",
        Component: TopicItemEditorView,
      },
    ],
  },
];
