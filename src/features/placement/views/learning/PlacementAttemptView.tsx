import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { PLACEMENT_ROUTES, buildPlacementPages } from "@features/placement/constants";
import { usePlacementAttemptContext } from "@features/placement/hooks/placement-attempt-context";
import PlacementMobileQuestionBar from "@features/placement/components/learning/attempt/PlacementMobileQuestionBar";
import PlacementPageNav from "@features/placement/components/learning/attempt/PlacementPageNav";
import PlacementQuestionCard from "@features/placement/components/learning/attempt/PlacementQuestionCard";
import PlacementQuestionGrid from "@features/placement/components/learning/attempt/PlacementQuestionGrid";
import PlacementSubmitButton from "@features/placement/components/learning/attempt/PlacementSubmitButton";

const SECTION_COPY = {
  READING: {
    title: "Phần Reading",
    description: "Đọc câu hỏi và chọn đáp án đúng nhất.",
  },
  LISTENING: {
    title: "Phần Listening",
    description: "Bật âm thanh và nghe kỹ trước khi chọn đáp án.",
  },
} as const;

export default function PlacementAttemptView() {
  const {
    attempt,
    answers,
    answeredCount,
    setAnswer,
    saveError,
    isExpired,
    submitting,
    submitError,
    submit,
  } = usePlacementAttemptContext();

  const pages = useMemo(
    () => buildPlacementPages(attempt.questions),
    [attempt.questions],
  );

  const [pageIndex, setPageIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  const safeIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const page = pages[safeIndex];

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [safeIndex]);

  const handleJump = (order: number) => {
    const target = pages.findIndex(
      (candidate) => order >= candidate.firstOrder && order <= candidate.lastOrder,
    );
    if (target >= 0) setPageIndex(target);
  };

  if (!page) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-10">
        <p className="text-body-md text-on-surface-variant">
          Bài kiểm tra chưa có câu hỏi nào.
        </p>
      </div>
    );
  }

  const sectionCopy = SECTION_COPY[page.section];
  const canPrevious = safeIndex > 0;
  const canNext = safeIndex < pages.length - 1;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-24 pt-6 lg:pb-10">
      <nav aria-label="Breadcrumb" className="text-label-sm text-on-surface-variant">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link to="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li>
            <Link
              to={PLACEMENT_ROUTES.ROOT}
              className="transition-colors hover:text-primary"
            >
              Đánh giá đầu vào
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li aria-current="page" className="font-semibold text-on-surface">
            Làm bài
          </li>
        </ol>
      </nav>

      <h1 className="mt-3 text-headline-lg font-bold tracking-tight text-on-surface">
        Kiểm tra trình độ tiếng Anh
      </h1>

      {isExpired ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-label-lg text-on-error-container"
        >
          Đã hết thời gian làm bài. Hệ thống đang nộp bài của bạn.
        </p>
      ) : null}

      {saveError ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-label-lg text-on-error-container"
        >
          {saveError}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div ref={listRef} className="scroll-mt-24 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <h2 className="text-headline-sm font-semibold text-on-surface">
              {sectionCopy.title}
            </h2>
            <span className="text-label-sm text-on-surface-variant">
              {sectionCopy.description}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {page.questions.map((question) => (
              <PlacementQuestionCard
                key={question.id}
                question={question}
                selectedOptionId={answers[question.id] ?? null}
                disabled={isExpired}
                onSelect={(optionId) => setAnswer(question.id, optionId)}
              />
            ))}
          </div>

          <PlacementPageNav
            className="mt-6"
            firstOrder={page.firstOrder}
            lastOrder={page.lastOrder}
            totalQuestions={attempt.totalQuestions}
            canPrevious={canPrevious}
            canNext={canNext}
            onPrevious={() => setPageIndex(safeIndex - 1)}
            onNext={() => setPageIndex(safeIndex + 1)}
          />
        </div>

        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-24 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
            <h2 className="text-label-lg font-semibold text-on-surface">
              Danh sách câu hỏi
            </h2>
            <p className="mt-1 text-label-sm text-on-surface-variant">
              Đã trả lời {answeredCount}/{attempt.totalQuestions} câu
            </p>

            <div className="mt-4">
              <PlacementQuestionGrid
                questions={attempt.questions}
                answers={answers}
                activeFirstOrder={page.firstOrder}
                activeLastOrder={page.lastOrder}
                onJump={handleJump}
              />
            </div>

            <PlacementSubmitButton
              className="mt-5"
              answeredCount={answeredCount}
              totalQuestions={attempt.totalQuestions}
              submitting={submitting}
              submitError={submitError}
              onSubmit={submit}
            />
          </div>
        </aside>
      </div>

      <PlacementMobileQuestionBar
        questions={attempt.questions}
        answers={answers}
        firstOrder={page.firstOrder}
        lastOrder={page.lastOrder}
        totalQuestions={attempt.totalQuestions}
        answeredCount={answeredCount}
        submitting={submitting}
        submitError={submitError}
        onJump={handleJump}
        onSubmit={submit}
      />
    </div>
  );
}
