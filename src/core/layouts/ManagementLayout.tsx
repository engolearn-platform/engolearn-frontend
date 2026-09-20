import { Outlet } from "react-router";
import ManagementSidebar from "./components/ManagementSidebar";
import ManagementTopBar from "./components/ManagementTopBar";

export default function ManagementLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      <ManagementSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ManagementTopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
