import { useCallback, useEffect, useRef, useState } from "react";
import { learningPathCreationApi } from "@features/assessment/services/learningPathCreationApi";
import type { CreateLearningPathRequest } from "@features/assessment/types/learning-path-creation.types";
import type { HttpError } from "@shared/services/http.service";

export function useCreateLearningPath() {
  const controllerRef = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const create = useCallback(async (request: CreateLearningPathRequest) => {
    if (controllerRef.current) return { kind: "busy" as const };
    const controller = new AbortController();
    controllerRef.current = controller;
    setPending(true);
    setError(null);
    try {
      const result = await learningPathCreationApi.create(request, controller.signal);
      if (controller.signal.aborted) return null;
      return { kind: "created" as const, pathId: result.pathId };
    } catch (cause) {
      if (controller.signal.aborted) return null;
      if ((cause as HttpError).status === 409) {
        setError("Đề xuất lộ trình đã thay đổi. Vui lòng xem lại đề xuất mới và xác nhận lại trước khi tạo.");
        return { kind: "conflict" as const };
      }
      setError(cause instanceof Error ? cause.message : "Chưa tạo được lộ trình. Vui lòng thử lại.");
      return null;
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }, []);

  return { create, pending, error, clearError: () => setError(null) };
}
