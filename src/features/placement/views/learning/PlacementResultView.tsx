import PlacementResultCard from "@features/placement/components/learning/result/PlacementResultCard";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { getPlacementResult } from "@features/placement/services/placement.service";
import { EmptyState, Loading } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { useAuth } from "@shared/hooks/useAuth";
import { useCallback } from "react";
import { Link, useParams } from "react-router";

export default function PlacementResultView() {
  const { attemptId = "" } = useParams();
  const { isAuthenticated, isLoading: authLoading, isUser } = useAuth();
  const learner = isAuthenticated && isUser();
  const fetchResult = useCallback(
    (signal: AbortSignal) => getPlacementResult(attemptId, signal),
    [attemptId],
  );
  const { data, loading, error } = useFetch(fetchResult, !authLoading && learner);

  if (authLoading || (learner && (loading || (!data && !error)))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-10">
        <Loading />
      </div>
    );
  }

  if (!learner || error || !data) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-5 py-16">
        <EmptyState
          title="Không tìm thấy kết quả"
          description="Kết quả không tồn tại hoặc bạn chưa có quyền xem."
        />
        <Link
          to={PLACEMENT_ROUTES.ROOT}
          className="text-label-lg font-semibold text-primary hover:underline"
        >
          Về trang đánh giá đầu vào
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-10">
      <nav aria-label="Đường dẫn trang" className="text-label-sm text-on-surface-variant">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span aria-hidden="true"> / </span>
        <Link to={PLACEMENT_ROUTES.ROOT} className="hover:text-primary">
          Kiểm tra trình độ
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-on-surface">
          Kết quả
        </span>
      </nav>
      <div className="mb-8 mt-4">
        <h1 className="text-headline-lg font-bold text-on-surface">
          Kết quả kiểm tra trình độ
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
          Hoàn thành {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(data.completedAt))}
          <span aria-hidden="true">·</span>
          <span className="rounded-full bg-primary-fixed/40 px-2.5 py-0.5 font-semibold text-on-primary-fixed-variant">{data.status === "AUTO_SUBMITTED" ? "Tự động nộp" : "Đã nộp"}</span>
        </p>
      </div>
      <PlacementResultCard result={data} />
    </div>
  );
}
