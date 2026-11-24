import type { AuthUserRole } from "@shared/types/auth.types";

const roleRank: Record<AuthUserRole, number> = {
  USER: 1,
  CONTENT_MANAGER: 2,
  ADMIN: 3,
};

export function hasRequiredRole(
  currentRole: AuthUserRole | null,
  allowedRoles: readonly AuthUserRole[],
): boolean {
  if (currentRole === null || allowedRoles.length === 0) return false;

  return allowedRoles.some((allowedRole) => roleRank[currentRole] >= roleRank[allowedRole]);
}
