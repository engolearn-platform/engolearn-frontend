import { BookOpen, CircleHelp, MessageCircle } from "lucide-react";
import type { TopicDetailOverview } from "../../../types/topic-detail.types";

export interface TopicDetailHeroProps {
  title: string;
  description: string;
  cefrBadge: string;
  overview: TopicDetailOverview;
}

export function TopicDetailHero({
  title,
  description,
  cefrBadge,
  overview,
}: TopicDetailHeroProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-headline-lg font-bold text-primary">
            {title}
          </h1>
          <p className="text-body-md text-on-surface-variant">{description}</p>
        </div>
        <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
          <span className="text-label-lg font-semibold text-primary">
            {cefrBadge}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-outline-variant/50 pt-3 text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <BookOpen className="size-4 text-primary" />
          {overview.vocabLabel}
        </span>
        <span aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <MessageCircle className="size-4 text-primary" />
          {overview.expressionLabel}
        </span>
        <span aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <CircleHelp className="size-4 text-primary" />
          {overview.practiceLabel}
        </span>
      </div>
    </section>
  );
}
