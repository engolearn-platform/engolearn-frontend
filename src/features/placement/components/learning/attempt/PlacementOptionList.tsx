import { cn } from "@shared/utils";
import type { PlacementOption } from "@features/placement/types/placement-attempt.types";

interface PlacementOptionListProps {
  questionId: string;
  options: PlacementOption[];
  selectedOptionId: string | null;
  disabled?: boolean;
  onSelect: (optionId: string) => void;
}

export default function PlacementOptionList({
  questionId,
  options,
  selectedOptionId,
  disabled = false,
  onSelect,
}: PlacementOptionListProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={`${questionId}-prompt`}
      className="flex flex-col gap-2.5"
    >
      {options.map((option) => {
        const selected = option.id === selectedOptionId;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/10"
                : "border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:bg-surface-container",
              disabled && "cursor-not-allowed opacity-60 hover:border-outline-variant",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-label-sm font-bold",
                selected
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline text-on-surface-variant",
              )}
            >
              {option.label}
            </span>
            <span className="text-body-md text-on-surface">{option.text}</span>
          </button>
        );
      })}
    </div>
  );
}
