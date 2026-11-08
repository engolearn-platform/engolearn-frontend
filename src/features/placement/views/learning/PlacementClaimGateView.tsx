import { EmptyState, Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { useAuth } from "@shared/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useLocation } from "react-router";
import { ROUTES } from "@shared/constants";
import PlacementClaimCard from "@features/placement/components/learning/claim/PlacementClaimCard";
import PlacementActiveAttemptConflictCard from "@features/placement/components/learning/claim/PlacementActiveAttemptConflictCard";
import PlacementClaimStatusCard from "@features/placement/components/learning/claim/PlacementClaimStatusCard";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { getPlacementClaimStatus } from "@features/placement/services/placement.service";
import { PlacementApiError } from "@features/placement/services/placement.http";
import type { PlacementClaimGate } from "@features/placement/types/placement-claim.types";

/**
 * Post-submit dispatcher for `/placement/attempts/:attemptId/submitted`.
 * The backend owns the state; this view only renders `claimStatus`.
 */
export default function PlacementClaimGateView() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, isUser, identityGeneration } = useAuth();
  const location = useLocation();
  const learner = isAuthenticated && isUser();
  const fetchClaimGate = useCallback(
    (signal: AbortSignal) => getPlacementClaimStatus(attemptId, signal),
    [attemptId],
  );
  const { data, loading, error } = useFetch(fetchClaimGate, !authLoading && !isAuthenticated);
  const [devGate, setDevGate] = useState<PlacementClaimGate | null>(null);
  const [claiming, setClaiming] = useState(true);
  const [claimError, setClaimError] = useState(false);
  const [activeAttemptConflict, setActiveAttemptConflict] = useState(false);
  const gate = learner ? devGate : data;

  useEffect(() => {
    if (authLoading || !learner) return;
    const controller = new AbortController();
    const claim = async () => {
      setClaiming(true);
      setDevGate(null);
      setClaimError(false);
      setActiveAttemptConflict(false);
      try {
        const claimed = await getPlacementClaimStatus(attemptId, controller.signal);
        if (controller.signal.aborted) return;
        if (claimed.claimStatus === "ALREADY_CLAIMED" || claimed.claimStatus === "USER_HAS_RESULT") {
          if (!claimed.resultAttemptId) {
            setClaimError(true);
            return;
          }
          navigate(PLACEMENT_ROUTES.attemptResult(claimed.resultAttemptId), { replace: true });
          return;
        }
        setDevGate(claimed);
      } catch (cause) {
        if (controller.signal.aborted) return;
        if (cause instanceof PlacementApiError && cause.status === 409
          && cause.code === "PLACEMENT_ACTIVE_ATTEMPT_EXISTS") {
          setActiveAttemptConflict(true);
          return;
        }
        setClaimError(true);
      } finally {
        if (!controller.signal.aborted) setClaiming(false);
      }
    };
    void claim();
    return () => controller.abort();
  }, [attemptId, authLoading, learner, identityGeneration, navigate]);

  const handleAuth = (register = false) => {
    navigate(register ? ROUTES.REGISTER : ROUTES.LOGIN, { state: { from: location } });
  };

  if (authLoading || (learner
    ? claiming || (!devGate && !claimError && !activeAttemptConflict)
    : !isAuthenticated && (loading || (!data && !error)))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-10">
        <Loading />
      </div>
    );
  }

  if (isAuthenticated && !learner) {
    return <div className="mx-auto max-w-[520px] px-5 py-16"><EmptyState title="Không có quyền làm Placement" description="Chỉ tài khoản User được nhận kết quả Placement." /></div>;
  }

  if (activeAttemptConflict) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[520px] items-center justify-center px-5 py-12">
        <PlacementActiveAttemptConflictCard />
      </div>
    );
  }

  if ((!learner && error) || claimError || !gate) {
    return (
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-4 px-5 py-16">
        <EmptyState
          title="Không tìm thấy bài làm"
          description="Bài làm có thể đã hết hạn hoặc không tồn tại."
        />
        <Link
          to={PLACEMENT_ROUTES.ROOT}
          className="text-label-lg font-semibold text-primary hover:underline"
        >
          Về trang đánh giá đầu vào
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[520px] items-center justify-center px-5 py-12">
      {gate.claimStatus === "CLAIMABLE" ? (
        <PlacementClaimCard onLogin={() => handleAuth()} onRegister={() => handleAuth(true)} claiming={learner && claiming} />
      ) : (
        <PlacementClaimStatusCard claimStatus={gate.claimStatus} />
      )}
    </div>
  );
}
