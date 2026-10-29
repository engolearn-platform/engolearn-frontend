import { Outlet } from "react-router";
import { GraduationCap, UserRound } from "lucide-react";
import LearningSidebar from "@/core/layouts/components/LearningSidebar";
import LearningBottomNav from "@/core/layouts/components/LearningBottomNav";
import { useTopicViewer } from "@features/topic/hooks/topic-viewer.context";

export default function TopicCatalogLayout() {
  const viewer = useTopicViewer();
  const name = viewer.kind === "GUEST" ? "Khách" : viewer.displayName ?? "Học viên";
  return <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
    <LearningSidebar profile={{ name, level: viewer.cefrLevel }} />
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-outline-variant/30 bg-surface-container-lowest px-5 md:px-8">
        <div className="flex items-center gap-3 text-primary"><GraduationCap className="size-7 lg:hidden" aria-hidden="true" /><span className="text-label-lg font-semibold">Học theo chủ đề</span></div>
        <div className="flex items-center gap-3"><span className="hidden text-label-lg text-on-surface-variant sm:inline">{name}</span>
          {viewer.cefrLevel && <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm font-semibold text-on-secondary-container">{viewer.cefrLevel}</span>}
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-on-primary"><UserRound className="size-5" aria-label={name} /></span>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-0"><Outlet /></main>
    </div>
    <LearningBottomNav />
  </div>;
}
