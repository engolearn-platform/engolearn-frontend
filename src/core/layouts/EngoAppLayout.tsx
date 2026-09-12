import { Outlet } from "react-router";
import AppBottomNav from "./components/AppBottomNav";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

export default function EngoAppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar userName="User" streakDays={7} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <AppBottomNav />
    </div>
  );
}
