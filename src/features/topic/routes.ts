import type { RouteObject } from "react-router";
import AdminLayout from "@/core/layouts/AdminLayout";
import EngoAppLayout from "@/core/layouts/EngoAppLayout";
import { ROUTES } from "@shared/constants";
import TopicPage from "./views/TopicPage";
import TopicManagementListView from "./views/management/TopicManagementListView";

export const TopicRoutes: RouteObject[] = [
  {
    path: "/topics",
    Component: EngoAppLayout,
    children: [
      {
        path: "",
        Component: TopicPage,
      },
    ],
  },
  {
    path: ROUTES.ADMIN_TOPICS,
    Component: AdminLayout,
    children: [
      {
        path: "",
        Component: TopicManagementListView,
      },
    ],
  },
];
