import { GraduationCap, Mic, Timer, MessagesSquare } from "lucide-react";
import type {
  ExpressionHeroMeta,
  ExpressionHeroMetaIcon,
} from "../../../types/topic-expressions.types";

export interface ExpressionsHeroCardProps {
  stageTag: string;
  sectionBadge: string;
  title: string;
  description: string;
  meta: ExpressionHeroMeta[];
}

const META_ICONS: Record<ExpressionHeroMetaIcon, typeof GraduationCap> = {
  school: GraduationCap,
  forum: MessagesSquare,
  mic: Mic,
  timer: Timer,
};

export function ExpressionsHeroCard({
  stageTag,
  sectionBadge,
  title,
  description,
  meta,
}: ExpressionsHeroCardProps) {
  return (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-label-sm font-semibold uppercase tracking-wide text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          {stageTag}
        </span>
        <span className="rounded-md bg-secondary-fixed/50 px-2 py-0.5 font-label-sm font-bold text-on-secondary-fixed-variant">
          {sectionBadge}
        </span>
      </div>
      <h1 className="mb-2 font-headline-lg text-headline-lg tracking-tight text-on-surface">
        {title}
      </h1>
      <p className="mb-4 max-w-2xl font-body-md leading-relaxed text-on-surface-variant">
        {description}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-outline-variant/10 pt-3 font-label-sm text-outline">
        {meta.map((item, i) => {
          const Icon = META_ICONS[item.icon];
          return (
            <span key={item.icon} className="flex items-center gap-3">
              {i > 0 && <span className="text-outline-variant">•</span>}
              <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
                <Icon className="size-4 text-primary" />
                {item.label}
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}