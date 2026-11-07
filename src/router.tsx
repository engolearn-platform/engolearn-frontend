import { PostRoutes } from "@features/Post/routes";
import { useRoutes } from "react-router";
import { WelcomeRoutes } from "@features/Welcome/routes";
import { ProducsRoute } from "@/features/Product/routes";
import { GrammarRoutes } from "@features/grammar/routes";
import { TopicCatalogRoutes, TopicManagementRoutes, TopicStandaloneRoutes } from "@features/topic/routes";
import { LearningPathRoutes } from "@features/learning-path/routes";
import { SubscriptionLearnerRoutes, SubscriptionManagementRoutes } from "@features/subscription/routes";
import { AuthRoutes } from "@features/auth/routes";
import LearningLayout from "@/core/layouts/LearningLayout";

export const appRoutes = [
  ...WelcomeRoutes,
  ...AuthRoutes,
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
  ...TopicStandaloneRoutes,
  ...TopicManagementRoutes,
  ...SubscriptionManagementRoutes,
];

export const AppRouter = () => {
  const element = useRoutes(appRoutes);
  return element;
};
