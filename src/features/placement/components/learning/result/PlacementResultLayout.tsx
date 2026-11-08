import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { GraduationCap } from "lucide-react";
import { Link, Outlet } from "react-router";
import { Loading } from "@shared/components";
import { useAuth } from "@shared/hooks/useAuth";
import PlacementUserLayout from "@features/placement/components/learning/user/PlacementUserLayout";

/** Neutral feature shell: no Guest auth actions or invented User profile. */
export default function PlacementResultLayout() {
  const { isLoading, isAuthenticated, isUser, identityGeneration } = useAuth();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-surface"><Loading /></div>;
  if (isAuthenticated && isUser()) return <PlacementUserLayout />;

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-5">
          <Link
            to={PLACEMENT_ROUTES.ROOT}
            aria-label="EngoLearn — Đánh giá đầu vào"
            className="flex items-center gap-2.5"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-primary">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="text-headline-sm font-bold tracking-tight">
              Engo<span className="text-primary">Learn</span>
            </span>
          </Link>
          <span className="hidden h-6 w-px bg-outline-variant sm:block" aria-hidden="true" />
          <span className="hidden text-label-lg font-semibold text-on-surface-variant sm:block">
            Đánh giá đầu vào
          </span>
        </div>
      </header>
      <main className="flex-1">
        <Outlet key={identityGeneration} />
      </main>
    </div>
  );
}
