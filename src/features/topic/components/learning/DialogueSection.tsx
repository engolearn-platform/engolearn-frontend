import { CirclePlay, Mic } from "lucide-react";
import type { DialogueLine } from "../../types/topic-context.types";
import { DialogueBubble } from "./DialogueBubble";

export interface DialogueSectionProps {
  title: string;
  subtitle: string;
  audioBadge: string;
  playAllLabel: string;
  lines: DialogueLine[];
  onPlayAll: () => void;
  onPlayLine: (id: string) => void;
}

export function DialogueSection({
  title,
  subtitle,
  audioBadge,
  playAllLabel,
  lines,
  onPlayAll,
  onPlayLine,
}: DialogueSectionProps) {
  return (
    <section className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-container-high pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mic className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-headline-sm text-on-surface">{title}</h2>
              <span className="rounded-full bg-primary-fixed/40 px-2 py-0.5 text-label-sm font-semibold text-on-primary-fixed-variant">
                {audioBadge}
              </span>
            </div>
            <p className="text-body-md text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onPlayAll}
          className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-label-lg text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <CirclePlay className="size-5 text-primary" />
          <span>{playAllLabel}</span>
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {lines.map((line) => (
          <DialogueBubble key={line.id} line={line} onPlay={onPlayLine} />
        ))}
      </div>
    </section>
  );
}
