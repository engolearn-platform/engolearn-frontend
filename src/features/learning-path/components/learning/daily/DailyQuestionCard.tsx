import { AudioLines, BookOpen, Check, Ear, Info, X } from "lucide-react";
import { cn } from "@shared/utils";
import type { DailyQuestion } from "@features/learning-path/types/learning-path-day.types";
import DailyAudioPlayer from "./DailyAudioPlayer";

interface DailyQuestionCardProps {
  question: DailyQuestion;
  mode: "practice" | "review";
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}

const optionLetters = ["A", "B", "C", "D"];

export default function DailyQuestionCard({
  question,
  mode,
  selectedIndex,
  onSelect,
}: DailyQuestionCardProps) {
  const review = mode === "review";
  const answered = selectedIndex !== undefined;
  const correct = answered && selectedIndex === question.correctIndex;
  const status = !answered ? "Chưa làm" : correct ? "Đúng" : "Sai";
  const SkillIcon = question.skill === "READING" ? BookOpen :
    question.microSkill === "Listening for Gist" ? Ear : AudioLines;

  return (
    <article className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-on-surface">Câu {question.number}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <SkillIcon className="size-3.5" aria-hidden="true" />
            {question.microSkill}
          </span>
          {review && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
              correct && "border-primary/20 bg-primary/10 text-primary",
              answered && !correct && "border-error/20 bg-error-container text-on-error-container",
              !answered && "border-outline-variant/60 bg-surface-container-low text-on-surface-variant",
            )}>
              {correct ? <Check className="size-3" aria-hidden="true" /> : answered ? <X className="size-3" aria-hidden="true" /> : null}
              {status}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        {question.stimulus.type === "audio" ? (
          <DailyAudioPlayer label={question.stimulus.label} duration={question.stimulus.duration} />
        ) : (
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-4">
            <p className="mb-2 text-xs text-on-surface-variant">{question.stimulus.label}</p>
            <p className="text-sm leading-6 text-on-surface">{question.stimulus.text}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-base font-semibold leading-6 text-on-surface">{question.prompt}</p>

      <div className="mt-4 space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectAnswer = question.correctIndex === index;
          const wrongSelection = review && isSelected && !isCorrectAnswer;
          const highlighted = review ? isCorrectAnswer : isSelected;
          const content = (
            <>
              <span className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-xs font-semibold text-on-surface-variant",
                highlighted && "bg-primary text-on-primary",
                wrongSelection && "bg-error text-on-error",
              )}>
                {optionLetters[index]}
              </span>
              <span className="min-w-0 flex-1">{option}</span>
              {review && (isCorrectAnswer || isSelected) ? (
                <span className={cn("text-xs font-medium", wrongSelection ? "text-error" : "text-primary")}>
                  {isCorrectAnswer && isSelected ? "Bạn đã chọn · Đáp án đúng" : isCorrectAnswer ? "Đáp án đúng" : "Bạn đã chọn"}
                </span>
              ) : highlighted ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
            </>
          );
          const className = cn(
            "flex min-h-11 w-full items-center gap-3 rounded-xl border border-outline-variant/50 px-3 py-2 text-left text-sm text-on-surface",
            highlighted && "border-primary bg-primary/10",
            wrongSelection && "border-error bg-error-container",
            !review && "transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          );

          return review ? (
            <div key={optionLetters[index]} className={className}>{content}</div>
          ) : (
            <button
              key={optionLetters[index]}
              type="button"
              className={className}
              aria-pressed={isSelected}
              onClick={() => onSelect?.(index)}
            >
              {content}
            </button>
          );
        })}
      </div>

      {review && (
        <div className="mt-4 rounded-xl border-l-4 border-l-primary bg-primary/5 p-4 text-sm leading-6 text-on-surface">
          <p className="mb-1 inline-flex items-center gap-1.5 font-semibold text-primary">
            <Info className="size-4" aria-hidden="true" />
            Giải thích
          </p>
          <p>{question.explanation}</p>
        </div>
      )}
    </article>
  );
}
