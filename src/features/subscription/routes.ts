import type { RouteObject } from "react-router";
import SubscriptionPlansView from "@features/subscription/views/learning/SubscriptionPlansView";
import SubscriptionUsageView from "@features/subscription/views/learning/SubscriptionUsageView";
import { SubscriptionPurchasesView, SubscriptionPurchaseDetailView, SubscriptionPaymentReturnView } from "@features/subscription/views/learning/SubscriptionPurchasesView";
import { ROUTES } from "@shared/constants";
import SubscriptionManagementLayout from "@features/subscription/components/management/SubscriptionManagementLayout";
import { SubscriptionPlanManagementView, SubscriptionQuotaManagementView } from "@features/subscription/views/management/SubscriptionManagementView";
import AuthGuard from "@features/auth/components/AuthGuard";

export const SubscriptionLearnerRoutes: RouteObject[] = [{
  path: ROUTES.SUBSCRIPTION,
  children: [
    { index: true, Component: SubscriptionPlansView },
    { path: "usage", Component: SubscriptionUsageView },
    { path: "purchases", Component: SubscriptionPurchasesView },
    { path: "purchases/:reference", Component: SubscriptionPurchaseDetailView },
    { path: "payment-return", Component: SubscriptionPaymentReturnView },
  ],
}];

export const SubscriptionManagementRoutes: RouteObject[] = [{
  Component: AuthGuard,
  children: [{
  path: "/admin/subscription",
  Component: SubscriptionManagementLayout,
  children: [
    { path: "plans", Component: SubscriptionPlanManagementView },
    { path: "quotas", Component: SubscriptionQuotaManagementView },
  ],
  }],
}];
