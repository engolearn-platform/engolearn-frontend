import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { Card } from "@shared/components";
import { useFetch } from "@shared/hooks";
import { useSubscriptionManagement } from "@features/subscription/hooks/useSubscriptionManagement";
import { subscriptionManagementService as service } from "@features/subscription/services/subscriptionManagement.service";
import ConfigurationEditor from "@features/subscription/components/management/ConfigurationEditor";
import { VersionContent, VersionSummary } from "@features/subscription/components/management/ConfigurationVersionDetail";
import { SelectField, VietnamTime } from "@features/subscription/components/management/ConfigurationFields";
import type { ConfigurationContent, ConfigurationScope, ConfigurationVersion, PublicationResult } from "@features/subscription/types/subscriptionManagement.types";
import { ROUTES } from "@shared/constants";

function blankConfiguration(scope: ConfigurationScope): ConfigurationContent { return { displayName: "", description: null, displayOrder: scope === "TRIAL" ? 0 : NaN, benefits: [], billingOptions: [], quotaRules: [] }; }

function VersionDialog({ scope, version, canEdit, onClose, onEdit }: { scope: ConfigurationScope; version: number; canEdit: boolean; onClose: () => void; onEdit: (version: ConfigurationVersion) => void }) {
  const state = useFetch(useCallback((signal: AbortSignal) => service.version(scope, version, signal), [scope, version]));
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{scope} · Chi tiết phiên bản {version}</DialogTitle><DialogDescription>Lịch sử được lưu bất biến. Sao chép nội dung chỉ khởi tạo biểu mẫu phiên bản mới.</DialogDescription></DialogHeader>{state.loading ? <p role="status">Đang tải chi tiết…</p> : state.error ? <div className="space-y-3"><p role="alert">Chưa thể tải chi tiết phiên bản. {state.error.code}</p><Button onClick={state.refetch} variant="outline">Thử lại</Button></div> : state.data && <><VersionContent version={state.data} /><Button disabled={!canEdit} onClick={() => onEdit(state.data!)}>Tạo phiên bản mới từ nội dung này</Button></>}</DialogContent></Dialog>;
}
function History({ scope, onDetail }: { scope: ConfigurationScope; onDetail: (version: number) => void }) {
  const [before, setBefore] = useState<number | undefined>();
  const state = useFetch(useCallback((signal: AbortSignal) => service.history(scope, signal, before), [scope, before]));
  return <Card className="min-w-0 space-y-4 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="text-headline-md font-semibold">Lịch sử phiên bản</h2>{state.loading ? <p role="status">Đang tải lịch sử…</p> : state.error ? <div className="space-y-3"><p role="alert">Chưa thể tải lịch sử. {state.error.code}</p><Button onClick={state.refetch} variant="outline">Tải lại lịch sử</Button></div> : state.data && <>{state.data.items.length === 0 ? <p className="text-muted-foreground">Không có phiên bản trong trang lịch sử này.</p> : <div className="max-w-full overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Các phiên bản {scope}, mới nhất trước</caption><thead><tr className="border-b border-border"><th className="p-3">Phiên bản</th><th className="p-3">Trạng thái</th><th className="whitespace-nowrap p-3">Thời điểm áp dụng (Việt Nam)</th><th className="p-3">Chi tiết</th></tr></thead><tbody>{state.data.items.map(v => <tr key={v.version} className="border-b border-border"><td className="p-3">v{v.version}</td><td className="p-3">{v.status}</td><td className="whitespace-nowrap p-3"><VietnamTime value={v.effectiveAt} /></td><td className="p-3"><Button variant="outline" onClick={() => onDetail(v.version)} aria-label={`Xem phiên bản ${v.version}`}>Xem</Button></td></tr>)}</tbody></table></div>}<div className="flex flex-wrap gap-3">{before && <Button variant="outline" onClick={() => setBefore(undefined)}>Về trang mới nhất</Button>}{state.data.nextBeforeVersion !== null && <Button variant="outline" onClick={() => setBefore(state.data!.nextBeforeVersion!)}>Xem phiên bản cũ hơn</Button>}</div></>}</Card>;
}
function ScopeContent({ scope, surface, onEditing }: { scope: ConfigurationScope; surface: "plans" | "quotas"; onEditing: (editing: boolean) => void }) {
  const state = useSubscriptionManagement(scope);
  const [editor, setEditor] = useState<{ content: ConfigurationContent; serial: number } | null>(null);
  const [detail, setDetail] = useState<number | null>(null);
  const [accepted, setAccepted] = useState<PublicationResult | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { onEditing(!!editor); return () => onEditing(false); }, [editor, onEditing]);
  const config = state.data?.configuration;
  const blocked = !!config?.pending || !!config?.activationPending;
  function edit(content: ConfigurationContent) { setDetail(null); setEditor({ content, serial: Date.now() }); }
  function reload() { setEditor(null); state.refetch(); setRefresh(value => value + 1); }
  return <div className="min-w-0 space-y-6">
    {accepted && <Card className="space-y-2 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="text-lg font-semibold text-primary" role="status">Máy chủ đã chấp nhận phiên bản v{accepted.version} · {accepted.scope}</h2><p>Thời điểm áp dụng thực tế: <VietnamTime value={accepted.effectiveAt} /> (giờ Việt Nam)</p><p className="text-sm text-muted-foreground">Đã nhận tại <VietnamTime value={accepted.acceptedAt} />. Kết quả chấp nhận được giữ lại ngay cả khi tải lại cấu hình thất bại.</p></Card>}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm leading-6 text-muted-foreground">{config ? <>Dữ liệu máy chủ tại <VietnamTime value={config.serverTime} /> (giờ Việt Nam)</> : "Đọc cấu hình từ máy chủ"}</p><Button variant="outline" disabled={!!editor || state.loading} onClick={reload}>Tải lại cấu hình</Button></div>
    {state.loading && <p role="status">Đang tải cấu hình…</p>}
    {state.error && <Card className="space-y-3 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="text-lg font-semibold" role="alert">{state.error.status === 401 || state.error.status === 403 ? "Phiên đăng nhập không có quyền truy cập" : "Cấu hình chưa khả dụng"}</h2><p className="leading-6 text-muted-foreground">{state.error.code ? state.error.message : "Chưa nhận được cấu hình hợp lệ. Vui lòng tải lại; không thể suy ra dữ liệu trống từ lỗi này."}</p>{state.error.code && <p className="text-sm">Mã: {state.error.code}</p>}<Button variant="outline" disabled={!!editor} onClick={reload}>Thử tải lại</Button></Card>}
    {state.data && config && <><div className="grid min-w-0 gap-4 md:grid-cols-2"><VersionSummary label="Đang áp dụng" version={config.current} /><VersionSummary label="Đã lên lịch / chờ xử lý" version={config.pending} /></div>{config.activationPending && <p role="status" className="rounded-xl bg-muted p-4 leading-6">Phiên bản đã đến thời điểm áp dụng cho lựa chọn quyền lợi; tiến trình kích hoạt đang chờ xử lý. Chưa thể xuất bản thêm.</p>}{blocked && <p className="rounded-xl bg-muted p-4 leading-6">Có phiên bản chờ. Cấu hình chỉ đọc; không thể ghi đè hoặc hủy phiên bản đã lưu.</p>}
      {config.current ? <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => setDetail(config.current!.version)}>Xem cấu hình hiện tại</Button><Button disabled={blocked || !!editor} onClick={() => edit(config.current!.content)}>Tạo phiên bản mới từ hiện tại</Button></div> : <Card className="space-y-3 rounded-2xl border-border bg-card p-5 shadow-none"><p className="leading-6">Premium chưa có cấu hình hiện tại. Nhập đầy đủ thông tin và hạn mức để tạo phiên bản đầu tiên. Không có giá được điền sẵn.</p><Button disabled={blocked || !!editor} onClick={() => edit(blankConfiguration(scope))}>Nhập cấu hình Premium mới</Button></Card>}
      <History key={refresh} scope={scope} onDetail={setDetail} />
      {editor && <ConfigurationEditor key={editor.serial} initial={editor.content} revision={config.revision} scope={scope} catalog={state.data.catalog} surface={surface} requiredTypes={config.current?.content.quotaRules.map(q => q.quotaType) ?? []} onCancel={() => setEditor(null)} onAccepted={result => { setAccepted(result); setEditor(null); state.refetch(); setRefresh(value => value + 1); }} />}
    </>}
    {detail !== null && <VersionDialog key={detail} scope={scope} version={detail} canEdit={!blocked && !!state.data && !editor} onClose={() => setDetail(null)} onEdit={v => edit(v.content)} />}
  </div>;
}
export default function SubscriptionManagementView({ surface }: { surface: "plans" | "quotas" }) {
  const [scope, setScope] = useState<ConfigurationScope>("FREE");
  const [editing, setEditing] = useState(false);
  return <div className="mx-auto min-w-0 max-w-6xl space-y-6 p-5"><header className="space-y-2"><p className="font-semibold text-primary">SUBSCRIPTION MANAGEMENT</p><h1 className="text-headline-lg font-bold">{surface === "plans" ? "Quản lý gói học & quyền lợi" : "Cấu hình hạn mức"}</h1><p className="leading-6 text-muted-foreground">Quản lý các phiên bản bất biến. Free áp dụng vào nửa đêm tiếp theo tại Việt Nam; Trial và Premium áp dụng cho kỳ mới.</p></header><nav aria-label="Quản lý đăng ký" className="flex flex-wrap gap-3 border-b border-border pb-4">{[[ROUTES.ADMIN_SUBSCRIPTION_PLANS, "Gói học & quyền lợi"], [ROUTES.ADMIN_SUBSCRIPTION_QUOTAS, "Cấu hình hạn mức"]].map(([to, label]) => <NavLink key={to} to={to} aria-disabled={editing} onClick={event => { if (editing) event.preventDefault(); }} className={({ isActive }) => `rounded-xl px-4 py-3 font-semibold ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{label}</NavLink>)}</nav><div className="max-w-sm"><SelectField label="Phạm vi cấu hình" id="configurationScope" disabled={editing} value={scope} onChange={e => setScope(e.target.value as ConfigurationScope)}><option value="FREE">Free</option><option value="TRIAL">Trial (quyền lợi dùng thử)</option><option value="PREMIUM">Premium</option></SelectField>{editing && <p className="mt-2 text-sm text-muted-foreground">Hoàn tất hoặc hủy biểu mẫu trước khi đổi phạm vi hay trang chỉnh sửa.</p>}</div><ScopeContent key={scope} scope={scope} surface={surface} onEditing={setEditing} /></div>;
}
export function SubscriptionPlanManagementView() { return <SubscriptionManagementView surface="plans" />; }
export function SubscriptionQuotaManagementView() { return <SubscriptionManagementView surface="quotas" />; }
