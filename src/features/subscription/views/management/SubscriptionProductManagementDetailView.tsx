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
import { VietnamTime } from "@features/subscription/components/management/ConfigurationFields";

const EMPTY_PRODUCT_CONTENT: ConfigurationContent = { displayName: "", description: null, displayOrder: 0, benefits: [], billingOptions: [], quotaRules: [] };

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
  const [confirmAction, setConfirmAction] = useState<"archive" | "delete" | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [publicationVersion, setPublicationVersion] = useState<number | null>(null);
  const publishKey = useRef<string | null>(null);

  useEffect(() => {
    if (state.data) setProduct(state.data.product);
  }, [state.data]);

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

  async function publish() {
    if (!product?.draft || !preview || previewRevision !== product.draft.revision || pending) return;
    const key = publishKey.current ?? crypto.randomUUID();
    publishKey.current = key;
    const result = await mutation(() => subscriptionProductService.publish(planCode, product.draft!.revision, key, new AbortController().signal));
    if (result) {
      publishKey.current = null;
      setPublicationVersion(result.publishedVersion?.version ?? null);
    }
  }

  async function confirmLifecycle() {
    const action = confirmAction;
    if (!action || !product || pending) return;
    setConfirmAction(null);
    if (action === "archive") {
      await mutation(() => subscriptionProductService.archive(planCode, new AbortController().signal));
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
  return <div className="mx-auto min-w-0 max-w-6xl space-y-6 p-5 md:p-8">
    <nav aria-label="Điều hướng sản phẩm"><Link to={ROUTES.ADMIN_SUBSCRIPTION_PRODUCTS} className="font-semibold text-primary underline">Sản phẩm trả phí</Link></nav>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2"><p className="break-all text-sm font-semibold text-primary">{detail.planCode}</p><h1 className="text-headline-lg font-bold">{detail.displayName || "Bản nháp mới"}</h1><p className="leading-6 text-muted-foreground">{detail.archived ? "Sản phẩm đã lưu trữ." : detail.currentVersion === null ? "Chưa xuất bản. Sản phẩm chưa xuất hiện với người học." : detail.visibility === "VISIBLE" ? "Sản phẩm đang hiển thị trong danh sách gói." : "Sản phẩm đang ẩn; người học có liên kết trực tiếp vẫn xem được."}</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending || detail.archived} onClick={() => void mutation(() => subscriptionProductService.setVisibility(planCode, detail.visibility === "VISIBLE" ? "HIDDEN" : "VISIBLE", new AbortController().signal))}>{detail.visibility === "VISIBLE" ? "Ẩn gói" : "Hiện gói"}</Button><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending || detail.archived} onClick={() => void mutation(() => subscriptionProductService.setSaleStatus(planCode, detail.saleStatus === "ON_SALE" ? "STOPPED" : "ON_SALE", new AbortController().signal))}>{detail.saleStatus === "ON_SALE" ? "Dừng bán" : "Mở bán lại"}</Button></div>
    </header>
    <div className="grid gap-4 sm:grid-cols-2"><Card className="space-y-2 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="font-semibold">Hiển thị</h2><p className="text-body-md">{detail.visibility === "VISIBLE" ? "Hiện trong danh sách" : "Ẩn khỏi danh sách"}</p></Card><Card className="space-y-2 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="font-semibold">Bán hàng</h2><p className="text-body-md">{detail.saleStatus === "ON_SALE" ? "Đang mở bán" : "Đã dừng bán"}</p></Card></div>
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
      <DialogContent onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onInteractOutside={event => { if (pending) event.preventDefault(); }}><DialogHeader><DialogTitle>{confirmAction === "archive" ? "Lưu trữ sản phẩm?" : "Xóa bản nháp?"}</DialogTitle><DialogDescription className="leading-6">{confirmAction === "archive" ? "Sản phẩm sẽ không còn được cung cấp cho người học." : "Chỉ bản nháp chưa từng xuất bản mới có thể xóa. Thao tác này không thể hoàn tác."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending} onClick={() => setConfirmAction(null)}>Hủy</Button><Button className="min-h-12 rounded-xl" disabled={pending} onClick={() => void confirmLifecycle()}>{pending ? "Đang cập nhật…" : confirmAction === "archive" ? "Lưu trữ" : "Xóa bản nháp"}</Button></DialogFooter></DialogContent>
    </Dialog>
    {selectedVersion !== null && <ProductVersionDialog planCode={planCode} version={selectedVersion} onClose={() => setSelectedVersion(null)} />}
  </div>;
}
