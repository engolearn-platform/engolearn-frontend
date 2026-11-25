import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Card } from "@shared/components/Card";
import { useSubscriptionProducts } from "@features/subscription/hooks/useSubscriptionProducts";
import { subscriptionProductService } from "@features/subscription/services/subscriptionProduct.service";
import type { ProductSummary } from "@features/subscription/types/subscriptionProduct.types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/shadcn/dialog";
import { TextField } from "@features/subscription/components/management/ConfigurationFields";
import { ROUTES } from "@shared/constants";

function ProductRow({ product }: { product: ProductSummary }) {
  const hasDraft = product.hasDraft ?? product.draftRevision !== null;
  return <Card className="flex flex-col gap-4 rounded-2xl border-border bg-card p-5 shadow-none md:flex-row md:items-center md:justify-between">
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2"><h2 className="break-all text-headline-md font-semibold">{product.displayName || product.planCode}</h2><span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{product.planCode}</span></div>
      <p className="leading-6 text-muted-foreground">{product.archived ? "Đã lưu trữ" : product.visibility === "VISIBLE" ? "Đang hiển thị" : "Đang ẩn"} · {product.saleStatus === "ON_SALE" ? "Đang mở bán" : "Đã dừng bán"}</p>
      <p className="text-sm leading-6 text-muted-foreground">{product.currentVersion ? `Phiên bản hiện tại: v${product.currentVersion}` : "Chưa xuất bản"} · {hasDraft ? `Bản nháp: r${product.draftRevision ?? 0}` : "Không có bản nháp"}</p>
    </div>
    <Button asChild variant="outline" className="min-h-12 shrink-0 rounded-xl"><Link to={`${ROUTES.ADMIN_SUBSCRIPTION_PRODUCTS}/${encodeURIComponent(product.planCode)}`}>{product.archived ? "Xem sản phẩm" : "Quản lý sản phẩm"}</Link></Button>
  </Card>;
}

export default function SubscriptionProductsManagementView() {
  const state = useSubscriptionProducts();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [planCode, setPlanCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function createProduct() {
    const code = planCode.trim();
    if (!code || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await subscriptionProductService.create(code, new AbortController().signal);
      setCreateOpen(false);
      setPlanCode("");
      navigate(`${ROUTES.ADMIN_SUBSCRIPTION_PRODUCTS}/${encodeURIComponent(result.data.planCode)}`);
    } catch (error) {
      setCreateError((error as Error).message || "Chưa thể tạo bản nháp. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  }

  return <div className="mx-auto min-w-0 max-w-6xl space-y-6 p-5 md:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl space-y-2"><h1 className="text-headline-lg font-bold">Sản phẩm trả phí</h1><p className="leading-6 text-muted-foreground">Quản lý bản nháp, giá theo tháng hoặc năm, quyền lợi, hạn mức và trạng thái bán.</p></div>
      <Button className="min-h-12 rounded-xl" onClick={() => { setCreateError(null); setCreateOpen(true); }}>Tạo sản phẩm</Button>
    </header>
    <nav aria-label="Quản lý đăng ký" className="flex flex-wrap gap-3 border-b border-border pb-4">{[[ROUTES.ADMIN_SUBSCRIPTION_PLANS, "Cấu hình Free & Trial"], [ROUTES.ADMIN_SUBSCRIPTION_PRODUCTS, "Sản phẩm trả phí"], [ROUTES.ADMIN_SUBSCRIPTION_QUOTAS, "Cấu hình hạn mức"]].map(([to, label]) => <Button key={to} asChild variant={to === ROUTES.ADMIN_SUBSCRIPTION_PRODUCTS ? "default" : "outline"} className="min-h-12 rounded-xl"><Link to={to}>{label}</Link></Button>)}</nav>
    {state.loading && <Card className="rounded-2xl border-border bg-card p-5 shadow-none"><p role="status">Đang tải sản phẩm…</p></Card>}
    {state.error && <Card className="space-y-3 rounded-2xl border-border bg-card p-5 shadow-none"><p role="alert" className="leading-6 text-destructive">{state.error.message}</p><Button variant="outline" className="min-h-12 rounded-xl" disabled={state.loading} onClick={state.refetch}>Tải lại</Button></Card>}
    {state.data && <div className="space-y-4">{state.data.data.items.length === 0 ? <Card className="space-y-2 rounded-2xl border-border bg-card p-5 shadow-none"><h2 className="text-lg font-semibold">Chưa có sản phẩm</h2><p className="leading-6 text-muted-foreground">Tạo một bản nháp để bắt đầu cấu hình gói trả phí.</p></Card> : state.data.data.items.map(product => <ProductRow key={product.planCode} product={product} />)}</div>}
    <Dialog open={createOpen} onOpenChange={value => { if (!creating) setCreateOpen(value); }}>
      <DialogContent onEscapeKeyDown={event => { if (creating) event.preventDefault(); }} onInteractOutside={event => { if (creating) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Tạo sản phẩm mới</DialogTitle><DialogDescription>Nhập mã ổn định để tạo bản nháp trống. Mã này sẽ dùng trong liên kết sản phẩm.</DialogDescription></DialogHeader>
        <div className="space-y-3"><TextField id="planCode" label="Mã sản phẩm" value={planCode} maxLength={64} autoComplete="off" disabled={creating} onChange={event => setPlanCode(event.target.value)} />{createError && <p role="alert" className="leading-6 text-destructive">{createError}</p>}</div>
        <DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" disabled={creating} onClick={() => setCreateOpen(false)}>Hủy</Button><Button className="min-h-12 rounded-xl" disabled={creating || !planCode.trim()} onClick={() => void createProduct()}>{creating ? "Đang tạo…" : "Tạo bản nháp"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
