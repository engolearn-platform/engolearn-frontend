import { Outlet, useLocation } from "react-router";
import LearningLayout from "@/core/layouts/LearningLayout";
import PublicNavigation from "@features/landing-page/components/PublicNavigation";
import { useAuth } from "@shared/hooks";

export function PublicResourceLayout({ standalone = false }: { standalone?: boolean }) {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface px-5" aria-busy="true">
        <p role="status" className="text-body-md text-on-surface-variant">Đang kiểm tra phiên đăng nhập…</p>
      </main>
    );
  }
  if (isAuthenticated) return standalone ? <Outlet /> : <LearningLayout />;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <PublicNavigation key={pathname} />
      {standalone ? <Outlet /> : <main id="main-content" tabIndex={-1}><Outlet /></main>}
    </div>
  );
}
