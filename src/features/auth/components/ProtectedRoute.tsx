import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";
import type { AuthUserRole } from "@shared/types/auth.types";
import { ForbiddenView } from "@features/auth/components/ForbiddenView";
import { hasRequiredRole } from "@features/auth/utils/role-policy";

export interface ProtectedRouteProps {
  allowedRoles?: readonly AuthUserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, error, refetch } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <p role="status" className="text-body-md text-on-surface-variant">Checking your session…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p role="alert" className="text-body-md text-on-surface-variant">Unable to check your session.</p>
        <Button className="min-h-12" onClick={refetch}>
          Try again
        </Button>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (allowedRoles && !hasRequiredRole(user?.role ?? null, allowedRoles)) {
    return <ForbiddenView />;
  }

  return <Outlet />;
}
