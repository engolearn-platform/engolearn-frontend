import { Navigate, Outlet, useLocation } from "react-router";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";

export default function AuthGuard() {
  const { isAuthenticated, isLoading, error, refetch } = useAuth();
  const location = useLocation();
  if (isLoading || error) return <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-3 px-5 text-center"><p role="status" className="text-body-md text-on-surface-variant">{error ? "Unable to check your session." : "Checking your session…"}</p>{error && <button className="min-h-12 rounded-md bg-primary px-5 font-semibold text-on-primary" onClick={refetch}>Try again</button>}</main>;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  return <Outlet />;
}
