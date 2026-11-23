import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useAuth } from "@shared/hooks";
import { authReturnTo } from "@features/auth/utils/authReturnTo";
import { ROUTES } from "@shared/constants";

export default function GuestOnlyGuard() {
  const { user, isAuthenticated, isLoading, error, refetch } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center px-5"><p role="status" className="text-body-md text-on-surface-variant">Checking your session…</p></main>;
  }
  if (error) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center"><p role="alert" className="text-body-md text-on-surface-variant">Unable to check your session.</p><Button className="min-h-12" onClick={refetch}>Try again</Button></main>;
  }
  if (isAuthenticated) {
    const returnTo = authReturnTo(location.state);
    // Keep requested protected pages, with a role-specific entry for an ordinary login.
    const destination = returnTo === ROUTES.HOME
      ? user?.role === "ADMIN" ? "/admin/placement/test-sets"
        : user?.role === "CONTENT_MANAGER" ? ROUTES.ADMIN_GRAMMAR : returnTo
      : returnTo;
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}
