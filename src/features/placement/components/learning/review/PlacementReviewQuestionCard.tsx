import PlacementAudioPlayer from "@features/placement/components/learning/attempt/PlacementAudioPlayer";
import type { PlacementReviewQuestion } from "@features/placement/types/placement-review.types";
import { cn } from "@shared/utils";
import { Check, Minus, X } from "lucide-react";
import { getReviewAnswerState } from "./reviewState";

export default function PlacementReviewQuestionCard({
  question,
  current,
}: {
  question: PlacementReviewQuestion;
  current: boolean;
}) {
  const state = getReviewAnswerState(question);
  const stateLabel =
    state === "CORRECT" ? "Đúng" : state === "INCORRECT" ? "Sai" : "Chưa trả lời";
  const StateIcon = state === "CORRECT" ? Check : state === "INCORRECT" ? X : Minus;

  return (
    <article
      id={`review-question-${question.order}`}
      aria-labelledby={`review-question-heading-${question.order}`}
      className={cn(
        "rounded-2xl border bg-surface-container-lowest p-5 shadow-sm sm:p-6",
        current ? "border-primary" : "border-outline-variant",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id={`review-question-heading-${question.order}`}
          className="text-headline-sm font-semibold text-on-surface"
        >
          Câu {question.order}
        </h2>
        <span className="rounded-full bg-surface-container-low px-2 py-1 text-label-sm text-on-surface-variant">
          {question.section === "READING" ? "Reading" : "Listening"}
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-sm font-semibold",
            state === "CORRECT"
              ? "bg-primary-fixed text-on-primary-fixed"
              : state === "INCORRECT"
                ? "bg-error-container text-on-error-container"
                : "bg-surface-container-highest text-on-surface-variant",
          )}
        >
          <StateIcon className="size-4" aria-hidden="true" />
          {stateLabel}
        </span>
      </div>

      {question.section === "LISTENING" && question.audio ? (
        <div className="mt-4">
          <PlacementAudioPlayer audio={question.audio} questionId={question.id} />
          {!question.audio.url ? (
            <p className="mt-2 text-label-sm text-on-surface-variant">
              Audio minh họa — chưa có tệp âm thanh thật.
            </p>
          ) : null}
        </div>
      ) : null}

      {question.passage ? (
        <blockquote className="mt-4 rounded-xl border-l-4 border-primary/40 bg-surface-container-low px-4 py-3 text-body-md leading-relaxed text-on-surface-variant">
          {question.passage}
        </blockquote>
      ) : null}

      <p className="mt-4 text-body-md font-semibold text-on-surface">
        {question.prompt}
      </p>
      {state === "UNANSWERED" ? (
        <p className="mt-2 text-label-sm text-on-surface-variant">
          Bạn chưa trả lời câu này.
        </p>
      ) : null}

      <ol aria-label={`Các lựa chọn câu ${question.order}`} className="mt-4 flex flex-col gap-2">
        {question.options.map((option) => {
          const correct = option.id === question.correctOptionId;
          const selected = option.id === question.selectedOptionId;
          const wrongSelection = selected && !correct;
          const optionLabel = selected && correct
            ? "Bạn chọn · Đáp án đúng"
            : wrongSelection
              ? "Bạn đã chọn"
              : correct
                ? "Đáp án đúng"
                : null;
          const OptionIcon = wrongSelection ? X : Check;

          return (
            <li
              key={option.id}
              className={cn(
                 "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-body-md",
                wrongSelection
                  ? "border-error bg-error-container text-on-error-container"
                  : correct
                    ? "border-primary bg-primary-fixed/30 text-on-surface"
                    : "border-outline-variant bg-surface-container-low text-on-surface-variant",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-outline-variant text-label-sm font-semibold">
                {option.label}
              </span>
              <span className="min-w-0 flex-1">{option.text}</span>
              {optionLabel ? (
                <span className="inline-flex items-center gap-1 text-label-sm font-semibold">
                  <OptionIcon className="size-4" aria-hidden="true" />
                  {optionLabel}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      {question.explanation?.trim() ? (
        <section aria-labelledby={`review-explanation-${question.order}`} className="mt-5 space-y-2 rounded-xl border border-learning-mint-border bg-learning-nav-active p-4">
          <h3 id={`review-explanation-${question.order}`} className="text-label-lg font-semibold text-primary">Giải thích</h3>
          <p className="whitespace-pre-line break-words text-body-md leading-relaxed text-on-surface-variant">{question.explanation}</p>
        </section>
      ) : null}
    </article>
  );
}
