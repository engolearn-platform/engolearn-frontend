import { PostRoutes } from "@features/Post/routes";
import { useRoutes } from "react-router";
import { WelcomeRoutes } from "@features/Welcome/routes";
import { ProducsRoute } from "@/features/Product/routes";
import { GrammarRoutes } from "@features/grammar/routes";
import { TopicRoutes } from "@features/topic/routes";

export const appRoutes = [
  ...WelcomeRoutes,
  ...PostRoutes,
  ...ProducsRoute,
  ...GrammarRoutes,
  ...TopicRoutes,
];

export const AppRouter = () => {
  const element = useRoutes(appRoutes);
  return element;
};
