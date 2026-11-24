import { ProtectedRoute } from "@features/auth/contract";

export default function PlacementManagementGuard() {
  return <ProtectedRoute allowedRoles={["ADMIN"]} />;
}
