import { matchPath, Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";
import { authReturnTo } from "@features/auth/utils/authReturnTo";
import { hasRequiredRole } from "@features/auth/utils/role-policy";

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
    const canManageContent = hasRequiredRole(user?.role ?? null, ["CONTENT_MANAGER"]);
    const pathname = returnTo.split(/[?#]/, 1)[0];
    const isContentManagement = [ROUTES.ADMIN_TOPICS, ROUTES.ADMIN_PASSAGES, ROUTES.ADMIN_ASSESSMENT]
      .some(base => matchPath(`${base}/*`, pathname));
    const isAdminUserManagement = pathname === "/admin/users" && user?.role === "ADMIN";
    return <Navigate to={canManageContent && !isContentManagement && !isAdminUserManagement ? ROUTES.ADMIN_TOPICS : returnTo} replace />;
  }
  return <Outlet />;
}
