import { Outlet } from "react-router";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopBar from "./components/AdminTopBar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
