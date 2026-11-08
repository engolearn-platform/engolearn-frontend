import { ArrowRight, Compass, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { TopicState } from "@features/topic/components/learning/catalog/TopicState";
import { HomeContinueLearning } from "@features/topic/components/learning/home/HomeContinueLearning";
import { HomeFeatureDiscovery } from "@features/topic/components/learning/home/HomeFeatureDiscovery";
import { HomeProgressOverview } from "@features/topic/components/learning/home/HomeProgressOverview";
import type { HomeOverviewSources } from "@features/topic/components/learning/home/HomeProgressOverview";
import { topicCatalogService } from "@features/topic/services/topic-catalog.service";
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

function GuestBrowsePrompt() {
  return (
    <Card className="rounded-2xl border-learning-outline bg-surface-container-lowest p-5 sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-learning-mint text-primary">
          <Compass aria-hidden="true" className="size-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-headline-md font-semibold">
            Bắt đầu với một chủ đề
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
        <Button asChild variant="outline" className="min-h-12 rounded-xl">
          <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
        </Button>
      </div>
    </Card>
  );
}

function LearnerDashboard(sources: HomeOverviewSources) {
  const topics = useFetch(loadRecentTopic);
  return (
    <>
      <HomeProgressOverview topics={topics} {...sources} />
      <HomeContinueLearning topic={topics.data?.items[0]} loading={topics.loading} failed={Boolean(topics.error)} />
      <HomeFeatureDiscovery />
    </>
  );
}

function HomeContent(sources: HomeOverviewSources) {
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
    ? <LearnerDashboard key={auth.identityGeneration} {...sources} />
    : <GuestBrowsePrompt />;
}

export default function TopicHomeView(sources: HomeOverviewSources) {
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
      <HomeContent {...sources} />
    </div>
  );
}
