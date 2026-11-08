import PlacementChecklist from "@features/placement/components/learning/PlacementChecklist";
import PlacementInfoGrid from "@features/placement/components/learning/PlacementInfoGrid";
import PlacementStartCta from "@features/placement/components/learning/PlacementStartCta";
import { PLACEMENT_INTRO_INFO, PLACEMENT_INTRO_RULES } from "@features/placement/constants";
import { Link, useNavigate } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { PLACEMENT_ROUTES } from "@features/placement/constants";
import { usePlacementCurrentAttempt } from "@features/placement/hooks/usePlacementCurrentAttempt";
import PlacementResumeCard from "./PlacementResumeCard";

export default function PlacementUserStartContent({ onStart, starting, error }: {
  onStart: () => void;
  starting: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();
  const { data: current, loading, error: lookupError, refetch, remainingMs } = usePlacementCurrentAttempt();
  const hasResult = current?.status === "SUBMITTED" || current?.status === "AUTO_SUBMITTED";
  const canStart = !loading && !lookupError && (!current || current.status === "EXPIRED");
  const continueAttempt = () => {
    if (!current) return;
    navigate(`${PLACEMENT_ROUTES.attempt(current.attemptId)}?resumeQuestion=${current.resumeOrder ?? 1}`);
  };
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 lg:py-10">
      <div className="flex flex-col gap-2">
        <nav aria-label="Đường dẫn trang" className="flex items-center gap-2 text-label-sm text-on-surface-variant">
          <Link to="/" className="hover:text-primary">Trang chủ</Link><span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-on-surface">Kiểm tra trình độ</span>
        </nav>
        <h1 className="text-headline-lg font-bold text-on-surface">Kiểm tra trình độ tiếng Anh</h1>
        <p className="text-body-md text-on-surface-variant">{current?.status === "IN_PROGRESS" ? "Tiếp tục bài kiểm tra để hoàn thành đánh giá trình độ của bạn." : hasResult ? "Xem lại kết quả đánh giá trình độ của bạn." : "Khám phá mức khởi đầu phù hợp trước khi bắt đầu học."}</p>
      </div>
      {loading ? <p role="status" className="text-body-md text-on-surface-variant">Đang kiểm tra bài làm của bạn…</p> : lookupError ? (
        <div role="alert" className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
          <p>Chưa kiểm tra được bài làm hiện tại. Vui lòng thử lại trước khi bắt đầu.</p>
          <Button variant="outline" onClick={refetch}>Thử lại</Button>
        </div>
      ) : current?.status === "IN_PROGRESS" ? (
        <PlacementResumeCard attempt={current} remainingMs={remainingMs} onContinue={continueAttempt} />
      ) : hasResult && current ? (
        <section className="space-y-4 rounded-2xl border border-learning-mint-border bg-learning-nav-active p-5">
          <h2 className="text-headline-sm font-semibold">Bạn đã hoàn thành bài kiểm tra</h2>
          <p className="text-body-md text-on-surface-variant">{current.claimRequired ? "Tiếp tục để gắn bài làm và xem kết quả theo tài khoản của bạn." : "Kết quả đã được lưu trong tài khoản của bạn."}</p>
          <Button className="min-h-12" onClick={() => navigate(current.claimRequired ? PLACEMENT_ROUTES.attemptSubmitted(current.attemptId) : PLACEMENT_ROUTES.attemptResult(current.attemptId))}>Xem kết quả</Button>
        </section>
      ) : current?.status === "EXPIRED" ? <p role="status" className="rounded-2xl bg-learning-note p-5 text-learning-note-ink">Bài trước đã hết thời gian và chưa có đáp án. Bạn có thể bắt đầu bài kiểm tra mới.</p> : null}
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm sm:p-8">
        <PlacementInfoGrid title="Thông tin bài kiểm tra" items={PLACEMENT_INTRO_INFO} />
        <div className="border-t border-outline-variant/60" aria-hidden="true" />
        <PlacementChecklist title="Trước khi bắt đầu" rules={PLACEMENT_INTRO_RULES} />
        <div className="border-t border-outline-variant/60" aria-hidden="true" />
        {canStart && <PlacementStartCta label="Bắt đầu bài kiểm tra" footnote="Thời gian bắt đầu tính ngay khi bạn vào làm bài." onStart={onStart} starting={starting} error={error} />}
      </section>
    </div>
  );
}
