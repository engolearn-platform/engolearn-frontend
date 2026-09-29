import { AudioLines, Camera, Volume2 } from "lucide-react";
import { cn } from "@shared/utils/cn";
import type { VocabHero } from "../../../types/topic-vocab.types";

export type PlayingAccent = "uk" | "us" | null;

export interface VocabHeroCardProps {
  hero: VocabHero;
  playingAccent: PlayingAccent;
  onPlayUk: () => void;
  onPlayUs: () => void;
}

export function VocabHeroCard({
  hero,
  playingAccent,
  onPlayUk,
  onPlayUs,
}: VocabHeroCardProps) {
  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="flex flex-col gap-3 md:col-span-5">
          <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-container shadow-sm">
            <img
              src={hero.imageUrl}
              alt={hero.imageAlt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 text-label-sm text-on-surface shadow-sm backdrop-blur-md">
              <Camera className="size-[14px] text-primary" />
              {hero.imageBadge}
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
            <div className="flex items-center justify-between">
              <span className="text-label-sm text-on-surface-variant">
                Phát âm tự nhiên
              </span>
              <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm font-semibold text-primary">
                1.0x
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onPlayUk}
                aria-label={`Nghe phát âm Anh-Anh: ${hero.word}`}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-2 text-label-sm text-on-surface shadow-sm transition-colors hover:bg-primary-fixed hover:text-on-primary-fixed-variant",
                  playingAccent === "uk" && "animate-pulse",
                )}
              >
                {playingAccent === "uk" ? (
                  <AudioLines className="size-[18px]" />
                ) : (
                  <Volume2 className="size-[18px]" />
                )}
                <span className="whitespace-nowrap">UK {hero.ipa}</span>
              </button>
              <button
                type="button"
                onClick={onPlayUs}
                aria-label={`Nghe phát âm Anh-Mỹ: ${hero.word}`}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-2 text-label-sm text-on-surface shadow-sm transition-colors hover:bg-primary-fixed hover:text-on-primary-fixed-variant",
                  playingAccent === "us" && "animate-pulse",
                )}
              >
                {playingAccent === "us" ? (
                  <AudioLines className="size-[18px]" />
                ) : (
                  <Volume2 className="size-[18px]" />
                )}
                <span className="whitespace-nowrap">US {hero.ipa}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 md:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-secondary-container/30 px-2.5 py-1 text-label-sm font-semibold text-on-secondary-container">
              {hero.posLabel}
            </span>
            <span className="rounded-md bg-surface-container px-2.5 py-1 text-label-sm text-on-surface-variant">
              {hero.frequencyLabel}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-headline-lg tracking-tight text-on-surface">
                {hero.word}
              </h1>
              <span className="text-body-md font-medium text-primary">
                {hero.ipa}
              </span>
            </div>
            <p className="mt-1 text-body-lg font-semibold text-on-surface">
              {hero.meaningVi}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3.5 text-body-md text-on-surface-variant">
            <p className="leading-relaxed">{hero.description}</p>
          </div>
          <div className="mt-1 flex flex-col gap-2">
            <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">
              {hero.collocationsHeading}
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {hero.collocations.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 rounded-xl bg-surface-container/40 p-3"
                >
                  <span className="text-label-lg text-primary">{item.en}</span>
                  <span className="text-label-sm text-on-surface-variant">
                    {item.vi}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
