import { useCallback, useEffect, useRef } from "react";
import { getCurrentPlacementAttempt } from "@features/placement/services/placement.service";
import { useFetch } from "@shared/hooks";
import { usePlacementCountdown } from "./usePlacementCountdown";

export function usePlacementCurrentAttempt() {
  const fetchCurrent = useCallback((signal: AbortSignal) => getCurrentPlacementAttempt(signal), []);
  const state = useFetch(fetchCurrent);
  const { data, loading, refetch } = state;
  const remainingMs = usePlacementCountdown(data?.deadlineAt ?? null, data?.serverNow ?? null);
  const resolvedExpiry = useRef<string | null>(null);

  useEffect(() => {
    const refresh = () => { if (!document.hidden) refetch(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refetch]);

  useEffect(() => {
    if (remainingMs > 0) resolvedExpiry.current = null;
    if (!loading && data?.status === "IN_PROGRESS" && remainingMs <= 0 && resolvedExpiry.current !== data.attemptId) {
      resolvedExpiry.current = data.attemptId;
      refetch();
    }
  }, [remainingMs, data, loading, refetch]);

  return { ...state, remainingMs };
}
