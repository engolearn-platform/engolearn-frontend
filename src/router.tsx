import { PostRoutes } from "@features/Post/routes";
import { useRoutes } from "react-router";
import { WelcomeRoutes } from "@features/Welcome/routes";
import { ProducsRoute } from "@/features/Product/routes";
import { GrammarAdminRoutes, GrammarRoutes } from "@features/grammar/routes";
import { TopicRoutes } from "@features/topic/routes";
import { LearningPathRoutes } from "@features/learning-path/routes";
import { SubscriptionRoutes } from "@features/subscription/routes";
import { AuthRoutes } from "@features/auth/routes";
import { PlacementRoutes } from "@features/placement/routes";

export const appRoutes = [
  ...WelcomeRoutes,
  ...AuthRoutes,
  ...PostRoutes,
  ...ProducsRoute,
  ...GrammarRoutes,
  ...GrammarAdminRoutes,
  ...TopicRoutes,
  ...LearningPathRoutes,
  ...SubscriptionRoutes,
  ...PlacementRoutes,
];

export const AppRouter = () => {
  const element = useRoutes(appRoutes);
  return element;
};
