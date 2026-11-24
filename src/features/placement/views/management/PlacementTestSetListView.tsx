import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { ListPagination } from "@shared/components/management/ListPagination";
import { MANAGEMENT_PATHS, MANAGEMENT_SET_LABEL } from "@features/placement/constants/placement-management";
import { usePlacementManagement } from "@features/placement/hooks/placement-management-context";
import type { ManagementTestSet } from "@features/placement/types/placement-management.types";
import { ManagementBadge, ManagementButton, ManagementCard, ManagementConfirm, ManagementEmpty, ManagementField, ManagementHeader, managementInputClass } from "@features/placement/components/management/PlacementManagementUi";

export default function PlacementTestSetListView() {
  const { state, service, busy, run } = usePlacementManagement();
  const navigate = useNavigate();
  const alive = useRef(true);
  const pending = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [action, setAction] = useState<{ set: ManagementTestSet; kind: "delete" | "archive" | "version" } | null>(null);
  const filtered = state.testSets.filter(set => (!status || set.status === status) && `${set.code} ${set.name}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const start = (activePage - 1) * pageSize;
  const create = async () => {
    if (busy || pending.current || !name.trim()) return;
    pending.current = true;
    const next = await run(() => service.createSet(name.trim()), "Đã tạo bản nháp.");
    pending.current = false;
    if (next && alive.current) navigate(MANAGEMENT_PATHS.editSet(next.id));
  };
  const confirm = async () => {
    if (!action || busy || pending.current) return;
    pending.current = true;
    const current = action;
    const result = await run(async () => {
      if (current.kind === "version") return service.newVersion(current.set.id);
      if (current.kind === "delete") await service.deleteSet(current.set);
      else await service.archiveSet(current.set);
      return true;
    }, current.kind === "delete" ? "Đã xóa bản nháp." : current.kind === "archive" ? "Đã lưu trữ bộ đề." : "Đã tạo phiên bản mới.");
    pending.current = false;
    if (result !== null && alive.current) {
      setAction(null);
      if (typeof result !== "boolean") navigate(MANAGEMENT_PATHS.editSet(result.id));
    }
  };
  return <><ManagementHeader title="Bộ đề Placement" description="Tạo bộ đề 20 câu · 15 phút · Reading & Listening."><ManagementButton disabled={busy} onClick={() => { setName(""); setCreateOpen(true); }}>+ Tạo bộ đề</ManagementButton></ManagementHeader><ManagementCard className="mb-5"><div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="lg:col-span-2"><ManagementField label="Tìm bộ đề"><input className={managementInputClass} placeholder="Mã hoặc tên bộ đề…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></ManagementField></div><ManagementField label="Trạng thái"><select className={managementInputClass} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Tất cả</option>{Object.entries(MANAGEMENT_SET_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></ManagementField><ManagementButton variant="outline" onClick={() => { setSearch(""); setStatus(""); setPage(1); }}>Đặt lại</ManagementButton></div></ManagementCard><ManagementCard className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full text-left text-body-md"><thead className="bg-surface-container-low text-label-lg text-on-surface-variant"><tr>{["Bộ đề", "Số câu", "Trạng thái", "Thao tác"].map(label => <th className="px-5 py-4 font-semibold" key={label}>{label}</th>)}</tr></thead><tbody>{filtered.slice(start, start + pageSize).map(set => <tr key={set.id} className="border-t border-outline-variant"><td className="px-5 py-4"><Link className="font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary" to={MANAGEMENT_PATHS.previewSet(set.id)}>{set.name}</Link></td><td className="px-5 py-4">{set.questionIds.length}/20{set.questionIds.length < 20 && <p className="text-label-sm text-on-surface-variant">Còn thiếu {20 - set.questionIds.length} câu</p>}</td><td className="px-5 py-4"><ManagementBadge tone={set.status === "PUBLISHED" ? "success" : set.status === "DRAFT" ? "warning" : "neutral"}>{set.lockedSeed ? "Đề có sẵn · Chỉ xem" : MANAGEMENT_SET_LABEL[set.status]}</ManagementBadge></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><ManagementButton variant="ghost" disabled={busy} onClick={() => navigate(set.status === "DRAFT" && !set.lockedSeed ? MANAGEMENT_PATHS.editSet(set.id) : MANAGEMENT_PATHS.previewSet(set.id))}>{set.status === "DRAFT" && !set.lockedSeed ? "Soạn đề" : "Xem bộ đề"}</ManagementButton>{set.status === "DRAFT" && !set.lockedSeed ? <ManagementButton variant="ghost" className="text-error" disabled={busy} onClick={() => setAction({ set, kind: "delete" })}>Xóa bản nháp</ManagementButton> : <ManagementButton variant="ghost" disabled={busy} onClick={() => setAction({ set, kind: "version" })}>Tạo phiên bản mới</ManagementButton>}{set.status === "PUBLISHED" && <ManagementButton variant="ghost" disabled={busy} onClick={() => setAction({ set, kind: "archive" })}>Lưu trữ</ManagementButton>}</div></td></tr>)}</tbody></table>{filtered.length === 0 && <ManagementEmpty title="Chưa có bộ đề phù hợp" description="Thử thay đổi bộ lọc hoặc tạo bộ đề mới." />}</div><ListPagination compact total={filtered.length} from={filtered.length ? start + 1 : 0} to={Math.min(start + pageSize, filtered.length)} itemNoun="bộ đề" page={activePage} pageCount={pageCount} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} /></ManagementCard><p className="mt-4 text-label-sm text-on-surface-variant">Bộ đề đã xuất bản được bảo toàn theo phiên bản.</p><Dialog open={createOpen} onOpenChange={open => { if (!busy) setCreateOpen(open); }}><DialogContent className="bg-surface-container-lowest" showCloseButton={!busy}><DialogHeader><DialogTitle>Tạo bộ đề Placement</DialogTitle><DialogDescription>Bắt đầu với bản nháp trống rồi chọn câu hỏi từ ngân hàng.</DialogDescription></DialogHeader><form onSubmit={event => { event.preventDefault(); void create(); }}><ManagementField label="Tên bộ đề *"><input className={managementInputClass} value={name} required maxLength={160} disabled={busy} onChange={event => setName(event.target.value)} /></ManagementField><DialogFooter className="mt-5"><ManagementButton type="button" variant="outline" disabled={busy} onClick={() => setCreateOpen(false)}>Hủy</ManagementButton><ManagementButton type="submit" disabled={busy || !name.trim()}>{busy ? "Đang tạo…" : "Tạo bản nháp"}</ManagementButton></DialogFooter></form></DialogContent></Dialog><ManagementConfirm open={!!action} busy={busy} title={action?.kind === "delete" ? "Xóa bản nháp?" : action?.kind === "archive" ? "Lưu trữ bộ đề?" : "Tạo phiên bản mới?"} description={action?.kind === "delete" ? `Xóa bản nháp “${action.set.name}”. Thao tác này không thể hoàn tác.` : action?.kind === "archive" ? "Bộ đề ngừng được chọn cho lượt làm mới. Bản chụp và lịch sử lượt làm được giữ nguyên." : "Tạo bản nháp mới để chỉnh sửa. Phiên bản hiện tại vẫn được giữ nguyên."} onClose={() => setAction(null)} onConfirm={() => void confirm()} /></>;
}
