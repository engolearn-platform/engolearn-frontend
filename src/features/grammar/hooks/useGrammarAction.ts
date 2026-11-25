import { useEffect, useRef, useState } from "react";
import { useAuth } from "@shared/hooks";
import type { HttpError } from "@shared/services";

export function useGrammarAction() {
  const { refetch } = useAuth();
  const controller = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function run<T>(request: (signal: AbortSignal) => Promise<T>, onSuccess: (value: T) => void) {
    if (controller.current) return;
    const attempt = new AbortController();
    controller.current = attempt;
    setPending(true);
    setError(null);
    try {
      const result = await request(attempt.signal);
      if (!attempt.signal.aborted) onSuccess(result);
    } catch (error) {
      if (!attempt.signal.aborted) {
        if (error instanceof Error && "status" in error && error.status === 401) refetch();
        else setError(error instanceof Error ? error : new Error("Không thể thực hiện yêu cầu."));
      }
    } finally {
      controller.current = null;
      if (!attempt.signal.aborted) setPending(false);
    }
  }

  return { run, pending, error };
}
