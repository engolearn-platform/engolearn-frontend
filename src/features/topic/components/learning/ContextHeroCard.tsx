import { Compass, Sun } from "lucide-react";
import type {
  LessonObjective,
  TopicContextHero,
} from "../../types/topic-context.types";
import { ContextBanner } from "./ContextBanner";
import { ContextNarrative } from "./ContextNarrative";
import { LessonObjectivesPanel } from "./LessonObjectivesPanel";

export interface ContextHeroCardProps {
  hero: TopicContextHero;
  objectivesHeading: string;
  objectives: LessonObjective[];
}

export function ContextHeroCard({
  hero,
  objectivesHeading,
  objectives,
}: ContextHeroCardProps) {
  return (
    <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md">
      <div className="pointer-events-none absolute -top-16 -right-16 size-80 rounded-full bg-primary-fixed/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 size-64 rounded-full bg-secondary-fixed/30 blur-2xl" />
      <div className="relative z-10 flex flex-col gap-6 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
            <Compass className="size-4" />
            <span className="text-label-sm font-semibold tracking-wide">
              {hero.stageTag}
            </span>
          </div>
          <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            <Sun className="size-4 text-on-secondary-container" />
            <span>{hero.metaLabel}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-label-sm font-semibold uppercase tracking-widest text-primary">
            {hero.eyebrow}
          </div>
          <h1 className="text-headline-lg leading-tight text-on-surface">
            {hero.titleEn} — {hero.titleVi}
          </h1>
        </div>
        <ContextBanner
          imageUrl={hero.imageUrl}
          imageAlt={hero.imageAlt}
          promptLabel={hero.promptLabel}
          promptText={hero.promptText}
        />
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
          <ContextNarrative
            heading={hero.narrativeHeading}
            body={hero.narrativeBody}
            tipTitle={hero.tipTitle}
            tipText={hero.tipText}
          />
          <LessonObjectivesPanel
            heading={objectivesHeading}
            objectives={objectives}
          />
        </div>
      </div>
    </section>
  );
}
