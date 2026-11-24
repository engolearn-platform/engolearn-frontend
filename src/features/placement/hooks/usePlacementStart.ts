import { useCallback, useState } from "react";
import { startPlacementAttempt } from "../services/placement.service";
import type { PlacementStartResult } from "../types/placement.types";

const GENERIC_ERROR = "Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.";

export function usePlacementStart() {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (): Promise<PlacementStartResult | null> => {
    setStarting(true);
    setError(null);

    try {
      return await startPlacementAttempt();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : GENERIC_ERROR);
      return null;
    } finally {
      setStarting(false);
    }
  }, []);

  return { start, starting, error };
}
