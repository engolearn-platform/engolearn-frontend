import type { RouteObject } from "react-router";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import LearningLayout from "@/core/layouts/LearningLayout";
import { ROUTES } from "@shared/constants";
import TopicPage from "./views/TopicPage";
import TopicDetailView from "./views/learning/TopicDetailView";
import TopicContextView from "./views/learning/TopicContextView";
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
    // Top-level absolute path wrapped in LearningLayout (nesting an
    // absolute child under "/topics" is rejected by react-router);
    // the view uses sticky (not fixed) bars to fit the shell.
    path: ROUTES.TOPIC_DETAIL,
    Component: LearningLayout,
    children: [
      {
        path: "",
        Component: TopicDetailView,
      },
    ],
  },
  {
    // Top-level absolute path wrapped in LearningLayout (nesting an
    // absolute child under "/topics" is rejected by react-router);
    // the view uses sticky (not fixed) bars to fit the shell.
    path: ROUTES.TOPIC_CONTEXT,
    Component: LearningLayout,
    children: [
      {
        path: "",
        Component: TopicContextView,
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
    ],
  },
];
