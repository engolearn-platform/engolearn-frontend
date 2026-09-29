import { Volume2 } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type { DialogueLine } from "../../types/topic-context.types";

export interface DialogueBubbleProps {
  line: DialogueLine;
  onPlay: (id: string) => void;
}

export function DialogueBubble({ line, onPlay }: DialogueBubbleProps) {
  const isLearner = line.speakerRole === "learner";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 transition-all hover:bg-surface-container",
        isLearner && "border border-primary/20 bg-primary/5 hover:bg-primary/10",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-label-sm font-semibold uppercase tracking-wide",
            isLearner
              ? "bg-primary text-on-primary"
              : "bg-surface-container-highest text-on-surface-variant",
          )}
        >
          {line.speakerLabel}
        </span>
        <button
          type="button"
          onClick={() => onPlay(line.id)}
          aria-label={`Phát âm: ${line.speakerLabel}`}
          className="flex size-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
        >
          <Volume2 className="size-5" />
        </button>
      </div>
      <div
        className={cn(
          "text-headline-sm leading-snug font-medium text-on-surface",
          isLearner && "font-semibold text-primary",
        )}
      >
        {line.textEn}
      </div>
      <div className="text-body-md text-on-surface-variant">{line.textVi}</div>
    </div>
  );
}
