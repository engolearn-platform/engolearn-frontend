import { ProtectedRoute } from "@features/auth/components/ProtectedRoute";

const CONTENT_MANAGEMENT_ROLES = ["CONTENT_MANAGER", "ADMIN"] as const;

export default function TopicManagementGuard() {
  return <ProtectedRoute allowedRoles={CONTENT_MANAGEMENT_ROLES} />;
}
