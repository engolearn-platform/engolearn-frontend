import PublicNavigation from "@shared/components/PublicNavigation";
import { Outlet, useLocation } from "react-router";
import { useAuth } from "@shared/hooks/useAuth";
import PlacementPublicHeader from "./PlacementPublicHeader";
import PlacementUserLayout from "./user/PlacementUserLayout";

export default function PlacementPublicLayout() {
  const { identityGeneration, isAuthenticated, isUser } = useAuth();
  const { pathname } = useLocation();
  if (isAuthenticated && isUser()) return <PlacementUserLayout />;
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      {isAuthenticated ? <PlacementPublicHeader /> : <PublicNavigation key={pathname} />}
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Outlet key={identityGeneration} />
      </main>
    </div>
  );
}
