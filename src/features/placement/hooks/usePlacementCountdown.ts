import { useEffect, useMemo, useState } from "react";

function computeRemaining(
  deadlineAt: string | null,
  serverOffsetMs: number,
  nowMs: number,
): number {
  if (!deadlineAt) return 0;

  const deadline = new Date(deadlineAt).getTime();
  if (Number.isNaN(deadline)) return 0;

  return Math.max(0, deadline - (nowMs + serverOffsetMs));
}

/**
 * Countdown driven by `deadlineAt` + the server clock at load time, so a
 * skewed client clock cannot extend the 15-minute window (BR-F1.4).
 *
 * The remaining value is derived during render (not stored in state) so the
 * first render after the attempt loads can never look "expired" and trigger
 * a spurious auto-submit.
 */
export function usePlacementCountdown(
  deadlineAt: string | null,
  serverNow: string | null,
): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  const serverOffsetMs = useMemo(() => {
    if (!deadlineAt || !serverNow) return 0;

    const serverMs = new Date(serverNow).getTime();
    if (Number.isNaN(serverMs)) return 0;

    return serverMs - Date.now();
  }, [deadlineAt, serverNow]);

  useEffect(() => {
    if (!deadlineAt) return;

    const tick = () => setNowMs(Date.now());
    tick();

    const timer = window.setInterval(tick, 1000);
    const handleVisibility = () => {
      if (!document.hidden) tick();
    };

    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [deadlineAt, serverNow]);

  return computeRemaining(deadlineAt, serverOffsetMs, nowMs);
}
