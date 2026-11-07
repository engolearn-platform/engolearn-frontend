import { ArrowRight, BookOpenText, Bookmark, Compass, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { TopicProgressBar, TopicState } from "@features/topic/components/learning/catalog/TopicState";
import { topicCatalogService } from "@features/topic/services/topic-catalog.service";
import type { TopicCardDto } from "@features/topic/types/topic-api.types";
import { topicDetailPath, topicErrorMessage } from "@features/topic/utils/topic-catalog";
import { Card } from "@shared/components";
import { ROUTES } from "@shared/constants";
import { useAuth, useFetch } from "@shared/hooks";

function loadRecentTopic(signal: AbortSignal) {
  return topicCatalogService.mine({ status: "IN_PROGRESS", limit: 1 }, signal);
}

function BrowseTopicsLink() {
  return (
    <Button asChild variant="outline" className="min-h-12 rounded-xl">
      <Link to={ROUTES.TOPICS}><Compass aria-hidden="true" />Khám phá chủ đề</Link>
    </Button>
  );
}

function MyTopicsLink() {
  return (
    <Button asChild variant="outline" className="min-h-12 rounded-xl">
      <Link to={ROUTES.MY_TOPICS}><Bookmark aria-hidden="true" />Chủ đề của tôi</Link>
    </Button>
  );
}

function BrowsePrompt({ guest = false, hasCompleted = false }: { guest?: boolean; hasCompleted?: boolean }) {
  return (
    <Card className="rounded-2xl border-learning-outline bg-surface-container-lowest p-5 sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-learning-mint text-primary">
          <Compass aria-hidden="true" className="size-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-headline-md font-semibold">
            {hasCompleted ? "Khám phá chủ đề mới" : "Bắt đầu với một chủ đề"}
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Học tiếng Anh qua các tình huống hằng ngày, từ làm quen đến luyện hội thoại.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild className="min-h-12 rounded-xl">
          <Link to={ROUTES.TOPICS}>Khám phá chủ đề<ArrowRight aria-hidden="true" /></Link>
        </Button>
        {guest && (
          <Button asChild variant="outline" className="min-h-12 rounded-xl">
            <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
          </Button>
        )}
        {hasCompleted && <MyTopicsLink />}
      </div>
    </Card>
  );
}

function RecentTopicCard({ topic }: { topic: TopicCardDto }) {
  const { progress } = topic;
  return (
    <section aria-labelledby="home-continue-title" className="space-y-3">
      <h2 id="home-continue-title" className="text-headline-md font-semibold">Tiếp tục học</h2>
      <Card className="rounded-2xl border-learning-outline bg-surface-container-lowest p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div aria-hidden="true" className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-learning-mint text-primary sm:size-20">
            <BookOpenText className="size-6" />
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
            <h3 lang={topic.titleEn ? "en" : "vi"} className="break-words text-headline-md font-semibold">
              {topic.titleEn || topic.titleVi}
            </h3>
            {topic.titleEn && topic.titleEn !== topic.titleVi && (
              <p className="break-words text-body-md text-on-surface-variant">{topic.titleVi}</p>
            )}
          </div>
        </div>
        {progress && (
          <div className="mt-5 space-y-2">
            <div className="flex flex-wrap justify-between gap-2 text-label-lg">
              <span className="text-on-surface-variant">
                {progress.completedItemCount}/{progress.totalItemCount} tình huống đã hoàn thành
              </span>
              <span className="font-semibold text-primary">{progress.percent}%</span>
            </div>
            <TopicProgressBar percent={progress.percent} label="Tiến độ chủ đề" />
          </div>
        )}
        <Button asChild className="mt-5 min-h-12 w-full rounded-xl sm:w-auto">
          <Link to={topicDetailPath(topic.topicId, ROUTES.MY_TOPICS)}>Mở chủ đề<ArrowRight aria-hidden="true" /></Link>
        </Button>
      </Card>
      <nav aria-label="Lối tắt học tập" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <MyTopicsLink />
        <BrowseTopicsLink />
      </nav>
    </section>
  );
}

function LearnerNextAction() {
  const { data, loading, error, refetch } = useFetch(loadRecentTopic);

  if (!data) {
    return (
      <TopicState
        title={error ? "Không tải được chủ đề đang học" : "Đang tải chủ đề đang học…"}
        description={topicErrorMessage(error)}
        loading={loading}
        error={Boolean(error)}
        onRetry={error ? refetch : undefined}
      >
        <div className="mt-3"><BrowseTopicsLink /></div>
      </TopicState>
    );
  }

  const recentTopic = data.items[0];
  return recentTopic ? <RecentTopicCard topic={recentTopic} /> : <BrowsePrompt hasCompleted={data.counts.completed > 0} />;
}

function NextAction() {
  const auth = useAuth();

  if (auth.isLoading || auth.error) {
    return (
      <TopicState
        title={auth.isLoading ? "Đang kiểm tra phiên đăng nhập…" : "Không kiểm tra được phiên đăng nhập"}
        loading={auth.isLoading}
        error={!auth.isLoading}
        onRetry={auth.isLoading ? undefined : auth.refetch}
      >
        <div className="mt-3"><BrowseTopicsLink /></div>
      </TopicState>
    );
  }

  return auth.user
    ? <LearnerNextAction key={auth.identityGeneration} />
    : <BrowsePrompt guest />;
}

export default function TopicHomeView() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-6 md:px-8 md:py-10">
      <header className="relative isolate flex items-center justify-between gap-6 overflow-hidden rounded-2xl border border-learning-mint-border bg-learning-mint p-5 sm:p-8">
        <div className="max-w-lg space-y-2">
          <h1 className="text-headline-lg font-bold">Chào mừng đến với EngoLearn</h1>
          <p className="text-body-md text-on-surface-variant">
            Mỗi chủ đề là một cơ hội luyện tiếng Anh trong tình huống thực tế.
          </p>
        </div>
        <div aria-hidden="true" className="relative mr-2 hidden shrink-0 sm:block">
          <div className="absolute inset-0 rotate-6 rounded-2xl border border-learning-mint-border bg-learning-nav-active" />
          <div className="relative -rotate-3 space-y-2 rounded-2xl border border-learning-mint-border bg-surface-container-lowest px-5 py-4">
            <MessageCircle className="size-5 text-primary" />
            <p lang="en" className="text-label-lg font-semibold text-primary">Let’s talk!</p>
            <p className="text-label-sm text-on-surface-variant">Cùng trò chuyện nhé!</p>
          </div>
        </div>
      </header>
      <NextAction />
    </div>
  );
}
