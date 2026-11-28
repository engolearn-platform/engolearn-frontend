import { homeDate } from "@features/topic/utils/home-dashboard";
import { ClipboardCheck } from "lucide-react";
import type { HomeDashboard } from "@features/topic/hooks/useHomeDashboard";
import { HomeAction, HomeBadge, HomeEmpty, HomeProgress, HomeQueryState, HomeSection } from "./HomeDashboardParts";

export function HomeAssessmentCard({ query, isNewLearner }: { query: HomeDashboard["assessment"]; isNewLearner: boolean }) {
  return <HomeSection id="home-assessment" title="Đánh giá năng lực gần nhất" link={{ to: "/assessment/history", label: "Lịch sử đánh giá" }}>
    <HomeQueryState query={query} label="kết quả đánh giá">{data => {
      const result = data.latestResult;
      if (!result) return <HomeEmpty icon={ClipboardCheck} title="Bạn chưa có kết quả đánh giá"
        description="Làm bài đánh giá để xem kết quả đọc, nghe và các kỹ năng cần luyện."
        to="/assessment" action="Khám phá bài đánh giá" primary={isNewLearner} />;
      return <div className="space-y-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <HomeBadge mint>Bài kiểm tra{result.level ? ` ${result.level}` : ""}</HomeBadge>
            {homeDate(result.submittedAt) && <span className="text-label-lg text-on-surface-variant">{homeDate(result.submittedAt)}</span>}
            {result.demonstration && <HomeBadge>Dữ liệu trải nghiệm</HomeBadge>}
          </div>
          <HomeAction to={`/assessment/attempts/${encodeURIComponent(result.attemptId)}/result`}>Xem kết quả</HomeAction>
        </div>
        <div className="grid gap-5 sm:grid-cols-4 sm:items-center">
          <div className="space-y-1"><p className="flex items-baseline gap-1.5"><strong className="text-headline-lg font-bold text-primary">{result.score ?? "—"}</strong><span className="text-body-md text-on-surface-variant">/{result.maxScore}</span></p>
            <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">Điểm tổng</p></div>
          <div className="space-y-4 sm:col-span-3">
            <HomeProgress label="Đọc hiểu" completed={result.readingCorrect} total={result.readingTotal} suffix="câu đúng" />
            <HomeProgress label="Nghe hiểu" completed={result.listeningCorrect} total={result.listeningTotal} suffix="câu đúng" />
          </div>
        </div>
        <div className="space-y-2 border-t border-learning-outline pt-4">
          {result.weakSkills.length > 0 ? <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-label-lg text-on-surface-variant">Kỹ năng cần luyện:</span>
            {result.weakSkills.slice(0, 2).map(skill => <HomeBadge key={skill.code}>{skill.name}</HomeBadge>)}
          </div> : <p className="text-label-lg text-on-surface-variant">{result.fullAnalysis ? "Kết quả này không ghi nhận kỹ năng thuộc nhóm cần luyện thêm." : "Xem kết quả để tìm hiểu phân tích hiện có của bạn."}</p>}
          {!result.fullAnalysis && <p className="text-label-sm text-on-surface-variant">Phân tích giới hạn theo quyền lợi hiện tại.</p>}
        </div>
      </div>;
    }}</HomeQueryState>
  </HomeSection>;
}
