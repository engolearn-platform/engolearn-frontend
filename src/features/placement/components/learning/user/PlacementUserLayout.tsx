import { useAuth } from "@shared/hooks/useAuth";
import { X } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router";
import PlacementUserSidebar from "./PlacementUserSidebar";
import PlacementUserTopBar from "./PlacementUserTopBar";

export default function PlacementUserLayout() {
  const { user, identityGeneration } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      <PlacementUserSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PlacementUserTopBar email={user?.email ?? ""} onOpenMenu={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1"><Outlet key={identityGeneration} /></main>
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-on-surface/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Menu học tập" className="relative h-full max-w-[calc(100vw-3rem)] bg-surface-container-low">
            <PlacementUserSidebar mobile onNavigate={() => setMobileOpen(false)} />
            <button type="button" aria-label="Đóng menu học tập" onClick={() => setMobileOpen(false)} className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
