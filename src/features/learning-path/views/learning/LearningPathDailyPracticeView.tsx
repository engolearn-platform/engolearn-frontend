import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Clock3 } from "lucide-react";
import { ROUTES, learningPathDayPath } from "@shared/constants";
import { dailyQuestions, sampleSavedAnswersThroughPageThree } from "@features/learning-path/data/learningPathDay.mock";
import type { DailyAnswers, DailyResultRouteState } from "@features/learning-path/types/learning-path-day.types";
import DailyQuestionCard from "@features/learning-path/components/learning/daily/DailyQuestionCard";
import DailyQuestionNavigator from "@features/learning-path/components/learning/daily/DailyQuestionNavigator";
import DailyPracticeActionBar from "@features/learning-path/components/learning/daily/DailyPracticeActionBar";

function initialPageFromQuery(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= 4 ? page : 1;
}

function initialSavedAnswers(page: number): DailyAnswers {
  return Object.fromEntries(
    Object.entries(sampleSavedAnswersThroughPageThree).filter(([number]) => Number(number) < (page - 1) * 3 + 1),
  );
}

function initialDraftAnswers(page: number): DailyAnswers {
  if (page === 2) return { 4: 1, 5: 2 };
  if (page === 4) return { 10: 2 };
  return {};
}

export default function LearningPathDailyPracticeView() {
  const { pathId = "demo-active", weekNo = "2", dayNo = "1" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedPage = initialPageFromQuery(searchParams.get("page"));
  const [page, setPage] = useState(requestedPage);
  const [savedAnswers, setSavedAnswers] = useState<DailyAnswers>(() => initialSavedAnswers(requestedPage));
  const [draftAnswers, setDraftAnswers] = useState<DailyAnswers>(() => initialDraftAnswers(requestedPage));
  const pageQuestions = dailyQuestions.slice((page - 1) * 3, page * 3);
  const answeredCount = pageQuestions.filter((question) => draftAnswers[question.number] !== undefined).length;
  const detailUrl = `${ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(pathId))}${searchParams.get("preview") === "completed" ? "?preview=completed" : ""}`;

  const continuePractice = () => {
    if (answeredCount !== pageQuestions.length) return;
    const updatedAnswers = { ...savedAnswers, ...draftAnswers };
    setSavedAnswers(updatedAnswers);
    setDraftAnswers({});

    if (page === 4) {
      const resultPath = learningPathDayPath(pathId, Number(weekNo), Number(dayNo), "result");
      const previewQuery = searchParams.get("preview") === "completed" ? "?preview=completed" : "";
      const state: DailyResultRouteState = { answers: updatedAnswers, submittedFromPractice: true };
      navigate(`${resultPath}${previewQuery}`, { state });
    } else {
      setPage((current) => current + 1);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1300px] px-5 py-5 pb-24 lg:px-8 lg:py-8 xl:px-10">
      <Link to={detailUrl} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Thoát luyện tập
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Luyện tập Ngày {dayNo}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Lộ trình ngày 09/10/2026 · Tuần {weekNo} · Level A1</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary-container bg-secondary-container/30 px-3 py-1.5 text-xs font-medium text-on-secondary-container">
          <Clock3 className="size-3.5" aria-hidden="true" />
          Tự đóng lúc 00:00 hôm nay
        </span>
      </header>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <p className="mb-3 text-sm font-medium text-on-surface-variant">
            Câu {pageQuestions[0].number}{pageQuestions.length > 1 ? ` – ${pageQuestions[pageQuestions.length - 1].number}` : ""} trên 10
          </p>
          <div className="space-y-4">
            {pageQuestions.map((question) => (
              <DailyQuestionCard
                key={question.number}
                question={question}
                mode="practice"
                selectedIndex={draftAnswers[question.number]}
                onSelect={(index) => setDraftAnswers((current) => ({ ...current, [question.number]: index }))}
              />
            ))}
          </div>
          <div className="mt-4">
            <DailyPracticeActionBar
              page={page}
              firstQuestion={pageQuestions[0].number}
              lastQuestion={pageQuestions[pageQuestions.length - 1].number}
              questionCount={pageQuestions.length}
              answeredCount={answeredCount}
              onContinue={continuePractice}
            />
          </div>
        </section>
        <DailyQuestionNavigator
          mode="practice"
          currentPage={page}
          questions={dailyQuestions}
          answers={savedAnswers}
          draftAnswers={draftAnswers}
        />
      </div>
    </div>
  );
}
