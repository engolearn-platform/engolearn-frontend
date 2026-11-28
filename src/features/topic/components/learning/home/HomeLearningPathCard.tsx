import { Target } from "lucide-react";
import { ROUTES } from "@shared/constants";
import type { HomeDashboard } from "@features/topic/hooks/useHomeDashboard";
import type { LearningPathHomeSummary } from "@features/learning-path/contract";
import { HomeAction, HomeBadge, HomeEmpty, HomeProgress, HomeQueryState, HomeSection } from "./HomeDashboardParts";

function emptyPath(data: LearningPathHomeSummary) {
  switch (data.state) {
    case "RECOMMENDATION_AVAILABLE": return { title: "Lộ trình đề xuất đã sẵn sàng", description: "Xem đề xuất từ kết quả đánh giá để chọn kỹ năng bạn muốn tập trung luyện.",
      action: "Xem lộ trình đề xuất", to: data.suggestion?.assessmentAttemptId ? `/assessment/attempts/${encodeURIComponent(data.suggestion.assessmentAttemptId)}/result` : "/assessment/history" };
    case "PAST_PATHS_ONLY": return { title: "Bạn không có lộ trình đang hoạt động", description: "Xem lại các lộ trình đã kết thúc và kết quả luyện tập của bạn.", action: "Xem các lộ trình", to: ROUTES.LEARNING_PATHS };
    case "NO_WEAK_SKILLS": return { title: "Chưa có lộ trình đề xuất mới", description: "Kết quả đánh giá gần nhất không có kỹ năng thuộc nhóm cần tạo lộ trình. Bạn có thể tiếp tục học theo chủ đề.", action: "Khám phá chủ đề", to: ROUTES.TOPICS };
    case "NO_ELIGIBLE_SKILLS": return { title: "Chưa có kỹ năng đủ điều kiện tạo lộ trình", description: "Hiện chưa có lộ trình đề xuất từ kết quả này. Hãy khám phá chủ đề hoặc tiếp tục học ngữ pháp.", action: "Khám phá chủ đề", to: ROUTES.TOPICS };
    default: return { title: "Bạn chưa có lộ trình đang hoạt động", description: "Làm bài đánh giá để nhận đề xuất luyện các micro-skill phù hợp với kết quả của bạn.", action: "Khám phá bài đánh giá", to: "/assessment" };
  }
}

export function HomeLearningPathCard({ query, skills }: { query: HomeDashboard["paths"]; skills: HomeDashboard["skills"] }) {
  return <HomeSection id="home-paths" title="Lộ trình đang hoạt động" link={{ to: ROUTES.LEARNING_PATHS, label: "Xem tất cả" }}>
    <HomeQueryState query={query} label="lộ trình học tập">{data => {
      const path = data.currentPath;
      if (!path) { const empty = emptyPath(data); return <HomeEmpty icon={Target} {...empty} />; }
      const definitions = path.microSkills.map(name => skills.data?.find(skill => skill.canonicalName === name));
      const categories = new Set(definitions.map(skill => skill?.skill).filter(Boolean));
      const title = categories.has("READING") && categories.has("LISTENING") ? "Luyện đọc và nghe" : categories.has("READING") ? "Luyện kỹ năng đọc" : categories.has("LISTENING") ? "Luyện kỹ năng nghe" : "Lộ trình luyện tập micro-skill";
      return <div className="space-y-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0 space-y-2"><h3 className="break-words text-headline-sm font-semibold">{title}</h3>
            <div className="flex flex-wrap items-center gap-2">{path.level && <HomeBadge>{path.level}</HomeBadge>}<HomeBadge mint>{path.status === "NOT_STARTED" ? "Chưa bắt đầu" : "Đang học"}</HomeBadge>
              {path.currentWeekNo !== null && path.totalWeeks !== null && <span className="text-label-lg text-on-surface-variant">Tuần {path.currentWeekNo}/{path.totalWeeks}</span>}</div>
            <p className="break-words text-label-lg text-on-surface-variant">{path.microSkills.map((name, index) => definitions[index]?.displayNameVi || name).join(" · ")}</p>
          </div>
          <HomeAction primary={path.canPractice} to={ROUTES.LEARNING_PATH_DETAIL.replace(":pathId", encodeURIComponent(path.pathId))}>{path.canPractice ? "Tiếp tục lộ trình" : "Xem lộ trình"}</HomeAction>
        </div>
        <div className="space-y-3 border-t border-learning-outline pt-4">
          <HomeProgress label="Tiến độ thực hiện" completed={path.answered} total={path.assigned} suffix="câu đã trả lời" />
          {path.correct !== null && path.answered !== null && <p className="text-label-lg text-on-surface-variant">{path.answered > 0 ? `Kết quả luyện tập: đúng ${path.correct}/${path.answered} câu đã trả lời` : "Chưa có câu trả lời để tính kết quả luyện tập."}</p>}
        </div>
      </div>;
    }}</HomeQueryState>
  </HomeSection>;
}
