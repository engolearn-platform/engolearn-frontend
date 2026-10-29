import type { RouteObject } from "react-router";
import LearningLayout from "@/core/layouts/LearningLayout";
import SubscriptionPlansView from "@features/subscription/views/learning/SubscriptionPlansView";
import SubscriptionUsageView from "@features/subscription/views/learning/SubscriptionUsageView";
import { ROUTES } from "@shared/constants";

export const SubscriptionRoutes: RouteObject[] = [{
  path: ROUTES.SUBSCRIPTION,
  Component: LearningLayout,
  children: [
    { index: true, Component: SubscriptionPlansView },
    { path: "usage", Component: SubscriptionUsageView },
  ],
}];
