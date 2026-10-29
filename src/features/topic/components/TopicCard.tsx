import { ArrowRight, BookOpen, Clock3, ListChecks, LockKeyhole, Sparkles } from "lucide-react";
import { Link } from "react-router";
import type { TopicCardDto } from "@features/topic/types/topic-api.types";
import { topicDetailPath } from "@features/topic/utils/topic-catalog";
import { TopicProgressBar } from "@features/topic/components/learning/catalog/TopicState";

export function TopicCard({ topic, origin, mine = false, learner }: { topic: TopicCardDto; origin: string; mine?: boolean; learner: boolean }) {
  const limited = !mine && learner && topic.startAvailability.reason === "LEVEL_TOO_LOW";
  const progress = learner ? topic.progress : null;
  return <Link to={topicDetailPath(topic.topicId, origin)} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
    <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-primary/5 text-primary/30">
      <BookOpen className="size-12" aria-hidden="true" />
      {topic.coverUrl && <img key={topic.coverUrl} src={topic.coverUrl} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} className="absolute inset-0 size-full object-cover transition-transform group-hover:scale-105" />}
      <span className="absolute left-4 top-4 rounded-full bg-surface-container-lowest px-3 py-1 text-label-lg font-semibold text-primary">{topic.cefrLevel}</span>
      {limited && <span className="absolute right-3 top-4 flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-label-sm font-semibold text-on-secondary-container"><LockKeyhole className="size-3.5" aria-hidden="true" />Chưa phù hợp level</span>}
    </div>
    <div className="flex flex-1 flex-col gap-4 p-5">
      <h2 className="text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-primary">{topic.titleVi}</h2>
      <div className="flex flex-wrap gap-x-3 gap-y-2 text-label-lg text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" aria-hidden="true" />{topic.vocabularyCount} từ vựng</span>
        <span className="inline-flex items-center gap-1.5"><ListChecks className="size-4" aria-hidden="true" />{topic.quizCount} bài tập</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" aria-hidden="true" />{topic.durationMinutes} phút</span>
      </div>
      {topic.hasNewContent && learner && <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-label-sm font-medium text-on-secondary-container"><Sparkles className="size-4" aria-hidden="true" />Có nội dung mới</span>}
      {progress && <div className="space-y-2 text-label-sm text-on-surface-variant"><div className="flex justify-between gap-2">
        <span>{mine ? (progress.status === "COMPLETED" ? "Đã hoàn thành: " : "Tiến độ: ") : limited ? "" : "Chưa học · "}{progress.completedItemCount} / {progress.totalItemCount} tình huống</span><span className="font-semibold text-primary">{progress.percent}%</span>
      </div><TopicProgressBar percent={progress.percent} label={"Tiến độ " + topic.titleVi} /></div>}
      {limited && <p className="rounded-xl bg-surface p-3 text-label-sm text-on-surface-variant">Cần đạt level {topic.cefrLevel} để bắt đầu học.</p>}
      <span className={"mt-auto flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-label-lg font-semibold " + (limited ? "bg-surface-container-high text-on-surface" : "bg-primary text-on-primary")}>Xem chi tiết <ArrowRight className="size-4" aria-hidden="true" /></span>
    </div>
  </Link>;
}
