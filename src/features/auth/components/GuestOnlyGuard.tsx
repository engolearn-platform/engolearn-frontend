import { Navigate, Outlet } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";

export default function GuestOnlyGuard() {
  const { isAuthenticated, isLoading, error, refetch } = useAuth();

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center px-5"><p role="status" className="text-body-md text-on-surface-variant">Checking your session…</p></main>;
  }
  if (error) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center"><p role="alert" className="text-body-md text-on-surface-variant">Unable to check your session.</p><Button className="min-h-12" onClick={refetch}>Try again</Button></main>;
  }
  if (isAuthenticated) return <Navigate to={ROUTES.HOME} replace />;
  return <Outlet />;
}
