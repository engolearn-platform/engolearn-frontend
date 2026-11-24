import { useEffect, useMemo, useState } from "react";

/** Server time anchors the budget; wall-clock changes must not consume it. */
export function usePlacementCountdown(
  deadlineAt: string | null,
  serverNow: string | null,
): number {
  const [nowMs, setNowMs] = useState(() => performance.now());
  const anchor = useMemo(() => {
    const deadline = deadlineAt ? new Date(deadlineAt).getTime() : NaN;
    const server = serverNow ? new Date(serverNow).getTime() : NaN;
    return {
      sampledAt: performance.now(),
      remainingMs: Number.isFinite(deadline) && Number.isFinite(server)
        ? Math.max(0, deadline - server) : 0,
    };
  }, [deadlineAt, serverNow]);

  useEffect(() => {
    if (!deadlineAt || !serverNow) return;
    const tick = () => setNowMs(performance.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    const handleVisibility = () => { if (!document.hidden) tick(); };
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [deadlineAt, serverNow]);

  // A new server anchor can arrive before the interval state catches up.
  return Math.max(0, anchor.remainingMs - Math.max(0, nowMs - anchor.sampledAt));
}
