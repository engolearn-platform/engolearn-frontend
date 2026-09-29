import { Check } from "lucide-react";
import { cn } from "@shared/utils";
import type { CefrLevel } from "../../types/topic.types";
import type { TopicCreateCefrOption } from "../../types/topic-create.types";

interface CefrLevelSelectorProps {
  value: CefrLevel;
  options: TopicCreateCefrOption[];
  onChange: (cefr: CefrLevel) => void;
}

export default function CefrLevelSelector({ value, options, onChange }: CefrLevelSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Trình độ CEFR mục tiêu">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-start rounded-xl p-4 text-left transition-all",
              isActive
                ? "bg-primary text-on-primary shadow-md"
                : "bg-surface-container-low hover:bg-surface-container",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span
                className={cn(
                  "text-headline-sm font-bold",
                  isActive ? "text-on-primary" : "text-on-surface",
                )}
              >
                {option.value}
              </span>
              <Check
                className={cn(
                  "size-[18px]",
                  isActive ? "text-on-primary opacity-100" : "opacity-0",
                )}
                aria-hidden="true"
              />
            </div>
            <span
              className={cn(
                "mt-1 text-label-lg font-semibold",
                isActive ? "text-on-primary" : "text-on-surface",
              )}
            >
              {option.title}
            </span>
            <span
              className={cn(
                "mt-0.5 text-label-sm leading-snug",
                isActive ? "text-on-primary" : "text-on-surface-variant",
              )}
            >
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
