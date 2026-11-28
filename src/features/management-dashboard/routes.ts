import { createElement } from "react";
import type { RouteObject } from "react-router";
import { ProtectedRoute } from "@features/auth/contract";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import ManagementDashboardView from "@features/management-dashboard/views/ManagementDashboardView";

export const ManagementDashboardRoutes: RouteObject[] = [{
  element: createElement(ProtectedRoute, { allowedRoles: ["CONTENT_MANAGER"] }),
  children: [{
    path: "/admin",
    Component: ManagementLayout,
    children: [{ index: true, Component: ManagementDashboardView }],
  }],
}];
