import { hasRequiredRole } from "@features/auth/contract";
import { useAuth } from "@shared/hooks/useAuth";

export function usePlacementLearnerAccess() {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated && hasRequiredRole(user?.role ?? null, ["USER"]);
}
