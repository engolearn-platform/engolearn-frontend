import { Button } from "@/core/components/shadcn/button";
import { useAuth } from "@shared/hooks";
import { useDashboardSummary } from "@features/management-dashboard/hooks/useDashboardSummary";
import { DashboardOverview } from "@features/management-dashboard/components/DashboardOverview";
import { DashboardWorkspaces } from "@features/management-dashboard/components/DashboardWorkspaces";

function DashboardContent({ admin }: { admin: boolean }) {
  const summary = useDashboardSummary(admin);
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:py-10">
      <header className="space-y-2">
        <h1 className="text-headline-lg font-bold">Tổng quan</h1>
      </header>
      {summary.loading && (
        <p role="status" className="text-body-md text-on-surface-variant">
          Đang tải số liệu…
        </p>
      )}
      {summary.error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-learning-outline bg-white p-5"
        >
          <p className="text-body-md text-on-surface-variant">
            Chưa thể tải tổng quan. Vui lòng thử lại.
          </p>
          <Button type="button" variant="outline" className="min-h-12" onClick={summary.refetch}>
            Thử lại
          </Button>
        </div>
      )}
      {summary.data && <DashboardOverview summary={summary.data} />}
      <DashboardWorkspaces summary={summary.data ?? undefined} />
    </div>
  );
}

export default function ManagementDashboardView() {
  const { identityGeneration, user, isAdmin } = useAuth();
  const role = user?.role ?? "guest";
  return <DashboardContent key={`${identityGeneration}:${user?.id ?? "guest"}:${role}`} admin={isAdmin()} />;
}
