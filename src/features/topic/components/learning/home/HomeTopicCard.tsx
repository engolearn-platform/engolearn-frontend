import { BookOpenText } from "lucide-react";
import { ROUTES } from "@shared/constants";
import type { HomeDashboard } from "@features/topic/hooks/useHomeDashboard";
import { topicDetailPath } from "@features/topic/utils/topic-catalog";
import { HomeAction, HomeBadge, HomeEmpty, HomeProgress, HomeQueryState, HomeSection } from "./HomeDashboardParts";

export function HomeTopicCard({ query }: { query: HomeDashboard["topics"] }) {
  return <HomeSection id="home-topics" title="Học theo chủ đề" link={{ to: ROUTES.MY_TOPICS, label: "Chủ đề của tôi" }}>
    <HomeQueryState query={query} label="tiến độ chủ đề">{data => {
      const topic = data.currentTopic;
      if (!topic) return <HomeEmpty icon={BookOpenText}
        title={data.counts.completed > 0 ? "Bạn không còn chủ đề đang học dở" : "Bắt đầu với chủ đề bạn quan tâm"}
        description={data.counts.completed > 0 ? "Khám phá thêm một chủ đề để tiếp tục luyện tập." : "Chọn một chủ đề để học tiếng Anh qua các tình huống thực tế."}
        to={ROUTES.TOPICS} action="Khám phá chủ đề" />;
      return <div className="space-y-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="flex min-w-0 items-start gap-4">
            <span aria-hidden="true" className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-learning-mint text-primary">
              <BookOpenText className="size-5" />{topic.coverUrl && <img src={topic.coverUrl} alt="" className="absolute inset-0 size-full object-cover" onError={event => { event.currentTarget.hidden = true; }} />}
            </span>
            <div className="min-w-0 space-y-1"><h3 lang={topic.titleEn ? "en" : "vi"} className="break-words text-headline-sm font-semibold">{topic.titleEn || topic.titleVi}</h3>
              {topic.titleVi && topic.titleVi !== topic.titleEn && <p className="text-label-lg text-on-surface-variant">{topic.titleVi}</p>}
              {topic.cefrLevel && <HomeBadge>{topic.cefrLevel}</HomeBadge>}
            </div>
          </div>
          <HomeAction to={topicDetailPath(topic.topicId, ROUTES.MY_TOPICS)}>Mở chủ đề</HomeAction>
        </div>
        <div className="space-y-3 border-t border-learning-outline pt-4">
          {topic.currentItem ? <p className="text-label-lg font-medium text-primary">Đang học: {topic.currentItem.title}</p>
            : topic.nextItem && <p className="text-label-lg text-on-surface-variant">Tiếp theo: {topic.nextItem.title}</p>}
          <HomeProgress label="Tiến độ chủ đề" completed={topic.progress.completedItemCount} total={topic.progress.totalItemCount} suffix="tình huống đã hoàn thành" percent={topic.progress.percent} />
        </div>
      </div>;
    }}</HomeQueryState>
  </HomeSection>;
}
