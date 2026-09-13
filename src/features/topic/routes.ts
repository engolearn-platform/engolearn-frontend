import type { RouteObject } from "react-router";
import EngoAppLayout from "@/core/layouts/EngoAppLayout";
import TopicPage from "./views/TopicPage";

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
];
