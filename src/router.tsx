import { AssessmentRoutes } from "@features/assessment/routes";
import { PostRoutes } from "@features/Post/routes";
import { useRoutes } from "react-router";
import { ProducsRoute } from "@/features/Product/routes";
import { GrammarRoutes } from "@features/grammar/routes";
import {
  TopicCatalogRoutes,
  TopicManagementRoutes,
  TopicStandaloneRoutes,
} from "@features/topic/routes";
import { LearningPathRoutes } from "@features/learning-path/routes";
import {
  SubscriptionLearnerRoutes,
  SubscriptionManagementRoutes,
} from "@features/subscription/routes";
import { AuthRoutes } from "@features/auth/routes";
import LearningLayout from "@/core/layouts/LearningLayout";
import LandingEntryView from "@features/landing-page/views/LandingEntryView";
import { LandingPageRoutes } from "@features/landing-page/routes";
import { ROUTES } from "@shared/constants";
import LearnerHomeRoute from "./LearnerHomeRoute";

export const appRoutes = [
  ...AuthRoutes,
  {
    path: ROUTES.HOME,
    Component: LandingEntryView,
    children: [{ index: true, Component: LearnerHomeRoute }],
  },
  ...LandingPageRoutes,
  ...PostRoutes,
  ...ProducsRoute,
  {
    Component: LearningLayout,
    children: [
      ...GrammarRoutes,
      ...TopicCatalogRoutes,
      ...LearningPathRoutes,
      ...SubscriptionLearnerRoutes,
    ],
  },
  ...AssessmentRoutes,
  ...TopicStandaloneRoutes,
  ...TopicManagementRoutes,
  ...SubscriptionManagementRoutes,
];

export const AppRouter = () => {
  const element = useRoutes(appRoutes);
  return element;
};
