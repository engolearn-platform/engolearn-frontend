import type { RouteObject } from "react-router";
import { createElement } from "react";
import { ROUTES } from "@shared/constants";
import AuthForm from "@features/auth/components/AuthForm";
import ProfileView from "@features/auth/views/ProfileView";
import GuestOnlyGuard from "@features/auth/components/GuestOnlyGuard";

export const AuthRoutes: RouteObject[] = [
  { path: ROUTES.PROFILE, Component: ProfileView },
  { Component: GuestOnlyGuard, children: [
    { path: ROUTES.LOGIN, Component: () => createElement(AuthForm, { mode: "login" }) },
    { path: ROUTES.REGISTER, Component: () => createElement(AuthForm, { mode: "register" }) },
  ] },
];
