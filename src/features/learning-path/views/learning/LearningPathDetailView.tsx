import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyState, Loading } from "@shared/components";
import { ROUTES } from "@shared/constants";
import { useLearningPathDetail } from "@features/learning-path/hooks/useLearningPathDetail";
import { useWaitingWeekRefresh } from "@features/learning-path/hooks/useWaitingWeekRefresh";
import type {
  LearningPathDetail,
  LearningPathTab,
} from "@features/learning-path/types/learning-path-detail.types";
import LearningPathOverview from "@features/learning-path/components/learning/detail/LearningPathOverview";
import LearningPathTabs from "@features/learning-path/components/learning/detail/LearningPathTabs";
import LearningPathActiveWeek from "@features/learning-path/components/learning/detail/LearningPathActiveWeek";
import LearningPathClosedWeek from "@features/learning-path/components/learning/detail/LearningPathClosedWeek";
import LearningPathSummary from "@features/learning-path/components/learning/detail/LearningPathSummary";

function LearningPathDetailContent({ path }: { path: LearningPathDetail }) {
  const [searchParams] = useSearchParams();
  const requestedWeek = Number(searchParams.get("week"));
  const returnWeek = path.weeks.find((week) => week.number === requestedWeek && week.status !== "LOCKED");
  const [overviewExpanded, setOverviewExpanded] = useState(true);
  const [selectedTab, setSelectedTab] = useState<LearningPathTab>(
    returnWeek?.number ?? (path.status === "COMPLETED" ? "summary" : path.currentWeekNo ?? path.weeks.find((week) => week.status === "OPEN")?.number ?? 1),
  );
  const week = selectedTab === "summary"
    ? null
    : path.weeks.find((item) => item.number === selectedTab);

  return (
    <div className="mx-auto w-full max-w-[1300px] px-5 py-5 pb-24 lg:px-8 lg:py-8 xl:px-10">
      <Link
        to={ROUTES.LEARNING_PATHS}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Danh sách lộ trình
      </Link>

      <LearningPathOverview
        path={path}
        expanded={overviewExpanded}
        onToggle={() => setOverviewExpanded((value) => !value)}
      />

      <div className="mt-5 lg:mt-6">
        <LearningPathTabs path={path} selected={selectedTab} onSelect={setSelectedTab} />
      </div>

      <div id="learning-path-tab-panel" role="tabpanel" className="mt-5">
        {selectedTab === "summary" ? (
          <LearningPathSummary path={path} />
        ) : week?.status === "OPEN" ? (
          <LearningPathActiveWeek week={week} questionsPerDay={path.questionsPerDay ?? week.days[0]?.assigned ?? 0} />
        ) : week?.status === "CLOSED" ? (
          <LearningPathClosedWeek week={week} />
        ) : null}
      </div>
    </div>
  );
}

function DetailPage({ pathId }: { pathId: string }) {
  const { data, loading, error } = useLearningPathDetail(pathId);
  const [updatedPath, setUpdatedPath] = useState<LearningPathDetail | null>(null);
  const path = updatedPath ?? data;
  useWaitingWeekRefresh(path, setUpdatedPath);

  if (loading) {
    return <div className="mx-auto w-full max-w-[1300px] px-5 py-5 lg:px-8 lg:py-8 xl:px-10"><Loading size="lg" /></div>;
  }

  if (error || !path) {
    return (
      <div className="mx-auto w-full max-w-[1300px] px-5 py-5 lg:px-8 lg:py-8 xl:px-10">
        <EmptyState title="Không tải được lộ trình" description={error?.message ?? "Không tìm thấy Learning Path."} />
      </div>
    );
  }

  return <LearningPathDetailContent key={`${path.id}:${path.currentWeekNo}:${path.status}`} path={path} />;
}

export default function LearningPathDetailView() {
  const { pathId = "" } = useParams();
  return <DetailPage key={pathId} pathId={pathId} />;
}
