import PlacementChecklist from "@features/placement/components/learning/PlacementChecklist";
import PlacementGuestNotice from "@features/placement/components/learning/PlacementGuestNotice";
import PlacementInfoGrid from "@features/placement/components/learning/PlacementInfoGrid";
import PlacementOverviewCard from "@features/placement/components/learning/PlacementOverviewCard";
import PlacementStartCta from "@features/placement/components/learning/PlacementStartCta";
import PlacementUserStartContent from "@features/placement/components/learning/user/PlacementUserStartContent";
import {
  PLACEMENT_INTRO_INFO,
  PLACEMENT_INTRO_RULES,
  PLACEMENT_ROUTES,
} from "@features/placement/constants";
import { usePlacementStart } from "@features/placement/hooks/usePlacementStart";
import { useAuth } from "@shared/hooks/useAuth";
import { Loading } from "@shared/components";
import { useNavigate } from "react-router";

export default function PlacementStartView() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isUser } = useAuth();
  const { start, starting, error } = usePlacementStart();

  const handleStart = async () => {
    if (isLoading || (isAuthenticated && !isUser())) return;
    const attempt = await start();
    if (!attempt) return;
    if (attempt.status === "IN_PROGRESS") {
      navigate(PLACEMENT_ROUTES.attempt(attempt.attemptId));
    } else if (attempt.status === "EXPIRED") {
      navigate(PLACEMENT_ROUTES.ROOT);
    } else {
      navigate(attempt.claimRequired
        ? PLACEMENT_ROUTES.attemptSubmitted(attempt.attemptId)
        : PLACEMENT_ROUTES.attemptResult(attempt.attemptId));
    }
  };

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;

  if (isAuthenticated && isUser()) {
    return <PlacementUserStartContent onStart={handleStart} starting={starting} error={error} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-10">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">
          Kiểm tra trình độ tiếng Anh
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Khám phá mức khởi đầu phù hợp trước khi bắt đầu học.
        </p>
      </div>

      <PlacementOverviewCard>
        <PlacementInfoGrid
          title="Thông tin bài kiểm tra"
          items={PLACEMENT_INTRO_INFO}
        />

        <div
          className="border-t border-outline-variant/60"
          aria-hidden="true"
        />

        <PlacementChecklist
          title="Trước khi bắt đầu"
          rules={PLACEMENT_INTRO_RULES}
        />

        {!isAuthenticated ? (
          <PlacementGuestNotice message="Bạn chưa cần đăng nhập. Hoàn thành bài kiểm tra trước, sau đó đăng nhập hoặc tạo tài khoản để xem kết quả." />
        ) : null}

        {isAuthenticated && !isUser() ? (
          <p role="status" className="text-label-lg text-on-surface-variant">
            Chỉ tài khoản User được làm bài đánh giá đầu vào.
          </p>
        ) : (
          <PlacementStartCta
            label="Bắt đầu bài kiểm tra"
            footnote="Thời gian bắt đầu tính ngay khi bạn vào làm bài."
            onStart={handleStart}
            starting={starting}
            error={error}
          />
        )}
      </PlacementOverviewCard>
    </div>
  );
}
