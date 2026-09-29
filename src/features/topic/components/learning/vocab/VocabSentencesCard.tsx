import { Quote, Volume2 } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type { VocabSentence } from "../../../types/topic-vocab.types";

export interface VocabSentencesCardProps {
  title: string;
  countLabel: string;
  sentences: VocabSentence[];
  playingId: string | null;
  onPlaySentence: (id: string) => void;
}

export function VocabSentencesCard({
  title,
  countLabel,
  sentences,
  playingId,
  onPlaySentence,
}: VocabSentencesCardProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
          <Quote className="size-[22px] text-primary" />
          {title}
        </h2>
        <span className="text-label-sm text-on-surface-variant">
          {countLabel}
        </span>
      </div>
      <div className="space-y-3">
        {sentences.map((sentence, index) => {
          const isPlaying = playingId === sentence.id;
          return (
            <div
              key={sentence.id}
              className="group flex items-start justify-between gap-4 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
            >
              <div className="flex flex-col gap-1">
                <p className="text-body-lg text-on-surface">
                  {sentence.enPrefix}
                  <span className="font-semibold text-primary underline decoration-primary/40 underline-offset-4">
                    {sentence.highlight}
                  </span>
                  {sentence.enSuffix}
                </p>
                <p className="text-body-md text-on-surface-variant">
                  {sentence.vi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPlaySentence(sentence.id)}
                aria-label={`Nghe câu ví dụ ${index + 1}`}
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-on-primary",
                  isPlaying && "animate-pulse bg-primary text-on-primary",
                )}
              >
                <Volume2 className="size-5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
