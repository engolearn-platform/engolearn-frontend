import { usePlacementLearnerAccess } from "@features/placement/hooks/usePlacementLearnerAccess";
import { Loading } from "@shared/components";
import { useAuth } from "@shared/hooks/useAuth";
import PlacementPublicLayout from "./PlacementPublicLayout";
import PlacementUserLayout from "./user/PlacementUserLayout";

export default function PlacementEntryLayout() {
  const { isLoading } = useAuth();
  const learner = usePlacementLearnerAccess();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-surface"><Loading /></div>;
  return learner ? <PlacementUserLayout /> : <PlacementPublicLayout />;
}
