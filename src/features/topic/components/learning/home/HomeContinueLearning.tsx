import { ArrowRight, BookOpenText, Compass } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { TopicProgressBar } from "@features/topic/components/learning/catalog/TopicState";
import type { TopicCardDto } from "@features/topic/types/topic-api.types";
import { topicDetailPath } from "@features/topic/utils/topic-catalog";
import { Card } from "@shared/components";
import { ROUTES } from "@shared/constants";
import { sampleGrammarLesson } from "./home-dashboard.mock";

const cardClass = "flex h-full flex-col gap-4 rounded-2xl border-learning-outline bg-surface-container-lowest p-5";

function RecentTopicCard({ topic }: { topic: TopicCardDto }) {
  const { progress } = topic;
  return (
    <Card className={cardClass}>
      <div className="flex items-start gap-4">
        <div aria-hidden="true" className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-learning-mint text-primary">
          <BookOpenText className="size-5" />
          {topic.coverUrl && (
            <img
              src={topic.coverUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
              onError={(event) => { event.currentTarget.hidden = true; }}
            />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-label-sm font-semibold text-primary">Học theo chủ đề</p>
          <h3 lang={topic.titleEn ? "en" : "vi"} className="break-words text-headline-sm font-semibold">
            {topic.titleEn || topic.titleVi}
          </h3>
          {topic.titleEn && topic.titleEn !== topic.titleVi && (
            <p className="break-words text-label-lg text-on-surface-variant">{topic.titleVi}</p>
          )}
        </div>
      </div>
      {progress && (
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between gap-2 text-label-lg">
            <span className="text-on-surface-variant">{progress.completedItemCount}/{progress.totalItemCount} tình huống đã hoàn thành</span>
            <span className="font-semibold text-primary">{progress.percent}%</span>
          </div>
          <TopicProgressBar percent={progress.percent} label="Tiến độ chủ đề" />
        </div>
      )}
      <div className="mt-auto">
        <Button asChild className="min-h-12 w-full rounded-xl sm:w-auto">
          <Link to={topicDetailPath(topic.topicId, ROUTES.MY_TOPICS)}>Mở chủ đề<ArrowRight aria-hidden="true" /></Link>
        </Button>
      </div>
    </Card>
  );
}

function GrammarPreviewCard() {
  const lesson = sampleGrammarLesson;
  return (
    <Card className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-label-sm font-semibold text-primary">Ngữ pháp</p>
          <h3 lang="en" className="text-headline-sm font-semibold">{lesson.title}</h3>
          <p className="text-label-lg text-on-surface-variant">{lesson.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-learning-note px-2 py-1 text-label-sm font-semibold text-learning-note-ink">
          Dữ liệu mẫu
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-label-lg text-on-surface-variant">{lesson.completedExercises}/{lesson.totalExercises} bài tập đã hoàn thành</p>
        <TopicProgressBar percent={100 * lesson.completedExercises / lesson.totalExercises} label="Tiến độ ngữ pháp mẫu" />
      </div>
      <div className="mt-auto">
        <Button asChild variant="outline" className="min-h-12 w-full rounded-xl sm:w-auto">
          <Link to={ROUTES.GRAMMAR}>Xem trước ngữ pháp<ArrowRight aria-hidden="true" /></Link>
        </Button>
      </div>
    </Card>
  );
}

export function HomeContinueLearning({ topic, loading, failed }: { topic?: TopicCardDto; loading: boolean; failed: boolean }) {
  return (
    <section aria-labelledby="home-continue-title" className="space-y-3">
      <h2 id="home-continue-title" className="text-headline-md font-semibold">Tiếp tục học</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {topic ? <RecentTopicCard key={topic.topicId} topic={topic} /> : (
          <Card className={cardClass}>
            <h3 className="text-headline-sm font-semibold">Học theo chủ đề</h3>
            <p role="status" className="text-body-md text-on-surface-variant">
              {loading ? "Đang tải chủ đề đang học…" : failed ? "Chưa tải được chủ đề đang học." : "Bạn chưa có chủ đề đang học."}
            </p>
            <div className="mt-auto">
              <Button asChild className="min-h-12 w-full rounded-xl sm:w-auto">
                <Link to={ROUTES.TOPICS}><Compass aria-hidden="true" />Khám phá chủ đề</Link>
              </Button>
            </div>
          </Card>
        )}
        <GrammarPreviewCard />
      </div>
    </section>
  );
}
