import {
  ArrowLeftRight,
  Lightbulb,
  Volume2,
  AudioLines,
} from "lucide-react";
import { cn } from "@shared/utils/cn";
import type {
  ExpressionExample,
  ExpressionExampleType,
} from "../../../types/topic-expressions.types";

export interface ExpressionSentenceCardProps {
  example: ExpressionExample;
  isPlaying: boolean;
  onPlay: (id: string) => void;
}

const TYPE_LABELS: Record<ExpressionExampleType, string> = {
  BASIC_SUGGESTION: "Gợi ý cơ bản",
  POLITE_INQUIRY: "Hỏi lịch sự",
  SLOT_PATTERN: "Mẫu thế chỗ",
};

export function ExpressionSentenceCard({
  example,
  isPlaying,
  onPlay,
}: ExpressionSentenceCardProps) {
  const isSlot = example.type === "SLOT_PATTERN";
  const TipIcon = isSlot ? ArrowLeftRight : Lightbulb;
  const tipColor = isSlot ? "text-primary" : "text-secondary";

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low/50 p-5 transition-colors hover:bg-surface-container-low">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm font-medium text-on-surface-variant">
            {TYPE_LABELS[example.type]}
          </span>
          <button
            type="button"
            onClick={() => onPlay(example.id)}
            aria-label={`Phát âm ${example.textEn}`}
            className={cn(
              "flex size-9 items-center justify-center rounded-full shadow-sm transition-all",
              isPlaying
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-primary hover:bg-primary hover:text-on-primary",
            )}
          >
            {isPlaying ? (
              <AudioLines className="size-5 animate-pulse" />
            ) : (
              <Volume2 className="size-5" />
            )}
          </button>
        </div>
        <p className="font-headline-sm text-[18px] font-bold leading-snug tracking-tight text-on-surface transition-colors group-hover:text-primary">
          {example.textEn}
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          {example.textVi}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-outline-variant/10 pt-3 text-xs text-outline">
        <TipIcon className={cn("size-[15px]", tipColor)} />
        <span>{example.usageNote}</span>
      </div>
    </div>
  );
}