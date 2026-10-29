import { Lightbulb } from "lucide-react";

export interface MemoryTipCardProps {
  title: string;
  text: string;
}

export function MemoryTipCard({ title, text }: MemoryTipCardProps) {
  return (
    <div className="rounded-2xl border border-learning-note bg-learning-note p-5">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb className="size-5 shrink-0 text-learning-note-ink" aria-hidden="true" />
        <span className="text-label-sm font-semibold uppercase tracking-wide text-learning-note-ink">
          {title}
        </span>
      </div>
      <p className="text-body-md leading-relaxed text-learning-note-ink">{text}</p>
    </div>
  );
}
