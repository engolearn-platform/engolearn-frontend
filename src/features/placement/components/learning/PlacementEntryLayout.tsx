import { Loading } from "@shared/components";
import { useAuth } from "@shared/hooks/useAuth";
import PlacementPublicLayout from "./PlacementPublicLayout";
import PlacementUserLayout from "./user/PlacementUserLayout";

export default function PlacementEntryLayout() {
  const { isAuthenticated, isUser, isLoading } = useAuth();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-surface"><Loading /></div>;
  return isAuthenticated && isUser() ? <PlacementUserLayout /> : <PlacementPublicLayout />;
}
