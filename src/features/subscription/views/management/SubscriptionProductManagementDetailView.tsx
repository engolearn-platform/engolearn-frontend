import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { Card } from "@shared/components/Card";
import { useFetch } from "@shared/hooks";
import ProductDraftEditor from "@features/subscription/components/management/ProductDraftEditor";
import { ROUTES } from "@shared/constants";
import { subscriptionProductService } from "@features/subscription/services/subscriptionProduct.service";
import type { ProductDetail, ProductPreview } from "@features/subscription/types/subscriptionProduct.types";
import type { ConfigurationContent } from "@features/subscription/types/subscriptionManagement.types";
import { fieldClass, Field, VietnamTime } from "@features/subscription/components/management/ConfigurationFields";

const EMPTY_PRODUCT_CONTENT: ConfigurationContent = { displayName: "", description: null, displayOrder: 0, benefits: [], billingOptions: [], quotaRules: [] };

function vietnamDateTimeValue(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function parseVietnamDateTime(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const milliseconds = Date.parse(`${value}:00+07:00`);
  if (!Number.isFinite(milliseconds)) return null;
  const instant = new Date(milliseconds).toISOString();
  return vietnamDateTimeValue(instant) === value ? instant : null;
}

function ProductVersionDialog({ planCode, version, onClose }: { planCode: string; version: number; onClose: () => void }) {
  const fetcher = useCallback((signal: AbortSignal) => subscriptionProductService.version(planCode, version, signal), [planCode, version]);
  const state = useFetch(fetcher);
  const snapshot = state.data?.data;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Phiên bản v{version}</DialogTitle><DialogDescription className="leading-6">Nội dung đã xuất bản là bản ghi bất biến.</DialogDescription></DialogHeader>
      {state.loading && <p role="status" className="leading-6 text-muted-foreground">Đang tải nội dung phiên bản…</p>}
      {state.error && <div className="space-y-3"><p role="alert" className="leading-6 text-destructive">{state.error.message}</p><Button variant="outline" className="min-h-12 rounded-xl" onClick={state.refetch}>Thử lại</Button></div>}
      {snapshot && <div className="space-y-4"><p className="text-sm text-muted-foreground">Áp dụng: <VietnamTime value={snapshot.effectiveAt} /></p><div><h3 className="font-semibold">{snapshot.content.displayName}</h3>{snapshot.content.description && <p className="mt-1 leading-6 text-muted-foreground">{snapshot.content.description}</p>}</div><section className="space-y-2"><h3 className="font-semibold">Giá</h3><ul className="space-y-1 text-sm leading-6 text-muted-foreground">{snapshot.content.billingOptions.map(item => <li key={item.billingPeriod}>{item.billingPeriod === "MONTHLY" ? "Theo tháng" : "Theo năm"}: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: item.currency }).format(item.amount / 10 ** (new Intl.NumberFormat("vi-VN", { style: "currency", currency: item.currency }).resolvedOptions().maximumFractionDigits ?? 0))}</li>)}</ul></section><section className="space-y-2"><h3 className="font-semibold">Quyền lợi</h3><ul className="list-inside list-disc space-y-1 text-sm leading-6 text-muted-foreground">{snapshot.content.benefits.map(item => <li key={item.code}>{item.title}{item.displayValue ? `: ${item.displayValue}` : ""}</li>)}</ul></section><section className="space-y-2"><h3 className="font-semibold">Hạn mức</h3><ul className="list-inside list-disc space-y-1 text-sm leading-6 text-muted-foreground">{snapshot.content.quotaRules.map(item => <li key={item.quotaType}>{item.displayName}: {new Intl.NumberFormat("vi-VN").format(item.limit)} {item.unit} / {item.period}</li>)}</ul></section></div>}
      <DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" onClick={onClose}>Đóng</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

export default function SubscriptionProductManagementDetailView() {
  const { planCode = "" } = useParams();
  const navigate = useNavigate();
  const fetcher = useCallback(async (signal: AbortSignal) => {
    const [catalog, product] = await Promise.all([
      subscriptionProductService.catalog(signal),
      subscriptionProductService.detail(planCode, signal),
    ]);
    return { catalog: catalog.data, product: product.data };
  }, [planCode]);
  const state = useFetch(fetcher);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [preview, setPreview] = useState<ProductPreview | null>(null);
  const [previewRevision, setPreviewRevision] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"archive" | "delete" | "cancel-schedule" | null>(null);
  const [replaceScheduleConfirmOpen, setReplaceScheduleConfirmOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [publicationVersion, setPublicationVersion] = useState<number | null>(null);
  const publishKey = useRef<string | null>(null);

  useEffect(() => {
    if (state.data) setProduct(state.data.product);
  }, [state.data]);

  useEffect(() => {
    const schedule = product?.legacySchedule;
    if (schedule?.status === "SCHEDULED") setScheduleAt(vietnamDateTimeValue(schedule.effectiveAt));
  }, [product?.legacySchedule]);

  async function mutation(operation: () => Promise<{ data: ProductDetail }>) {
    if (pending) return;
    setPending(true);
    setFailure(null);
    setPublicationVersion(null);
    try {
      const result = await operation();
      setProduct(result.data);
      setPreview(null);
      setPreviewRevision(null);
      return result.data;
    } catch (error) {
      setFailure((error as Error).message || "Chưa thể cập nhật sản phẩm. Tải lại để kiểm tra trạng thái.");
      return null;
    } finally {
      setPending(false);
    }
  }

  async function saveDraft(content: ConfigurationContent) {
    const expectedRevision = product?.draft?.revision ?? product?.draftRevision;
    if (!product || expectedRevision === null || expectedRevision === undefined) return;
    publishKey.current = null;
    await mutation(() => subscriptionProductService.updateDraft(planCode, expectedRevision, content, new AbortController().signal));
  }

  async function previewDraft(revision: number) {
    if (pending) return;
    setPending(true);
    setFailure(null);
    setPreview(null);
    setPreviewRevision(null);
    publishKey.current = null;
    try {
      const result = await subscriptionProductService.preview(planCode, revision, new AbortController().signal);
      setPreview(result.data);
      setPreviewRevision(revision);
    } catch (error) {
      setFailure((error as Error).message || "Chưa thể xem trước bản nháp. Tải lại sản phẩm để kiểm tra phiên bản.");
    } finally {
      setPending(false);
    }
  }

  async function publish(replaceScheduled = false) {
    if (!product?.draft || !preview || previewRevision !== product.draft.revision || pending) return;
    if (!replaceScheduled && planCode === "PREMIUM" && product.legacySchedule?.status === "SCHEDULED") {
      setReplaceScheduleConfirmOpen(true);
      return;
    }
    const replacementSchedule = replaceScheduled && planCode === "PREMIUM" && product.legacySchedule?.status === "SCHEDULED"
      ? { version: product.legacySchedule.version, effectiveAt: product.legacySchedule.effectiveAt }
      : undefined;
    if (replaceScheduled && !replacementSchedule) {
      setReplaceScheduleConfirmOpen(false);
      setFailure("Lịch PREMIUM cần thay thế không còn hiện hành. Tải lại sản phẩm và kiểm tra trạng thái mới.");
      return;
    }
    const expectedDraftRevision = product.draft.revision;
    const key = publishKey.current ?? crypto.randomUUID();
    publishKey.current = key;
    setPending(true);
    setFailure(null);
    setPublicationVersion(null);
    try {
      const result = await subscriptionProductService.publish(planCode, expectedDraftRevision, key, new AbortController().signal, replacementSchedule);
      publishKey.current = null;
      setProduct(result.data);
      setPreview(null);
      setPreviewRevision(null);
      setPublicationVersion(result.data.publishedVersion?.version ?? null);
      setReplaceScheduleConfirmOpen(false);
    } catch (error) {
      if ((error as { code?: string }).code === "LEGACY_SCHEDULE_REPLACEMENT_REQUIRED") {
        publishKey.current = null;
        setReplaceScheduleConfirmOpen(false);
        try {
          const latest = (await subscriptionProductService.detail(planCode, new AbortController().signal)).data;
          setProduct(latest);
          if (latest.legacySchedule?.status === "SCHEDULED" && latest.draft?.revision === expectedDraftRevision && previewRevision === expectedDraftRevision) {
            setReplaceScheduleConfirmOpen(true);
            setFailure("Máy chủ vẫn có lịch PREMIUM cũ đang chờ. Xem lại thời điểm mới nhất và xác nhận rõ trước khi xuất bản.");
          } else {
            if (latest.draft?.revision !== expectedDraftRevision) {
              setPreview(null);
              setPreviewRevision(null);
            }
            setFailure("Trạng thái lịch hoặc bản nháp đã thay đổi. Đã tải trạng thái mới; hãy kiểm tra lại trước khi gửi yêu cầu xuất bản.");
          }
        } catch {
          setFailure("Máy chủ yêu cầu xác nhận lịch PREMIUM cũ nhưng chưa thể tải trạng thái mới. Tải lại sản phẩm trước khi xuất bản.");
        }
      } else {
        setFailure((error as Error).message || "Chưa thể xác nhận xuất bản. Tải lại để kiểm tra trạng thái.");
      }
    } finally {
      setPending(false);
    }
  }

  async function rescheduleLegacyPremium() {
    const schedule = product?.legacySchedule;
    const effectiveAt = parseVietnamDateTime(scheduleAt);
    if (!schedule || schedule.status !== "SCHEDULED" || !effectiveAt || Date.parse(effectiveAt) <= Date.now() || pending) {
      setFailure("Chọn thời điểm hợp lệ trong tương lai theo giờ Việt Nam.");
      return;
    }
    await mutation(() => subscriptionProductService.rescheduleLegacyPremium(schedule.version, schedule.effectiveAt, effectiveAt, new AbortController().signal));
  }

  async function cancelLegacyPremiumSchedule() {
    const schedule = product?.legacySchedule;
    if (!schedule || schedule.status !== "SCHEDULED" || pending) return;
    await mutation(() => subscriptionProductService.cancelLegacyPremiumSchedule(schedule.version, schedule.effectiveAt, new AbortController().signal));
  }

  async function confirmLifecycle() {
    const action = confirmAction;
    if (!action || !product || pending) return;
    setConfirmAction(null);
    if (action === "archive") {
      await mutation(() => subscriptionProductService.archive(planCode, new AbortController().signal));
      return;
    }
    if (action === "cancel-schedule") {
      await cancelLegacyPremiumSchedule();
      return;
    }
    setPending(true);
    setFailure(null);
    try {
      await subscriptionProductService.deleteDraft(planCode, new AbortController().signal);
      navigate(ROUTES.ADMIN_SUBSCRIPTION_PRODUCTS);
    } catch (error) {
      setFailure((error as Error).message || "Chưa thể xóa bản nháp. Tải lại sản phẩm để kiểm tra trạng thái.");
    } finally {
      setPending(false);
    }
  }

  const data = state.data;
  const services = data?.catalog.services ?? [];
  const detail = product ?? data?.product ?? null;
  if (state.loading && !detail) return <div className="mx-auto max-w-6xl p-5"><Card className="rounded-2xl border-border bg-card p-5 shadow-none"><p role="status">Đang tải sản phẩm…</p></Card></div>;
  if (state.error && !detail) return <div className="mx-auto max-w-6xl space-y-4 p-5"><Card className="space-y-3 rounded-2xl border-border bg-card p-5 shadow-none"><p role="alert" className="leading-6 text-destructive">{state.error.message}</p><Button variant="outline" className="min-h-12 rounded-xl" onClick={state.refetch}>Tải lại</Button></Card></div>;
  if (!detail) return null;

  const editorRevision = detail.draft?.revision ?? detail.draftRevision;
  const editorInitial = detail.draft?.content ?? detail.current?.content ?? (detail.draft ? EMPTY_PRODUCT_CONTENT : null);
  const publishDisabled = pending || !detail.draft || !preview || previewRevision !== detail.draft.revision;
  const legacySchedule = planCode === "PREMIUM" ? detail.legacySchedule : null;
  const newScheduleAt = parseVietnamDateTime(scheduleAt);
  return <div className="mx-auto min-w-0 max-w-6xl space-y-6 p-5 md:p-8">
    <nav aria-label="Điều hướng sản phẩm"><Link to={ROUTES.ADMIN_SUBSCRIPTION_PRODUCTS} className="font-semibold text-primary underline">Sản phẩm trả phí</Link></nav>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2"><p className="break-all text-sm font-semibold text-primary">{detail.planCode}</p><h1 className="text-headline-lg font-bold">{detail.displayName || "Bản nháp mới"}</h1><p className="leading-6 text-muted-foreground">{detail.archived ? "Sản phẩm đã lưu trữ." : detail.currentVersion === null ? "Chưa xuất bản. Sản phẩm chưa xuất hiện với người học." : detail.visibility === "VISIBLE" ? "Sản phẩm đang hiển thị trong danh sách gói." : "Sản phẩm đang ẩn; người học có liên kết trực tiếp vẫn xem được."}</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending || detail.archived} onClick={() => void mutation(() => subscriptionProductService.setVisibility(planCode, detail.visibility === "VISIBLE" ? "HIDDEN" : "VISIBLE", new AbortController().signal))}>{detail.visibility === "VISIBLE" ? "Ẩn gói" : "Hiện gói"}</Button><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending || detail.archived} onClick={() => void mutation(() => subscriptionProductService.setSaleStatus(planCode, detail.saleStatus === "ON_SALE" ? "STOPPED" : "ON_SALE", new AbortController().signal))}>{detail.saleStatus === "ON_SALE" ? "Dừng bán" : "Mở bán lại"}</Button></div>
    </header>
    <div className="grid gap-4 sm:grid-cols-2"><Card className="space-y-2 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="font-semibold">Hiển thị</h2><p className="text-body-md">{detail.visibility === "VISIBLE" ? "Hiện trong danh sách" : "Ẩn khỏi danh sách"}</p></Card><Card className="space-y-2 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="font-semibold">Bán hàng</h2><p className="text-body-md">{detail.saleStatus === "ON_SALE" ? "Đang mở bán" : "Đã dừng bán"}</p></Card></div>
    {legacySchedule && <Card className="space-y-4 rounded-2xl border-border bg-card p-5 shadow-none"><div><h2 className="text-headline-md font-semibold">Lịch phát hành PREMIUM cũ</h2><p className="mt-2 leading-6 text-muted-foreground">Lịch này chỉ áp dụng cho các bản PREMIUM đã được lên lịch trong hệ thống cũ. Thời gian nhập bên dưới dùng múi giờ Việt Nam (UTC+07:00).</p></div><p className="leading-6">Trạng thái: <strong>{legacySchedule.status === "SCHEDULED" ? "Đã lên lịch" : legacySchedule.status === "CANCELLED" ? "Đã hủy" : legacySchedule.status === "APPLIED" ? "Đã áp dụng" : "Được thay thế"}</strong> · Phiên bản v{legacySchedule.version} · Thời điểm: <VietnamTime value={legacySchedule.effectiveAt} /></p>{legacySchedule.status === "SCHEDULED" && !detail.archived && <><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"><Field id="legacySchedule.effectiveAt" label="Thời điểm mới (giờ Việt Nam)"><input id="legacySchedule.effectiveAt" type="datetime-local" step={60} min={vietnamDateTimeValue(new Date().toISOString())} value={scheduleAt} onChange={event => setScheduleAt(event.target.value)} className={fieldClass} aria-describedby="legacy-schedule-timezone" /></Field><p id="legacy-schedule-timezone" className="self-end pb-3 text-sm leading-6 text-muted-foreground">Máy chủ nhận thời điểm tương ứng theo UTC+07:00.</p></div><div className="flex flex-wrap gap-3"><Button className="min-h-12 rounded-xl" disabled={pending || !newScheduleAt || Date.parse(newScheduleAt) <= Date.now()} onClick={() => void rescheduleLegacyPremium()}>{pending ? "Đang cập nhật…" : "Đổi lịch"}</Button><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending} onClick={() => setConfirmAction("cancel-schedule")}>Hủy lịch</Button></div></>}</Card>}
    {publicationVersion !== null && <Card className="rounded-2xl border-border bg-card p-5 shadow-none"><p role="status" className="font-semibold text-primary">Máy chủ đã chấp nhận phiên bản v{publicationVersion}.</p>{detail.currentVersion !== publicationVersion && detail.currentVersion !== null && <p className="mt-1 text-sm leading-6 text-muted-foreground">Phiên bản hiện tại đã chuyển sang v{detail.currentVersion}.</p>}</Card>}
    {failure && <Card className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-border bg-card p-5 shadow-none"><p role="alert" className="min-w-0 flex-1 leading-6 text-destructive">{failure}</p><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending || state.loading} onClick={state.refetch}>Tải lại sản phẩm</Button></Card>}
    {detail.archived && <Card className="rounded-2xl border-border bg-card p-5 shadow-none"><p className="leading-6 text-muted-foreground">Sản phẩm đã lưu trữ và không thể chỉnh sửa.</p></Card>}
    {!detail.archived && editorInitial && editorRevision !== null && <ProductDraftEditor key={`${editorRevision}`} initial={editorInitial} revision={editorRevision} sourceVersion={detail.draft ? null : detail.current?.version ?? null} services={services} pending={pending} onSave={content => void saveDraft(content)} onPreview={revision => void previewDraft(revision)} />}
    {!detail.archived && !editorInitial && <Card className="rounded-2xl border-border bg-card p-5 shadow-none"><p className="leading-6 text-muted-foreground">Bản nháp chưa có nội dung để chỉnh sửa.</p></Card>}
    {preview && <Card className="space-y-4 rounded-2xl border-primary bg-card p-5 shadow-none md:p-6"><header className="space-y-2"><h2 className="text-headline-md font-semibold">Xem trước bản nháp</h2><p className="leading-6 text-muted-foreground">Áp dụng dự kiến: <VietnamTime value={preview.effectiveAt} /> (giờ Việt Nam)</p></header><div className="space-y-2"><p className="font-semibold">{preview.content.displayName}</p>{preview.content.description && <p className="leading-6 text-muted-foreground">{preview.content.description}</p>}<p className="text-sm text-muted-foreground">{preview.content.billingOptions.map(item => `${item.billingPeriod === "MONTHLY" ? "Tháng" : "Năm"}: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: item.currency }).format(item.amount / 10 ** (new Intl.NumberFormat("vi-VN", { style: "currency", currency: item.currency }).resolvedOptions().maximumFractionDigits ?? 0))}`).join(" · ")}</p><p className="text-sm text-muted-foreground">Dịch vụ: {preview.content.benefits.map(item => item.title).join(", ") || "Chưa chọn"}</p><p className="text-sm text-muted-foreground">Hạn mức: {preview.content.quotaRules.map(item => `${item.displayName}: ${new Intl.NumberFormat("vi-VN").format(item.limit)} ${item.unit} / ${item.period}`).join(" · ") || "Không có hạn mức theo chu kỳ"}</p>{preview.changedQuotaTypes && <p className="text-sm text-muted-foreground">Loại hạn mức thay đổi: {preview.changedQuotaTypes.join(", ") || "Không có"}</p>}</div><div className="flex flex-wrap gap-3"><Button className="min-h-12 rounded-xl" disabled={publishDisabled} onClick={() => void publish()}>{pending ? "Đang xuất bản…" : "Xuất bản phiên bản này"}</Button><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending} onClick={() => { setPreview(null); setPreviewRevision(null); }}>Đóng bản xem trước</Button></div></Card>}
    {detail.current && <Card className="space-y-3 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="text-headline-md font-semibold">Phiên bản hiện tại v{detail.current.version}</h2><p className="font-semibold">{detail.current.content.displayName}</p>{detail.current.content.description && <p className="leading-6 text-muted-foreground">{detail.current.content.description}</p>}<p className="text-sm leading-6 text-muted-foreground">{detail.current.content.benefits.map(item => item.title).join(", ")}</p></Card>}
    {detail.history.length > 0 && <section className="space-y-3"><h2 className="text-headline-md font-semibold">Lịch sử phiên bản</h2><div className="grid gap-3 sm:grid-cols-2">{[...detail.history].sort((a, b) => b.version - a.version).map(item => <Card key={item.version} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-border bg-card p-4 shadow-none"><div><p className="font-semibold">Phiên bản v{item.version}</p><p className="mt-1 text-sm text-muted-foreground">Áp dụng: <VietnamTime value={item.effectiveAt} /></p></div><Button variant="outline" className="min-h-12 rounded-xl" onClick={() => setSelectedVersion(item.version)}>Xem nội dung</Button></Card>)}</div></section>}
    {!detail.archived && <div className="flex flex-wrap gap-3 border-t border-border pt-5"><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending} onClick={() => setConfirmAction("archive")}>Lưu trữ sản phẩm</Button>{detail.currentVersion === null && detail.draft && <Button variant="outline" className="min-h-12 rounded-xl text-destructive" disabled={pending} onClick={() => setConfirmAction("delete")}>Xóa bản nháp chưa xuất bản</Button>}</div>}
    <Dialog open={!!confirmAction} onOpenChange={value => { if (!value && !pending) setConfirmAction(null); }}>
      <DialogContent onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onInteractOutside={event => { if (pending) event.preventDefault(); }}><DialogHeader><DialogTitle>{confirmAction === "archive" ? "Lưu trữ sản phẩm?" : confirmAction === "delete" ? "Xóa bản nháp?" : "Hủy lịch phát hành PREMIUM?"}</DialogTitle><DialogDescription className="leading-6">{confirmAction === "archive" ? "Sản phẩm sẽ không còn được cung cấp cho người học." : confirmAction === "delete" ? "Chỉ bản nháp chưa từng xuất bản mới có thể xóa. Thao tác này không thể hoàn tác." : "Lịch phát hành hiện tại sẽ bị hủy. Thao tác này không xóa các phiên bản đã lưu trong lịch sử."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending} onClick={() => setConfirmAction(null)}>Đóng</Button><Button className="min-h-12 rounded-xl" disabled={pending} onClick={() => void confirmLifecycle()}>{pending ? "Đang cập nhật…" : confirmAction === "archive" ? "Lưu trữ" : confirmAction === "delete" ? "Xóa bản nháp" : "Hủy lịch"}</Button></DialogFooter></DialogContent>
    </Dialog>
    <Dialog open={replaceScheduleConfirmOpen && legacySchedule?.status === "SCHEDULED"} onOpenChange={open => { if (!open && !pending) setReplaceScheduleConfirmOpen(false); }}>
      {legacySchedule?.status === "SCHEDULED" && <DialogContent onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onInteractOutside={event => { if (pending) event.preventDefault(); }}><DialogHeader><DialogTitle>Thay thế lịch PREMIUM đang chờ?</DialogTitle><DialogDescription className="leading-6">Xuất bản ngay phiên bản này sẽ thay thế lịch phát hành PREMIUM cũ đang chờ vào <VietnamTime value={legacySchedule.effectiveAt} />. Xác nhận rõ ràng để máy chủ hủy lịch cũ và áp dụng phiên bản mới ngay.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending} onClick={() => setReplaceScheduleConfirmOpen(false)}>Quay lại</Button><Button className="min-h-12 rounded-xl" disabled={pending} onClick={() => void publish(true)}>{pending ? "Đang xuất bản…" : "Xác nhận thay thế và xuất bản ngay"}</Button></DialogFooter></DialogContent>}
    </Dialog>
    {selectedVersion !== null && <ProductVersionDialog planCode={planCode} version={selectedVersion} onClose={() => setSelectedVersion(null)} />}
  </div>;
}
