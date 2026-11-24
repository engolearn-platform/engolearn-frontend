import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks/useAuth";
import { Navigate, useLocation } from "react-router";

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith(PLACEMENT_ROUTES.ROOT)) return PLACEMENT_ROUTES.ROOT;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin
      || (url.pathname !== PLACEMENT_ROUTES.ROOT
        && !url.pathname.startsWith(`${PLACEMENT_ROUTES.ROOT}/`))
      || url.pathname === PLACEMENT_ROUTES.DEV_LOGIN) return PLACEMENT_ROUTES.ROOT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return PLACEMENT_ROUTES.ROOT;
  }
}

export default function PlacementDevLoginView() {
  const { search } = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const returnTo = safeReturnTo(new URLSearchParams(search).get("returnTo"));
  const target = new URL(returnTo, window.location.origin);

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={returnTo} replace />;
  return <Navigate to={ROUTES.LOGIN} replace state={{
    from: { pathname: target.pathname, search: target.search, hash: target.hash },
  }} />;
}
