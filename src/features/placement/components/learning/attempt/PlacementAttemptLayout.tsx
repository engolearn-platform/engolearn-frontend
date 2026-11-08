import { EmptyState, Loading } from "@shared/components";
import { GraduationCap } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, Outlet, useNavigate, useParams } from "react-router";
import { useAuth } from "@shared/hooks/useAuth";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import {
  PlacementAttemptContext,
  type PlacementAttemptContextValue,
} from "@features/placement/hooks/placement-attempt-context";
import { usePlacementAttempt } from "@features/placement/hooks/usePlacementAttempt";
import PlacementAttemptTimer from "./PlacementAttemptTimer";

function AttemptShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-container-low text-on-surface">
      {children}
    </div>
  );
}

function AttemptHeader({
  answeredCount,
  totalQuestions,
  remainingMs,
}: {
  answeredCount: number;
  totalQuestions: number;
  remainingMs: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-3">
          <Link
            to={PLACEMENT_ROUTES.ROOT}
            aria-label="EngoLearn — Đánh giá đầu vào"
            className="flex items-center gap-2.5"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-primary">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="text-headline-sm font-bold tracking-tight">
              Engo<span className="text-primary">Learn</span>
            </span>
          </Link>
          <span className="hidden h-6 w-px bg-outline-variant md:block" aria-hidden="true" />
          <span className="hidden text-label-lg font-semibold text-on-surface-variant md:block">
            Đánh giá đầu vào
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-label-sm font-semibold text-primary sm:inline">
            Đã trả lời {answeredCount}/{totalQuestions}
          </span>
          <PlacementAttemptTimer remainingMs={remainingMs} />
        </div>
      </div>
    </header>
  );
}

function PlacementAttemptSession() {
  const { attemptId = "" } = useParams();
  const { isAuthenticated, isLoading: authLoading, isUser } = useAuth();
  const navigate = useNavigate();
  const autoSubmitAttemptedRef = useRef(false);
  const allowed = !isAuthenticated || isUser();
  const attempt = usePlacementAttempt(attemptId, !authLoading && allowed);
  const {
    data,
    loading,
    error,
    remainingMs,
    isExpired,
    submitting,
    submitResult,
    submit,
  } = attempt;

  useEffect(() => {
    if (!isExpired || autoSubmitAttemptedRef.current) return;
    autoSubmitAttemptedRef.current = true;
    void submit();
  }, [isExpired, submit]);

  useEffect(() => {
    if (!submitResult) return;
    const destination = submitResult.status === "EXPIRED" && !submitResult.claimRequired
      ? PLACEMENT_ROUTES.ROOT
      : submitResult.claimRequired
        ? PLACEMENT_ROUTES.attemptSubmitted(submitResult.attemptId)
        : PLACEMENT_ROUTES.attemptResult(submitResult.attemptId);
    navigate(destination, {
      replace: true,
    });
  }, [submitResult, navigate]);

  if (authLoading || loading || (allowed && !data && !error)) {
    return (
      <AttemptShell>
        <div className="flex flex-1 items-center justify-center p-10">
          <Loading />
        </div>
      </AttemptShell>
    );
  }

  if (!allowed) {
    return <Navigate to={PLACEMENT_ROUTES.ROOT} replace />;
  }

  if (error || !data) {
    return (
      <AttemptShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
          <EmptyState
            title="Không tải được bài kiểm tra"
            description="Vui lòng quay lại trang đánh giá và thử lại."
          />
          <Link
            to={PLACEMENT_ROUTES.ROOT}
            className="text-label-lg font-semibold text-primary hover:underline"
          >
            Về trang đánh giá đầu vào
          </Link>
        </div>
      </AttemptShell>
    );
  }

  if (data.status !== "IN_PROGRESS") {
    const destination = data.status === "EXPIRED" && !data.claimRequired
      ? PLACEMENT_ROUTES.ROOT
      : data.claimRequired
        ? PLACEMENT_ROUTES.attemptSubmitted(data.attemptId)
        : PLACEMENT_ROUTES.attemptResult(data.attemptId);
    return (
      <Navigate to={destination} replace />
    );
  }

  const contextValue: PlacementAttemptContextValue = {
    attempt: data,
    answers: attempt.answers,
    answeredCount: attempt.answeredCount,
    setAnswer: attempt.setAnswer,
    saveError: attempt.saveError,
    remainingMs,
    isExpired,
    submitting,
    submitError: attempt.submitError,
    submitResult,
    submit,
  };

  return (
    <PlacementAttemptContext.Provider value={contextValue}>
      <AttemptShell>
        <AttemptHeader
          answeredCount={attempt.answeredCount}
          totalQuestions={data.totalQuestions}
          remainingMs={remainingMs}
        />
        <main className="flex-1">
          <Outlet />
        </main>
      </AttemptShell>
    </PlacementAttemptContext.Provider>
  );
}

export default function PlacementAttemptLayout() {
  const { isLoading, identityGeneration } = useAuth();
  if (isLoading) {
    return <AttemptShell><div className="flex flex-1 items-center justify-center p-10"><Loading /></div></AttemptShell>;
  }
  return <PlacementAttemptSession key={identityGeneration} />;
}
