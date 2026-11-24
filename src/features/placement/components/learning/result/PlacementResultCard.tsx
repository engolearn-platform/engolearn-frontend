import { Button } from "@/core/components/shadcn/button";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import type { PlacementResult } from "@features/placement/types/placement-result.types";
import { CheckCircle2, CircleX, PauseCircle, Sparkles, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@shared/constants";
import { activatePlacementLearning } from "@features/placement/services/placement.service";

interface PlacementResultCardProps {
  result: PlacementResult;
}

export default function PlacementResultCard({ result }: PlacementResultCardProps) {
  // Presentation only: the service supplies score and level. No grading here.
  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const navigate = useNavigate();
  const [learningPending, setLearningPending] = useState(false);
  const [learningError, setLearningError] = useState<string | null>(null);
  const learningLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const startLearning = async () => {
    if (learningLock.current) return;
    learningLock.current = true;
    setLearningPending(true);
    setLearningError(null);
    try {
      // Integration boundary: Topic reads User's profile, so await server promotion before entering the catalog.
      await activatePlacementLearning(result.attemptId);
      if (mounted.current) void navigate(ROUTES.TOPICS);
    } catch {
      if (mounted.current) setLearningError("Chưa thể cập nhật trình độ học. Vui lòng thử lại.");
    } finally {
      learningLock.current = false;
      if (mounted.current) setLearningPending(false);
    }
  };

  return (
    <article className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm sm:p-8">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-primary" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="flex flex-col justify-between rounded-2xl bg-surface-container-low p-5 sm:p-6">
          <div className="flex items-center justify-between text-label-sm font-semibold text-on-surface-variant">
            <h2>Điểm của bạn</h2>
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <p
            className="mt-4 flex items-baseline gap-2 font-bold text-on-surface"
            aria-label={`Điểm ${result.score} trên ${result.totalQuestions} câu`}
          >
            <span className="text-4xl">{result.score}</span>
            <span className="text-headline-sm text-on-surface-variant">
              / {result.totalQuestions}
            </span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <progress
              value={result.score}
              max={result.totalQuestions}
              aria-label="Tỷ lệ câu trả lời đúng"
              className="h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-surface-container-highest [&::-webkit-progress-value]:bg-primary"
            />
            <span className="text-label-sm text-on-surface-variant">
              {percentage}%
            </span>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-2xl bg-primary-fixed/20 p-5 sm:p-6">
          <div className="flex items-center justify-between text-label-sm font-semibold text-on-surface-variant">
            <h2>Trình độ đề xuất</h2>
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-4">
            <span className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-headline-lg font-bold text-on-primary">
              {result.placementLevel}
            </span>
          </p>
          <p className="mt-3 text-label-sm text-on-surface-variant">
            Mức khởi đầu tham khảo để lựa chọn nội dung học phù hợp.
          </p>
        </section>
      </div>

      {result.summary ? (
        <div className="mt-8 grid grid-cols-1 gap-3 border-t border-outline-variant pt-8 sm:grid-cols-3">
          <p className="flex items-center gap-2 rounded-xl bg-surface-container-low p-4 text-label-lg">
            <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
            Đúng: <strong>{result.score} câu</strong>
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-surface-container-low p-4 text-label-lg">
            <CircleX className="size-5 shrink-0 text-error" aria-hidden="true" />
            Sai: <strong>{result.summary.incorrectCount} câu</strong>
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-surface-container-low p-4 text-label-lg">
            <PauseCircle className="size-5 shrink-0 text-on-surface-variant" aria-hidden="true" />
            Bỏ trống: <strong>{result.summary.unansweredCount} câu</strong>
          </p>
        </div>
      ) : null}

      <div className="mt-8 border-t border-outline-variant pt-8 text-center">
        <p className="text-body-md text-on-surface-variant">
          Dựa trên kết quả này, bạn có thể bắt đầu với các nội dung học phù hợp
          trình độ {result.placementLevel}.
        </p>
        <div className="mx-auto mt-6 flex max-w-xs flex-col items-stretch gap-3">
          <Button type="button" size="lg" disabled={learningPending} onClick={startLearning} className="rounded-xl">
            {learningPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {learningPending ? "Đang chuẩn bị…" : "Bắt đầu học"}
          </Button>
          {learningError && <p role="alert" className="text-label-sm text-error">{learningError}</p>}
          <Button
            asChild
            size="lg"
            variant="link"
            className="rounded-xl"
          >
            <Link to={PLACEMENT_ROUTES.attemptReview(result.attemptId)}>
              Xem chi tiết bài làm
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
