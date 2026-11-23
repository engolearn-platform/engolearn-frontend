import { ProtectedRoute } from "@features/auth/components/ProtectedRoute";

export default function AuthGuard() {
  return <ProtectedRoute />;
}
