import type { RouteObject } from "react-router";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import LearningLayout from "@/core/layouts/LearningLayout";
import { ROUTES } from "@shared/constants";
import TopicPage from "./views/TopicPage";
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
