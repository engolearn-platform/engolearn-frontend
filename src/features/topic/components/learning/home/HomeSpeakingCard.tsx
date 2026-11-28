import { homeDate } from "@features/topic/utils/home-dashboard";
import { Mic } from "lucide-react";
import { Link } from "react-router";
import type { SpeakingHomeCriterion } from "@features/speaking/contract";
import type { HomeDashboard } from "@features/topic/hooks/useHomeDashboard";
import { ROUTES } from "@shared/constants";
import { HomeAction, HomeBadge, HomeEmpty, HomeQueryState, HomeSection } from "./HomeDashboardParts";

function criterionText(value: SpeakingHomeCriterion | null) {
  if (value?.status === "ASSESSED" && value.score !== null) return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value.score)}/${value.maxScore}`;
  return value?.status === "UNAVAILABLE" ? "Chưa có kết quả" : "Chưa đủ dữ liệu";
}

function speechTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return seconds < 60 ? `${seconds} giây` : `${Math.floor(seconds / 60)} phút${seconds % 60 ? ` ${seconds % 60} giây` : ""}`;
}

export function HomeSpeakingCard({ query }: { query: HomeDashboard["speaking"] }) {
  return <HomeSection id="home-speaking" title="Luyện nói với AI" link={{ to: ROUTES.SPEAKING_HISTORY, label: "Lịch sử luyện nói" }}>
    <HomeQueryState query={query} label="tiến độ luyện nói">{data => {
      const session = data.latestSession;
      if (!session) return <HomeEmpty icon={Mic} title="Bắt đầu cuộc trò chuyện đầu tiên"
        description="Chọn một chủ đề để luyện nói với AI và nhận phản hồi."
        to={ROUTES.TOPICS} action="Bắt đầu luyện nói" />;
      const destination = (session.status === "ENDED" ? ROUTES.SPEAKING_RESULT : ROUTES.SPEAKING_SESSION).replace(":sessionId", encodeURIComponent(session.sessionId));
      const status = { INITIALIZING: "Đang chuẩn bị", ACTIVE: "Đang luyện", CLOSING: "Đang kết thúc", ENDED: "Đã kết thúc" }[session.status];
      return <div className="space-y-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0 space-y-2"><h3 className="break-words text-headline-sm font-semibold">{session.title || "Buổi luyện gần nhất"}</h3>
            <div className="flex flex-wrap items-center gap-3"><HomeBadge mint>{status}</HomeBadge>{homeDate(session.createdAt) && <span className="text-label-lg text-on-surface-variant">{homeDate(session.createdAt)}</span>}</div>
          </div>
          <HomeAction to={destination}>{session.status === "ENDED" ? "Xem kết quả buổi gần nhất" : "Mở buổi luyện"}</HomeAction>
        </div>
        <div className="space-y-4 border-t border-learning-outline pt-4">
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            <div><dt className="text-label-lg text-on-surface-variant">Buổi luyện đã lưu</dt><dd className="font-semibold">{data.sessionCount}</dd></div>
            <div><dt className="text-label-lg text-on-surface-variant">Tổng thời lượng bạn nói</dt><dd className="font-semibold">{speechTime(data.speechDurationMs)}</dd></div>
          </dl>
          {session.criteria ? <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {([ ["Phát âm", session.criteria.pronunciation], ["Độ trôi chảy", session.criteria.fluency], ["Ngữ pháp", session.criteria.grammar], ["Từ vựng", session.criteria.vocabulary] ] as const).map(([label, value]) =>
              <div key={label}><dt className="text-label-lg text-on-surface-variant">{label}</dt><dd className="mt-1 text-label-lg font-semibold text-primary">{criterionText(value)}</dd></div>)}
          </dl> : <p className="text-label-lg text-on-surface-variant">{session.assessmentStatus === "PENDING" || session.assessmentStatus === "FINALIZING" ? "Kết quả đánh giá buổi luyện đang được xử lý." : "Buổi luyện này chưa có dữ liệu đánh giá để hiển thị."}</p>}
          <Link to={ROUTES.TOPICS} className="inline-flex min-h-12 items-center text-label-lg font-semibold text-primary hover:underline">Chọn chủ đề cho buổi luyện mới →</Link>
        </div>
      </div>;
    }}</HomeQueryState>
  </HomeSection>;
}
