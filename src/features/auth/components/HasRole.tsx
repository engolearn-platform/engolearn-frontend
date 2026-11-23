import type { ReactNode } from "react";
import { useAuth } from "@shared/hooks";
import type { AuthUserRole } from "@shared/types/auth.types";
import { hasRequiredRole } from "@features/auth/utils/role-policy";

export interface HasRoleProps {
  allowedRoles: readonly AuthUserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function HasRole({ allowedRoles, children, fallback = null }: HasRoleProps) {
  const { user, isAuthenticated, isLoading, error } = useAuth();

  if (isLoading || error || !isAuthenticated) return fallback;

  return hasRequiredRole(user?.role ?? null, allowedRoles) ? children : fallback;
}
