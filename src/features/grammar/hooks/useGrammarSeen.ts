import { useEffect, useRef, useState } from "react";
import { useAuth } from "@shared/hooks";
import type { HttpError } from "@shared/services";
import { grammarLearning } from "@features/grammar/services/grammar-learning.service";

export function useGrammarSeen(topicId: string, lessonId: string, contentVersion: number) {
  const { refetch } = useAuth();
  const contentRef = useRef<HTMLOListElement>(null);
  const painted = useRef(false);
  const [seen, setSeen] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const content = contentRef.current?.firstElementChild;
    if (!content || seen) return;
    const controller = new AbortController();
    let visible = false;
    let frame = 0;
    let sent = false;

    function recordAfterPaint() {
      cancelAnimationFrame(frame);
      if (sent || (!visible && !painted.current) || document.visibilityState !== "visible") return;
      // Wait for a browser paint after the first block becomes visible.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (sent || (!visible && !painted.current) || document.visibilityState !== "visible") return;
          painted.current = true;
          sent = true;
          void grammarLearning.markSeen(topicId, lessonId, contentVersion, controller.signal)
            .then(() => {
              if (!controller.signal.aborted) setSeen(true);
            })
            .catch((reason: unknown) => {
              if (!controller.signal.aborted) {
                if (reason instanceof Error && "status" in reason && reason.status === 401) refetch();
                else setError(reason instanceof Error ? reason : new Error("Không ghi nhận được lượt xem."));
              }
            });
        });
      });
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      recordAfterPaint();
    });
    observer.observe(content);
    recordAfterPaint();
    document.addEventListener("visibilitychange", recordAfterPaint);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", recordAfterPaint);
      cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [attempt, contentVersion, lessonId, refetch, seen, topicId]);

  function retry() {
    setError(null);
    setAttempt((value) => value + 1);
  }

  return { contentRef, seen, error, retry };
}
