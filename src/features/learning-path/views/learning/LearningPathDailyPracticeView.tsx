import { useEffect, useState } from "react";
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

interface PracticeRecord {
  answers: DailyAnswers;
  page: number;
  startedDate: string;
  submitted: boolean;
}

function todayInVietnam(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function nextMidnightInVietnam(startedDate: string): number {
  return Date.parse(`${startedDate}T00:00:00+07:00`) + 24 * 60 * 60 * 1000;
}

function sampleAnswers(page: number): DailyAnswers {
  const previous = Object.fromEntries(
    Object.entries(sampleSavedAnswersThroughPageThree).filter(([number]) => Number(number) < (page - 1) * 3 + 1),
  );
  if (page === 2) return { ...previous, 4: 1, 5: 2 };
  if (page === 4) return { ...previous, 10: 2 };
  return previous;
}

function readPractice(storageKey: string, requestedPage: number): PracticeRecord {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<PracticeRecord>;
      if (stored.answers && typeof stored.startedDate === "string"
          && /^\d{4}-\d{2}-\d{2}$/.test(stored.startedDate)) {
        const answers = Object.fromEntries(
          Object.entries(stored.answers).filter(([number, option]) =>
            Number.isInteger(Number(number)) && Number(number) >= 1 && Number(number) <= 10
            && Number.isInteger(option) && option >= 0 && option <= 3,
          ),
        );
        const page = stored.page;
        return {
          answers,
          page: typeof page === "number" && Number.isInteger(page) && page >= 1 && page <= 4 ? page : 1,
          startedDate: stored.startedDate,
          submitted: stored.submitted === true,
        };
      }
    }
  } catch {
    // The preview remains usable when browser storage is unavailable.
  }
  return { answers: sampleAnswers(requestedPage), page: requestedPage, startedDate: todayInVietnam(), submitted: false };
}

function writePractice(storageKey: string, record: PracticeRecord): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // The current session can continue without browser storage.
  }
}

interface PracticeSessionProps {
  pathId: string;
  weekNo: string;
  dayNo: string;
  storageKey: string;
  requestedPage: number;
  completedPreview: boolean;
}

function PracticeSession({ pathId, weekNo, dayNo, storageKey, requestedPage, completedPreview }: PracticeSessionProps) {
  const navigate = useNavigate();
  const [record, setRecord] = useState<PracticeRecord>(() => readPractice(storageKey, requestedPage));
  const pageQuestions = dailyQuestions.slice((record.page - 1) * 3, record.page * 3);
  const answeredCount = pageQuestions.filter((question) => record.answers[question.number] !== undefined).length;
  const previewQuery = completedPreview ? "?preview=completed" : "";
  const detailUrl = `${ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(pathId))}${previewQuery}`;
  const resultUrl = `${learningPathDayPath(pathId, Number(weekNo), Number(dayNo), "result")}${previewQuery}`;

  useEffect(() => {
    writePractice(storageKey, record);
  }, [storageKey, record]);

  useEffect(() => {
    const remaining = nextMidnightInVietnam(record.startedDate) - Date.now();
    if (record.submitted || remaining <= 0) {
      if (!record.submitted) writePractice(storageKey, { ...record, submitted: true });
      const state: DailyResultRouteState = { answers: record.answers, submittedFromPractice: true };
      navigate(resultUrl, { replace: true, state });
      return;
    }
    const timer = window.setTimeout(() => {
      writePractice(storageKey, { ...record, submitted: true });
      const state: DailyResultRouteState = { answers: record.answers, submittedFromPractice: true };
      navigate(resultUrl, { replace: true, state });
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [navigate, record, resultUrl, storageKey]);

  const chooseAnswer = (questionNumber: number, optionIndex: number) => {
    const updated = { ...record, answers: { ...record.answers, [questionNumber]: optionIndex } };
    writePractice(storageKey, updated);
    setRecord(updated);
  };

  const goToPage = (page: number) => {
    const updated = { ...record, page };
    writePractice(storageKey, updated);
    setRecord(updated);
  };

  const continuePractice = () => {
    if (record.page < 4) {
      goToPage(record.page + 1);
      return;
    }
    const submitted = { ...record, submitted: true };
    writePractice(storageKey, submitted);
    const state: DailyResultRouteState = { answers: submitted.answers, submittedFromPractice: true };
    navigate(resultUrl, { state });
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
                selectedIndex={record.answers[question.number]}
                onSelect={(index) => chooseAnswer(question.number, index)}
              />
            ))}
          </div>
          <div className="mt-4">
            <DailyPracticeActionBar
              page={record.page}
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
          currentPage={record.page}
          questions={dailyQuestions}
          answers={{}}
          draftAnswers={record.answers}
          onSelectPage={goToPage}
        />
      </div>
    </div>
  );
}

export default function LearningPathDailyPracticeView() {
  const { pathId = "demo-active", weekNo = "2", dayNo = "1" } = useParams();
  const [searchParams] = useSearchParams();
  const requestedPage = initialPageFromQuery(searchParams.get("page"));
  const userId = import.meta.env.VITE_LEARNING_PATH_USER_ID?.trim() || "preview";
  const storageKey = `engolearn:learning-path:practice:${userId}:${pathId}:${weekNo}:${dayNo}`;

  return (
    <PracticeSession
      key={storageKey}
      pathId={pathId}
      weekNo={weekNo}
      dayNo={dayNo}
      storageKey={storageKey}
      requestedPage={requestedPage}
      completedPreview={searchParams.get("preview") === "completed"}
    />
  );
}
