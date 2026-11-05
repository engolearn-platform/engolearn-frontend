import { Outlet } from "react-router";
import { type ComponentProps, type ReactNode } from "react";
import LearningBottomNav from "./components/LearningBottomNav";
import LearningSidebar from "./components/LearningSidebar";
import LearningTopBar from "./components/LearningTopBar";

export default function LearningLayout({ header, profile }: { header?: ReactNode; profile?: NonNullable<ComponentProps<typeof LearningSidebar>>["profile"] } = {}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      <LearningSidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        {header ?? <LearningTopBar userName="Đức" streakDays={7} />}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <LearningBottomNav />
    </div>
  );
}
