import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { EmptyState, Loading } from "@shared/components";
import { ROUTES } from "@shared/constants";
import DailyQuestionCard from "@features/learning-path/components/learning/daily/DailyQuestionCard";
import DailyQuestionNavigator from "@features/learning-path/components/learning/daily/DailyQuestionNavigator";
import DailyResultSummary from "@features/learning-path/components/learning/daily/DailyResultSummary";
import { useLearningPathDayResult } from "@features/learning-path/hooks/useLearningPathDayResult";
import { useLearningPathDetail } from "@features/learning-path/hooks/useLearningPathDetail";
import { formatLearningPathDate } from "@features/learning-path/utils/formatLearningPathDate";

function ResultPage({ pathId, weekNo, dayNo }: { pathId: string; weekNo: string; dayNo: string }) {
  const { data, loading, error, refetch } = useLearningPathDayResult(pathId, weekNo, dayNo);
  const { data: detail } = useLearningPathDetail(pathId);
  const [page, setPage] = useState(1);
  const detailUrl = `${ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(pathId))}?week=${encodeURIComponent(weekNo)}`;
  const questions = data?.questions.slice((page - 1) * 3, page * 3) ?? [];
  return (
    <div className="mx-auto w-full max-w-[1300px] px-5 py-5 pb-24 lg:px-8 lg:py-8 xl:px-10">
      <Link to={detailUrl} className="text-primary hover:underline">Trở về lộ trình</Link>
      {loading ? <div className="mt-5"><Loading size="lg" /></div> : error || !data ? (
        <div className="mt-5">
          <EmptyState title="Không tải được kết quả ngày" description={error?.message ?? "Vui lòng thử lại."} />
          <Button variant="outline" onClick={refetch}>Thử lại</Button>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <h1 className="text-2xl font-bold text-on-surface">Kết quả Ngày {dayNo} · Tuần {weekNo}</h1>
          {detail && <p className="text-sm text-on-surface-variant">Lộ trình ngày {formatLearningPathDate(detail.createdDate)} · Level {detail.level}</p>}
          <DailyResultSummary result={data.result} />
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0">
              <h2 className="mb-3 text-lg font-semibold text-on-surface">Xem lại câu trả lời</h2>
              <div className="space-y-4">
                {questions.map((question) => <DailyQuestionCard key={question.number} question={question} mode="review" selectedIndex={data.answers[question.number]} />)}
              </div>
              <div className="mt-4 flex justify-between gap-3">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Trang trước</Button>
                <Button disabled={page === 4} onClick={() => setPage(page + 1)}>Trang tiếp</Button>
              </div>
            </section>
            <DailyQuestionNavigator mode="review" currentPage={page} questions={data.questions} answers={data.answers} onSelectPage={setPage} returnTo={detailUrl} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearningPathDayResultView() {
  const { pathId = "", weekNo = "", dayNo = "" } = useParams();
  return <ResultPage key={`${pathId}:${weekNo}:${dayNo}`} pathId={pathId} weekNo={weekNo} dayNo={dayNo} />;
}
