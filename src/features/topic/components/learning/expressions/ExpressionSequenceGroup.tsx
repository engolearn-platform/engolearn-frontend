import { AudioLines, Rocket, Volume2 } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type {
  ConnectingWord,
  SequenceExample,
} from "../../../types/topic-expressions.types";

export interface ExpressionSequenceGroupProps {
  orderIndex: number;
  titleVi: string;
  titleEn: string;
  pillLabel: string;
  sequenceExample: SequenceExample;
  connectingWords: ConnectingWord[];
  isPlayingSequence: boolean;
  onPlaySequence: () => void;
}

export function ExpressionSequenceGroup({
  orderIndex,
  titleVi,
  titleEn,
  pillLabel,
  sequenceExample,
  connectingWords,
  isPlayingSequence,
  onPlaySequence,
}: ExpressionSequenceGroupProps) {
  const sortedWords = [...connectingWords].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
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
          <Rocket className="size-[15px]" />
          {pillLabel}
        </span>
      </div>

      {/* Sequence example — long linked sentence + play button */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-headline-sm text-[18px] font-bold leading-snug tracking-tight text-on-surface">
            {sequenceExample.textEn}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            {sequenceExample.textVi}
          </p>
        </div>
        <button
          type="button"
          onClick={onPlaySequence}
          aria-label="Phát âm câu liên kết"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm transition-all",
            isPlayingSequence
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-primary hover:bg-primary hover:text-on-primary",
          )}
        >
          {isPlayingSequence ? (
            <AudioLines className="size-5 animate-pulse" />
          ) : (
            <Volume2 className="size-5" />
          )}
        </button>
      </div>

      {/* Connecting words — number left, content right (horizontal) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {sortedWords.map((w) => (
          <div
            key={w.id}
            className="flex items-center gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-low/50 p-4 transition-colors hover:bg-surface-container-low"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
              {w.orderIndex}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-headline-sm text-[15px] font-semibold leading-snug text-on-surface">
                {w.wordEn}
              </div>
              <div className="text-sm leading-snug text-on-surface-variant">
                {w.wordVi}
              </div>
              <div className="mt-1 text-xs leading-snug text-outline">
                {w.usageNote}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}