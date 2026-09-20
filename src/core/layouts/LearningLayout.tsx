import { Outlet } from "react-router";
import LearningBottomNav from "./components/LearningBottomNav";
import LearningSidebar from "./components/LearningSidebar";
import LearningTopBar from "./components/LearningTopBar";

export default function LearningLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      <LearningSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <LearningTopBar userName="User" streakDays={7} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <LearningBottomNav />
    </div>
  );
}
