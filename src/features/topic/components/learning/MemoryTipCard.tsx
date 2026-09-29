import { Lightbulb } from "lucide-react";

export interface MemoryTipCardProps {
  title: string;
  text: string;
}

export function MemoryTipCard({ title, text }: MemoryTipCardProps) {
  return (
    <div className="rounded-2xl border border-secondary-fixed/50 bg-secondary-fixed/30 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb className="size-5 text-on-secondary-fixed-variant" />
        <span className="text-xs font-bold uppercase tracking-wider text-on-secondary-fixed-variant">
          {title}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-on-secondary-fixed">{text}</p>
    </div>
  );
}
