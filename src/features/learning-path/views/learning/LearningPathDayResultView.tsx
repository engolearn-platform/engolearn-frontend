import { Link, useLocation, useParams } from "react-router";
import { EmptyState } from "@shared/components";
import { ROUTES } from "@shared/constants";
import DailyResultSummary from "@features/learning-path/components/learning/daily/DailyResultSummary";
import type { SubmitDayResult } from "@features/learning-path/types/learning-path-day.types";

export default function LearningPathDayResultView() {
  const { pathId = "", weekNo = "", dayNo = "" } = useParams();
  const location = useLocation();
  const candidate = (location.state as { result?: SubmitDayResult } | null)?.result;
  const result = candidate?.pathId === pathId && candidate.weekNo === Number(weekNo) && candidate.dayNo === Number(dayNo) ? candidate : null;
  const detailUrl = ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(pathId));
  return (
    <div className="mx-auto w-full max-w-[1300px] px-5 py-5 lg:px-8 lg:py-8 xl:px-10">
      <Link to={detailUrl} className="text-primary hover:underline">Trở về lộ trình</Link>
      {result ? (
        <div className="mt-5 space-y-5">
          <h1 className="text-2xl font-bold text-on-surface">Kết quả Ngày {dayNo} · Tuần {weekNo}</h1>
          <DailyResultSummary result={result} />
          <p className="text-sm text-on-surface-variant">Phần xem lại đáp án và giải thích đang được phát triển.</p>
        </div>
      ) : (
        <EmptyState title="Kết quả ngày chưa khả dụng" description="Chức năng xem lại kết quả luyện tập đang được phát triển." />
      )}
    </div>
  );
}
