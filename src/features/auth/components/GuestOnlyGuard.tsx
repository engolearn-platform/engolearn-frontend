// M3.6.1 - ORIGINAL
// import { Navigate, Outlet } from "react-router";
// M3.6.1 - FIX
import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useAuth } from "@shared/hooks";
// M3.6.1 - ORIGINAL
// import { ROUTES } from "@shared/constants";
// M3.6.1 - FIX
import { getAuthReturnTo } from "@features/auth/auth-return-to";

export default function GuestOnlyGuard() {
  const { isAuthenticated, isLoading, error, refetch } = useAuth();
  // M3.6.1 - FIX: read the return-to state for the single redirect owner.
  const location = useLocation();

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center px-5"><p role="status" className="text-body-md text-on-surface-variant">Checking your session…</p></main>;
  }
  if (error) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center"><p role="alert" className="text-body-md text-on-surface-variant">Unable to check your session.</p><Button className="min-h-12" onClick={refetch}>Try again</Button></main>;
  }
  // M3.6.1 - ORIGINAL
  // if (isAuthenticated) return <Navigate to={ROUTES.HOME} replace />;
  // M3.6.1 - FIX
  if (isAuthenticated) return <Navigate to={getAuthReturnTo(location.state)} replace />;
  return <Outlet />;
}
