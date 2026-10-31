import { useCallback, useEffect, useRef, useState } from "react";
import { useFetch } from "@shared/hooks";
import { subscriptionService } from "@features/subscription/services/subscription.service";

export const usePlans = () => useFetch(subscriptionService.plans);
export const useMySubscription = () => useFetch(subscriptionService.me);
export const useQuotaUsage = () => useFetch(subscriptionService.usage);

// An unresolved intent survives route changes and explicit retries. Never replace
// its key after a transport failure: the server may already have committed it.
const trialIntents = new Map<string, string>();
function intentKey(userId: string): string {
  const existing = trialIntents.get(userId);
  if (existing) return existing;
  const storageKey = `engolearn.subscription.trial.${userId}`;
  let key: string | null = null;
  try { key = sessionStorage.getItem(storageKey); } catch { /* Runtime memory remains available. */ }
  if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) key = crypto.randomUUID();
  trialIntents.set(userId, key);
  try { sessionStorage.setItem(storageKey, key); } catch { /* Retain the same key in runtime memory. */ }
  return key;
}
export function useTrialActivation(userId: string, onConfirmed: () => void) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ message: string; code?: string; ambiguous: boolean } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; request.current?.abort(); };
  }, []);
  const activate = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setFailure(null);
    try {
      await subscriptionService.activateTrial(intentKey(userId), controller.signal);
      if (!alive.current || controller.signal.aborted) return;
      setConfirmed(true);
      onConfirmed();
    } catch (error) {
      if (!alive.current || controller.signal.aborted) return;
      const err = error as Error & { status?: number; code?: string };
      setFailure({ message: err.code && err instanceof Error ? err.message : "Chưa thể xác nhận kết quả từ máy chủ. Vui lòng kiểm tra kết nối và thử lại cùng yêu cầu.", code: err.code, ambiguous: !err.status || err.status >= 500 });
    } finally {
      if (request.current === controller) request.current = null;
      if (alive.current) setPending(false);
    }
  }, [onConfirmed, userId]);
  return { activate, pending, failure, confirmed };
}
