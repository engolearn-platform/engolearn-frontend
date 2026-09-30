import { MessageSquare, SlidersHorizontal, Rocket } from "lucide-react";
import type {
  ExpressionExample,
  ExpressionGroupPillIcon,
} from "../../../types/topic-expressions.types";
import { ExpressionSentenceCard } from "./ExpressionSentenceCard";

export interface ExpressionGroupCardProps {
  orderIndex: number;
  titleVi: string;
  titleEn: string;
  pillIcon: ExpressionGroupPillIcon;
  pillLabel: string;
  examples: ExpressionExample[];
  playingId: string | null;
  onPlay: (id: string) => void;
}

const PILL_ICONS: Record<ExpressionGroupPillIcon, typeof MessageSquare> = {
  chat: MessageSquare,
  tune: SlidersHorizontal,
  rocket: Rocket,
};

export function ExpressionGroupCard({
  orderIndex,
  titleVi,
  titleEn,
  pillIcon,
  pillLabel,
  examples,
  playingId,
  onPlay,
}: ExpressionGroupCardProps) {
  const PillIcon = PILL_ICONS[pillIcon];
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {orderIndex}
          </span>
          <div className="flex items-baseline gap-2">
            <h2 className="font-headline-sm font-semibold text-on-surface">
              {titleVi}
            </h2>
            <span className="hidden font-label-sm text-outline sm:inline">
              {titleEn}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 font-label-sm font-semibold text-primary">
          <PillIcon className="size-[15px]" />
          {pillLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {examples.map((ex) => (
          <ExpressionSentenceCard
            key={ex.id}
            example={ex}
            isPlaying={playingId === ex.id}
            onPlay={onPlay}
          />
        ))}
      </div>
    </section>
  );
}