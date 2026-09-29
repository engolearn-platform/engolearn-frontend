import { BookOpen, Lightbulb } from "lucide-react";

export interface ContextNarrativeProps {
  heading: string;
  body: string;
  tipTitle: string;
  tipText: string;
}

export function ContextNarrative({
  heading,
  body,
  tipTitle,
  tipText,
}: ContextNarrativeProps) {
  return (
    <div className="flex flex-col gap-3 md:col-span-8">
      <div className="flex items-center gap-2 text-label-lg text-primary">
        <BookOpen className="size-[18px]" />
        <span>{heading}</span>
      </div>
      <p className="text-body-lg leading-relaxed text-on-surface">{body}</p>
      <div className="mt-1 flex items-start gap-3 rounded-lg bg-surface-container-low p-3.5">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-body-md text-on-surface-variant">
          <strong className="font-semibold text-on-surface">{tipTitle}</strong>{" "}
          {tipText}
        </p>
      </div>
    </div>
  );
}
