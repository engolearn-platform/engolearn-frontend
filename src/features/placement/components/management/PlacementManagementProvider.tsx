import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "@shared/hooks";
import { placementManagementService as service } from "@features/placement/services/placement-management.service";
import { PlacementManagementContext } from "@features/placement/hooks/placement-management-context";
import { MANAGEMENT_PATHS } from "@features/placement/constants/placement-management";
import type { ManagementState } from "@features/placement/types/placement-management.types";
import { ManagementButton, ManagementCard } from "./PlacementManagementUi";

const emptyState: ManagementState = { schemaVersion: 1, questions: [], testSets: [], attempts: [] };

export default function PlacementManagementProvider() {
  const { user } = useAuth();
  return <ManagementSession key={user?.id} />;
}
function ManagementSession() {
  const { pathname } = useLocation();
  const onlyAttempts = pathname === MANAGEMENT_PATHS.attempts || pathname.startsWith(`${MANAGEMENT_PATHS.attempts}/`);
  const [data, setData] = useState<ManagementState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeLoad = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  const [notice, setNotice] = useState<{ text: string; failed: boolean } | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const refetch = useCallback(async () => {
    activeLoad.current?.abort();
    const request = new AbortController();
    activeLoad.current = request;
    setLoading(true);
    setError(null);
    try {
      const state = await service.getState(request.signal);
      if (request.signal.aborted) return false;
      setData(state);
      return true;
    } catch (cause) {
      if (!request.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Chưa tải được ngân hàng câu hỏi và bộ đề.");
      }
      return false;
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!onlyAttempts) void refetch();
    return () => activeLoad.current?.abort();
  }, [onlyAttempts, refetch]);
  const run = async <T,>(operation: () => Promise<T>, successMessage?: string): Promise<T | null> => {
    if (pending.current) return null;
    pending.current = true; setBusy(true); setNotice(null);
    try {
      const result = await operation();
      if (alive.current) {
        const refreshed = await refetch();
        if (!refreshed) {
          if (alive.current) setNotice({ text: "Thao tác đã lưu. Tải lại dữ liệu để xem thay đổi.", failed: false });
          return null;
        }
        if (alive.current && successMessage) setNotice({ text: successMessage, failed: false });
      }
      return result;
    } catch (cause) {
      if (alive.current) {
        const problem = cause as Error & { status?: number; fieldErrors?: { field: string; message: string }[] };
        const message = problem?.message || "Không thể hoàn tất thao tác.";
        const fields = problem?.fieldErrors?.map(field => field.message).slice(0, 5).join(" ");
        setNotice({ text: fields ? `${message} ${fields}` : message, failed: true });
      }
      return null;
    } finally { pending.current = false; if (alive.current) setBusy(false); }
  };
  return <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
    <nav aria-label="Quản trị Placement" className="mb-6 flex flex-wrap gap-2 lg:hidden">{[{to:MANAGEMENT_PATHS.sets,label:"Bộ đề"},{to:MANAGEMENT_PATHS.questions,label:"Ngân hàng câu hỏi"},{to:MANAGEMENT_PATHS.attempts,label:"Kết quả"}].map(item=><NavLink key={item.to} to={item.to} className={({isActive})=>`rounded-xl px-4 py-3 text-label-lg font-semibold focus-visible:outline-2 focus-visible:outline-primary ${isActive?"bg-primary text-on-primary":"bg-surface-container-lowest text-primary"}`}>{item.label}</NavLink>)}</nav>
    {notice && <div role={notice.failed?"alert":"status"} className={`mb-5 rounded-xl border p-4 ${notice.failed?"border-error/30 bg-error/10 text-error":"border-learning-mint-border bg-learning-mint text-primary"}`}>{notice.text}</div>}
    {!onlyAttempts && error && <ManagementCard className="mb-5"><p role="alert">{error}</p><ManagementButton className="mt-4" variant="outline" onClick={() => void refetch()}>Tải lại dữ liệu</ManagementButton></ManagementCard>}
    {!data && !onlyAttempts
      ? (!error && <ManagementCard><p role="status">Đang tải dữ liệu quản trị…</p></ManagementCard>)
      : <PlacementManagementContext.Provider value={{state:data ?? emptyState,service,busy:busy || (!onlyAttempts && (loading || !!error)),run,reload:()=>{void refetch();}}}><Outlet /></PlacementManagementContext.Provider>}
  </div>;
}
