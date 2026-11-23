import { ProtectedRoute } from "@features/auth/contract";
import { useAuth } from "@shared/hooks";

export default function GrammarLearnerGuard() {
  const { identityGeneration } = useAuth();
  return <ProtectedRoute key={identityGeneration} allowedRoles={["USER"]} />;
}
