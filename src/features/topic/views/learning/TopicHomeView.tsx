import { Compass } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { TopicState } from "@features/topic/components/learning/catalog/TopicState";
import { HomeProgressOverview } from "@features/topic/components/learning/home/HomeProgressOverview";
import { HomeAssessmentCard } from "@features/topic/components/learning/home/HomeAssessmentCard";
import { HomeLearningPathCard } from "@features/topic/components/learning/home/HomeLearningPathCard";
import { HomeTopicCard } from "@features/topic/components/learning/home/HomeTopicCard";
import { HomeGrammarCard } from "@features/topic/components/learning/home/HomeGrammarCard";
import { HomeSpeakingCard } from "@features/topic/components/learning/home/HomeSpeakingCard";
import { useHomeDashboard } from "@features/topic/hooks/useHomeDashboard";
import { ROUTES } from "@shared/constants";
import { useAuth } from "@shared/hooks";

function LearnerDashboard() {
  const dashboard = useHomeDashboard();
  return <>
    <HomeProgressOverview dashboard={dashboard} />
    {dashboard.isNewLearner && <div className="flex items-start gap-3 rounded-2xl border border-learning-mint-border bg-learning-mint p-5">
      <Compass aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
      <p className="text-body-md">Chọn một hoạt động để bắt đầu — bạn không cần làm tất cả cùng lúc.</p>
    </div>}
    <HomeAssessmentCard query={dashboard.assessment} isNewLearner={dashboard.isNewLearner} />
    <HomeLearningPathCard query={dashboard.paths} skills={dashboard.skills} />
    <HomeTopicCard query={dashboard.topics} />
    <HomeGrammarCard query={dashboard.grammar} />
    <HomeSpeakingCard query={dashboard.speaking} />
  </>;
}

export default function TopicHomeView() {
  const auth = useAuth();
  return <div className="mx-auto max-w-6xl space-y-6 px-5 py-6 md:px-8 md:py-8">
    <div className="space-y-2"><h1 className="text-headline-lg font-bold">Tổng quan học tập</h1>
      <p className="text-body-md text-on-surface-variant">Theo dõi tiến độ và tiếp tục hành trình học tiếng Anh của bạn.</p></div>
    {auth.isLoading || auth.error ? <TopicState title={auth.isLoading ? "Đang kiểm tra phiên đăng nhập…" : "Không kiểm tra được phiên đăng nhập"}
      loading={auth.isLoading} error={!!auth.error} onRetry={auth.isLoading ? undefined : auth.refetch} />
      : auth.user ? <LearnerDashboard key={auth.identityGeneration} /> : <TopicState title="Đăng nhập để xem tiến độ học tập">
        <Button asChild className="mt-4 min-h-12 rounded-xl"><Link to={ROUTES.LOGIN}>Đăng nhập</Link></Button>
      </TopicState>}
  </div>;
}
