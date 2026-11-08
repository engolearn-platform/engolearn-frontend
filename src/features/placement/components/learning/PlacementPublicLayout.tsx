import { Outlet } from "react-router";
import { useAuth } from "@shared/hooks/useAuth";
import PlacementPublicHeader from "./PlacementPublicHeader";

export default function PlacementPublicLayout() {
  const { identityGeneration } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <PlacementPublicHeader />
      <main className="flex-1">
        <Outlet key={identityGeneration} />
      </main>
    </div>
  );
}
