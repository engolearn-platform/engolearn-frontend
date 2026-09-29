import { useState } from "react";
import { Brain, CheckCircle2, Circle, XCircle } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type { VocabQuickCheck } from "../../../types/topic-vocab.types";

export interface VocabQuickCheckCardProps {
  quickCheck: VocabQuickCheck;
  onCorrectAnswer?: () => void;
}

export function VocabQuickCheckCard({
  quickCheck,
  onCorrectAnswer,
}: VocabQuickCheckCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = quickCheck.options.find((o) => o.id === selectedId) ?? null;
  const answered = selected !== null;
  const isCorrect = selected?.isCorrect ?? false;
  const filledAnswer = isCorrect ? selected?.text : "_______";

  const handleSelect = (optionId: string) => {
    setSelectedId(optionId);
    const option = quickCheck.options.find((o) => o.id === optionId);
    if (option?.isCorrect) {
      onCorrectAnswer?.();
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary-container/40 text-secondary">
            <Brain className="size-5" />
          </span>
          <h2 className="text-headline-sm text-on-surface">
            Kiểm tra phản xạ nhanh
          </h2>
        </div>
        <span className="rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-on-surface-variant">
          {quickCheck.challengeBadge}
        </span>
      </div>
      <div className="rounded-xl bg-surface-container-low p-4">
        <p className="mb-1 text-body-md text-on-surface-variant">
          {quickCheck.promptLabel}
        </p>
        <p className="text-headline-sm text-on-surface">
          {quickCheck.questionPrefix}
          <span
            className={cn(
              "mx-1 inline-block min-w-[120px] rounded bg-surface-container-highest px-3 py-0.5 text-center font-bold text-primary",
              answered &&
                (isCorrect
                  ? "bg-primary-fixed text-on-primary-fixed-variant"
                  : "bg-error-container text-error"),
            )}
          >
            {filledAnswer}
          </span>
          {quickCheck.questionSuffix}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {quickCheck.options.map((option) => {
          const isSelected = option.id === selectedId;
          const showCorrect = answered && isSelected && option.isCorrect;
          const showError = answered && isSelected && !option.isCorrect;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              aria-pressed={isSelected}
              className={cn(
                "group flex items-center justify-between rounded-xl bg-surface-container-low p-4 text-left transition-all hover:bg-surface-container",
                showCorrect && "bg-primary-fixed hover:bg-primary-fixed",
                showError && "bg-error-container hover:bg-error-container",
                answered && !isSelected && "opacity-60",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-surface-container-lowest text-label-lg text-on-surface shadow-sm">
                  {option.label}
                </span>
                <span className="text-label-lg text-on-surface">
                  {option.text}
                </span>
              </div>
              {showCorrect ? (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              ) : showError ? (
                <XCircle className="size-5 shrink-0 text-error" />
              ) : (
                <Circle className="size-5 shrink-0 text-outline opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          role="status"
          className={cn(
            "rounded-xl p-4 transition-all",
            isCorrect ? "bg-primary-fixed/40" : "bg-error-container/60",
          )}
        >
          <div
            className={cn(
              "flex items-start gap-3",
              isCorrect ? "text-on-primary-fixed-variant" : "text-on-error-container",
            )}
          >
            {isCorrect ? (
              <CheckCircle2 className="size-[22px] shrink-0 text-primary" />
            ) : (
              <XCircle className="size-[22px] shrink-0 text-error" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-label-lg font-bold">
                {isCorrect
                  ? quickCheck.successTitle
                  : quickCheck.errorTitle}
              </span>
              <p className="text-body-md">
                {isCorrect ? quickCheck.successText : quickCheck.errorText}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
