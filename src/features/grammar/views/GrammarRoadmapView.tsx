import { EmptyState, Loading } from "@shared/components";
import { useState } from "react";
import { useAuth } from "@shared/hooks";
import CefrTabs from "../components/CefrTabs";
import NextLessonCard from "../components/NextLessonCard";
import RoadmapHeader from "../components/RoadmapHeader";
import UnitTimeline from "../components/UnitTimeline";
import WeeklyGoalCard from "../components/WeeklyGoalCard";
import { CEFR_TABS, useGrammarRoadmap } from "../hooks/useGrammarRoadmap";
import type { CefrLevel } from "../types/grammar.types";

export default function GrammarRoadmapView() {
  const { isAuthenticated } = useAuth();
  const { roadmap, loading, error } = useGrammarRoadmap();
  const [activeLevel, setActiveLevel] = useState<CefrLevel>("A1");

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <EmptyState
          title="Không tải được lộ trình"
          description={
            error?.message ?? "Đã xảy ra lỗi khi tải lộ trình ngữ pháp."
          }
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 md:px-8 md:py-10">
        <header className="space-y-3">
          <span className="inline-flex rounded-full bg-learning-mint px-3 py-1 text-label-sm font-semibold text-primary">Bản xem trước</span>
          <h1 className="text-headline-lg font-bold">Lộ trình ngữ pháp</h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            Xem các chủ điểm trong lộ trình mẫu {roadmap.currentLevel}.
          </p>
        </header>
        <UnitTimeline units={roadmap.units} preview />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-5 lg:p-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <RoadmapHeader
            title="Lộ trình ngữ pháp"
            currentLevel={roadmap.currentLevel}
            overallProgress={roadmap.overallProgress}
          />
          <CefrTabs
            tabs={CEFR_TABS}
            active={activeLevel}
            onSelect={setActiveLevel}
          />
          <UnitTimeline units={roadmap.units} />
        </div>
        <aside className="flex w-full flex-col gap-6 lg:w-80 lg:shrink-0">
          <WeeklyGoalCard goal={roadmap.goal} />
          <NextLessonCard suggestion={roadmap.suggestion} />
        </aside>
      </div>
      <div className="h-20 md:hidden" aria-hidden="true" />
    </div>
  );
}
