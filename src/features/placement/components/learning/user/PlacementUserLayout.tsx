import LearningLayout from "@/core/layouts/LearningLayout";
import { useAuth } from "@shared/hooks/useAuth";

export default function PlacementUserLayout() {
  const { identityGeneration } = useAuth();
  return <LearningLayout key={identityGeneration} />;
}
