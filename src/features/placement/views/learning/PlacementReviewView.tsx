import PlacementReviewPageNav from "@features/placement/components/learning/review/PlacementReviewPageNav";
import PlacementReviewQuestionCard from "@features/placement/components/learning/review/PlacementReviewQuestionCard";
import PlacementReviewQuestionGrid from "@features/placement/components/learning/review/PlacementReviewQuestionGrid";
import PlacementReviewSummary from "@features/placement/components/learning/review/PlacementReviewSummary";
import { buildReviewPages } from "@features/placement/components/learning/review/reviewState";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { getPlacementReview } from "@features/placement/services/placement.service";
import { EmptyState, Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { useAuth } from "@shared/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";

export default function PlacementReviewView() {
  const { attemptId = "" } = useParams();
  const { isAuthenticated, isLoading: authLoading, isUser } = useAuth();
  const learner = isAuthenticated && isUser();
  const fetchReview = useCallback(
    (signal: AbortSignal) => getPlacementReview(attemptId, signal),
    [attemptId],
  );
  const { data, loading, error } = useFetch(fetchReview, !authLoading && learner);
  const [currentOrder, setCurrentOrder] = useState(1);
  const questionAreaRef = useRef<HTMLDivElement>(null);
  const pages = useMemo(() => buildReviewPages(data?.questions ?? []), [data?.questions]);
  const foundIndex = pages.findIndex((page) =>
    page.some((question) => question.order === currentOrder),
  );
  const pageIndex = foundIndex < 0 ? 0 : foundIndex;

  const selectOrder = (order: number) => {
    setCurrentOrder(order);
    window.requestAnimationFrame(() => questionAreaRef.current?.focus());
  };

  if (authLoading || (learner && (loading || (!data && !error)))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-10">
        <Loading />
      </div>
    );
  }

  if (!learner || error || !data || pages.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-5 py-16">
        <EmptyState
          title="Không tìm thấy chi tiết bài làm"
          description="Bài làm không tồn tại hoặc bạn chưa có quyền xem."
        />
        <Link
          to={PLACEMENT_ROUTES.attemptResult(attemptId)}
          className="text-label-lg font-semibold text-primary hover:underline"
        >
          Về kết quả
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 lg:px-8">
      <nav aria-label="Đường dẫn trang" className="text-label-sm text-on-surface-variant">
        <Link to={PLACEMENT_ROUTES.ROOT} className="hover:text-primary">
          Đánh giá đầu vào
        </Link>
        <span aria-hidden="true"> / </span>
        <Link to={PLACEMENT_ROUTES.attemptResult(attemptId)} className="hover:text-primary">
          Kết quả
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-on-surface">
          Chi tiết bài làm
        </span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to={PLACEMENT_ROUTES.attemptResult(attemptId)}
            className="inline-flex items-center gap-2 text-label-lg font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Về kết quả
          </Link>
          <h1 className="mt-3 text-headline-lg font-bold text-on-surface">
            Chi tiết bài làm
          </h1>
        </div>
        <PlacementReviewSummary review={data} />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-10">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-7">
          <div ref={questionAreaRef} tabIndex={-1} className="flex flex-col gap-5 outline-none">
            {pages[pageIndex].map((question) => (
              <PlacementReviewQuestionCard
                key={question.id}
                question={question}
                current={question.order === currentOrder}
              />
            ))}
          </div>
          <PlacementReviewPageNav
            pages={pages}
            pageIndex={pageIndex}
            totalQuestions={data.totalQuestions}
            onSelectOrder={selectOrder}
          />
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6 lg:col-span-3">
          <PlacementReviewQuestionGrid
            questions={pages.flat()}
            currentOrder={currentOrder}
            onSelectOrder={selectOrder}
            resultPath={PLACEMENT_ROUTES.attemptResult(attemptId)}
          />
        </aside>
      </div>
    </div>
  );
}
