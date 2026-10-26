import { useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { ROUTES } from "@shared/constants";
import { dailyQuestions, sampleAnswersForDay } from "@features/learning-path/data/learningPathDay.mock";
import type { DailyResultRouteState } from "@features/learning-path/types/learning-path-day.types";
import DailyQuestionCard from "@features/learning-path/components/learning/daily/DailyQuestionCard";
import DailyQuestionNavigator from "@features/learning-path/components/learning/daily/DailyQuestionNavigator";
import DailyResultSummary from "@features/learning-path/components/learning/daily/DailyResultSummary";

export default function LearningPathDayResultView() {
  const { pathId = "demo-active", weekNo = "1", dayNo = "3" } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const routeState = location.state as DailyResultRouteState | null;
  const submittedFromPractice = routeState?.submittedFromPractice === true;
  const completedPreview = pathId === "demo-completed" || searchParams.get("preview") === "completed";
  const answers = submittedFromPractice
    ? routeState.answers
    : sampleAnswersForDay(Number(weekNo), Number(dayNo), completedPreview);
  const pageQuestions = dailyQuestions.slice((page - 1) * 3, page * 3);
  const detailUrl = `${ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(pathId))}${searchParams.get("preview") === "completed" ? "?preview=completed" : ""}`;

  return (
    <div className="mx-auto w-full max-w-[1300px] px-5 py-5 pb-24 lg:px-8 lg:py-8 xl:px-10">
      <Link to={detailUrl} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Trở về Lộ trình học tập
      </Link>

      <header className="mt-5">
        <h1 className="text-2xl font-bold text-on-surface">Kết quả Ngày {dayNo}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Lộ trình ngày 09/10/2026 · Tuần {weekNo} · Level A1</p>
      </header>

      <div className="mt-5">
        <DailyResultSummary questions={dailyQuestions} answers={answers} />
      </div>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-lg font-semibold text-on-surface">Chi tiết câu hỏi</h2>
            <span className="text-sm text-primary">Câu {pageQuestions[0].number}{pageQuestions.length > 1 ? `–${pageQuestions[pageQuestions.length - 1].number}` : ""} trên 10</span>
          </div>
          <span className="text-xs text-on-surface-variant">Đáp án &amp; giải thích chi tiết</span>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <div className="space-y-4">
              {pageQuestions.map((question) => (
                <DailyQuestionCard
                  key={question.number}
                  question={question}
                  mode="review"
                  selectedIndex={answers[question.number]}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
              <Button type="button" variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-xl">
                <ChevronLeft className="size-4" /> Trước
              </Button>
              <span className="text-sm text-on-surface-variant">Trang {page}/4 · Câu {pageQuestions[0].number}{pageQuestions.length > 1 ? `–${pageQuestions[pageQuestions.length - 1].number}` : ""} trên 10</span>
              <Button type="button" disabled={page === 4} onClick={() => setPage((current) => current + 1)} className="rounded-xl">
                Tiếp theo <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
          <DailyQuestionNavigator
            mode="review"
            currentPage={page}
            questions={dailyQuestions}
            answers={answers}
            onSelectPage={setPage}
            returnTo={detailUrl}
          />
        </div>
      </section>
    </div>
  );
}
