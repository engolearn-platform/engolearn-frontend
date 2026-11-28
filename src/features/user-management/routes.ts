import { createElement } from "react";
import type { RouteObject } from "react-router";
import { ProtectedRoute } from "@features/auth/contract";
import ManagementLayout from "@/core/layouts/ManagementLayout";
import UserManagementView from "@features/user-management/views/UserManagementView";

function AdminUsersGuard() { return createElement(ProtectedRoute, { allowedRoles: ["ADMIN"] }); }

export const UserManagementRoutes: RouteObject[] = [{
  Component: AdminUsersGuard,
  children: [{
    path: "/admin/users",
    Component: ManagementLayout,
    children: [{ index: true, Component: UserManagementView }],
  }],
}];
