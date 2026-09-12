import { EmptyState, Loading } from "@shared/components";
import { useState } from "react";
import CefrTabs from "../components/CefrTabs";
import NextLessonCard from "../components/NextLessonCard";
import RoadmapHeader from "../components/RoadmapHeader";
import UnitTimeline from "../components/UnitTimeline";
import WeeklyGoalCard from "../components/WeeklyGoalCard";
import { CEFR_TABS, useGrammarRoadmap } from "../hooks/useGrammarRoadmap";
import type { CefrLevel } from "../types/grammar.types";

export default function GrammarRoadmapView() {
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
