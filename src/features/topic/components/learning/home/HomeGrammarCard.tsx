import { BookOpen } from "lucide-react";
import { ROUTES } from "@shared/constants";
import type { HomeDashboard } from "@features/topic/hooks/useHomeDashboard";
import { HomeAction, HomeBadge, HomeEmpty, HomeProgress, HomeQueryState, HomeSection } from "./HomeDashboardParts";

export function HomeGrammarCard({ query }: { query: HomeDashboard["grammar"] }) {
  return <HomeSection id="home-grammar" title="Ngữ pháp" link={{ to: ROUTES.GRAMMAR, label: "Xem ngữ pháp" }}>
    <HomeQueryState query={query} label="tiến độ ngữ pháp">{data => {
      const topic = data.currentTopic;
      if (!topic) return <HomeEmpty icon={BookOpen} title={data.state === "NOT_STARTED" ? "Bắt đầu học ngữ pháp" : "Bạn không còn bài ngữ pháp đang học dở"}
        description={data.state === "NOT_STARTED" ? "Khám phá các chủ đề phù hợp với cấp độ đang mở của bạn." : "Khám phá nội dung tiếp theo trong các cấp độ đã mở của bạn."}
        to={ROUTES.GRAMMAR} action="Khám phá ngữ pháp" />;
      const lesson = topic.lesson;
      const destination = `${ROUTES.GRAMMAR}/topics/${encodeURIComponent(topic.topicId)}/lessons/${encodeURIComponent(lesson.lessonId)}`;
      return <div className="space-y-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h3 lang={topic.titleEn ? "en" : "vi"} className="break-words text-headline-sm font-semibold">{topic.titleEn || topic.titleVi}</h3>
              {topic.titleVi && topic.titleVi !== topic.titleEn && <span className="text-label-lg text-on-surface-variant">{topic.titleVi}</span>}<HomeBadge>{topic.level}</HomeBadge></div>
            <p className="text-label-lg">{lesson.status === "IN_PROGRESS" ? "Bài đang học" : "Bài tiếp theo"}: <span lang={lesson.titleEn ? "en" : "vi"} className="font-semibold">{lesson.titleEn || lesson.titleVi}</span>
              {lesson.titleEn && lesson.titleVi && lesson.titleEn !== lesson.titleVi && <span className="text-on-surface-variant"> · {lesson.titleVi}</span>}</p>
          </div>
          <HomeAction to={destination}>Tiếp tục ngữ pháp</HomeAction>
        </div>
        <div className="space-y-3 border-t border-learning-outline pt-4">
          <HomeProgress label="Tiến độ trong chủ đề" completed={topic.completedLessons} total={topic.totalLessons} suffix="bài đã hoàn thành" />
          {(lesson.lastScore !== null || lesson.bestScore !== null) && <p className="text-label-lg text-on-surface-variant">
            Kết quả của bài này{lesson.lastScore !== null && ` · Lần gần nhất: ${lesson.lastScore}/${lesson.maxScore}`}{lesson.bestScore !== null && ` · Tốt nhất: ${lesson.bestScore}/${lesson.maxScore}`}
          </p>}
        </div>
      </div>;
    }}</HomeQueryState>
  </HomeSection>;
}
