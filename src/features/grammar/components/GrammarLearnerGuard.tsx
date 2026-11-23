import { Navigate, Outlet, useLocation } from "react-router";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";
import { GrammarLoadError, GrammarLoading, GrammarPage } from "./GrammarLearningUi";

export default function GrammarLearnerGuard() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.isLoading) return <GrammarPage><GrammarLoading /></GrammarPage>;
  if (auth.error) {
    return (
      <GrammarPage>
        <GrammarLoadError message="Không kiểm tra được phiên đăng nhập." retry={auth.refetch} />
      </GrammarPage>
    );
  }
  if (!auth.isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  return <Outlet key={auth.identityGeneration} />;
}
