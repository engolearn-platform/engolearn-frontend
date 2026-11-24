import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/shadcn/dialog";
import { useMySubscription } from "@features/subscription/hooks/useSubscription";
import { usePurchase } from "@features/subscription/hooks/usePurchase";
import type { PlanBillingOption, PlanCard } from "@features/subscription/types/subscription.types";

function price(option: PlanBillingOption) {
  const formatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: option.currency });
  const amount = option.amount / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 0);
  return formatter.format(amount);
}

export default function PlanPurchaseAction({ userId, plan, option, refreshPlan }: { userId: string; plan: PlanCard; option: PlanBillingOption; refreshPlan: () => void }) {
  const [open, setOpen] = useState(false);
  const summary = useMySubscription();
  const purchase = usePurchase(userId);
  const paidPeriodActive = summary.data?.data.status === "ACTIVE";
  const currentPlan = (summary.data?.data.currentPlanCode ?? summary.data?.data.tier) === plan.planCode;
  const mismatched = purchase.intent && !purchase.intent.reference &&
    (purchase.intent.planCode !== plan.planCode || purchase.intent.expectedVersion !== plan.version || purchase.intent.billingPeriod !== option.billingPeriod);
  const legacyIntent = !!purchase.intent && !purchase.intent.reference && (!purchase.intent.planCode || !purchase.intent.expectedVersion);
  const staleOption = purchase.staleSelection?.plan.billingOptions.find(item => item.billingPeriod === purchase.staleSelection?.billingPeriod);

  if (purchase.intent?.reference) return <Button asChild className="min-h-12 w-full rounded-xl"><Link to={`/subscription/purchases/${encodeURIComponent(purchase.intent.reference)}`}>Tiếp tục yêu cầu mua</Link></Button>;
  if (paidPeriodActive && !purchase.intent) return <p className="leading-6 text-muted-foreground">{currentPlan ? "Đây là gói hiện tại." : "Bạn đang có một kỳ trả phí đang có hiệu lực."} Có thể chọn kỳ mới sau khi kỳ hiện tại kết thúc.</p>;
  if (plan.saleStatus === "STOPPED" && !purchase.intent) return <p className="rounded-xl bg-muted px-4 py-3 text-center font-semibold text-muted-foreground">Gói hiện đã dừng bán</p>;
  if (!plan.version && !purchase.intent) return <p className="leading-6 text-muted-foreground">Chưa thể xác nhận phiên bản giá. Tải lại thông tin gói trước khi mua.</p>;

  return <div className="space-y-3">
    {purchase.error && <div role="alert" className="space-y-2"><p className="leading-6 text-destructive">{purchase.error}</p><Button variant="outline" className="min-h-12 rounded-xl" onClick={refreshPlan}>Tải lại gói học</Button></div>}
    {mismatched && !legacyIntent && <div role="status" className="space-y-3 rounded-2xl bg-muted p-4"><p className="leading-6">Tài khoản đang có một yêu cầu mua chưa rõ kết quả cho {purchase.intent?.planCode}, kỳ {purchase.intent?.billingPeriod === "MONTHLY" ? "tháng" : "năm"}, phiên bản v{purchase.intent?.expectedVersion}. Tiếp tục sẽ gửi lại cùng mã yêu cầu đã xác nhận.</p><div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-12 rounded-xl" disabled={purchase.pending} onClick={purchase.resumeIntent}>Tiếp tục yêu cầu này</Button><Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to="/subscription/purchases">Mở lịch sử mua hàng</Link></Button></div></div>}
    {legacyIntent && <div className="space-y-3 rounded-2xl bg-muted p-4"><p className="leading-6">Yêu cầu mua cũ chưa liên kết với mã đơn. Kiểm tra lịch sử để mở đơn đang chờ trước khi bắt đầu một yêu cầu mới.</p><div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to="/subscription/purchases">Kiểm tra lịch sử mua hàng</Link></Button><Button variant="outline" className="min-h-12 rounded-xl" onClick={purchase.clearLegacyIntent}>Đã kiểm tra, chọn gói mới</Button></div></div>}
    {summary.error && <p role="alert" className="leading-6 text-muted-foreground">Chưa kiểm tra được quyền lợi hiện tại. <button className="font-semibold text-primary underline" onClick={summary.refetch}>Thử lại</button></p>}
    <Dialog open={open} onOpenChange={value => { if (!purchase.pending) setOpen(value); }}>
      <DialogTrigger asChild><Button className="min-h-12 w-full rounded-xl" disabled={summary.loading || !!summary.error || !!mismatched || option.currency !== "VND"}>{summary.loading ? "Đang kiểm tra quyền lợi…" : purchase.intent ? "Thử lại yêu cầu mua" : "Chọn gói này"}</Button></DialogTrigger>
      <DialogContent showCloseButton={false} onEscapeKeyDown={event => { if (purchase.pending) event.preventDefault(); }} onInteractOutside={event => { if (purchase.pending) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Xác nhận gói {plan.displayName}</DialogTitle><DialogDescription className="leading-6">Kỳ {option.billingPeriod === "MONTHLY" ? "tháng" : "năm"}: {price(option)}. Phiên bản giá: v{plan.version}. Bạn sẽ xem lại đơn và thanh toán qua VNPay. Không tự động gia hạn.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" disabled={purchase.pending} onClick={() => setOpen(false)}>Để sau</Button><Button className="min-h-12 rounded-xl" disabled={purchase.pending} onClick={() => { setOpen(false); void purchase.create(plan, option); }}>{purchase.pending ? "Đang tạo đơn…" : "Xác nhận mua"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={!!purchase.staleSelection} onOpenChange={value => { if (!value && !purchase.pending) purchase.cancelStale?.(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader><DialogTitle>Gói đã thay đổi</DialogTitle><DialogDescription className="leading-6">Giá hoặc quyền lợi đã được cập nhật. Hãy xem lại phiên bản mới trước khi tạo đơn.</DialogDescription></DialogHeader>
        {purchase.staleSelection && <div className="space-y-2 rounded-2xl bg-surface p-4"><p className="font-semibold">{purchase.staleSelection.plan.displayName}</p><p className="text-sm text-muted-foreground">Phiên bản v{purchase.staleSelection.plan.version} · {staleOption ? price(staleOption) : "Kỳ này không còn được mở bán"}</p><p className="text-sm font-semibold">Quyền lợi mới</p><ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">{purchase.staleSelection.plan.benefits.map(benefit => <li key={benefit.code}>{benefit.title}{benefit.displayValue ? `: ${benefit.displayValue}` : ""}</li>)}</ul>{purchase.staleSelection.plan.saleStatus === "STOPPED" && <p className="text-sm text-destructive">Gói đã dừng bán.</p>}</div>}
        {purchase.error && <p role="alert" className="leading-6 text-destructive">{purchase.error}</p>}
        <DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" onClick={() => purchase.cancelStale?.()}>Để sau</Button><Button className="min-h-12 rounded-xl" disabled={!staleOption || purchase.staleSelection?.plan.saleStatus === "STOPPED" || !purchase.staleSelection?.plan.version || purchase.pending} onClick={() => purchase.confirmStale()}>{purchase.pending ? "Đang tạo đơn…" : "Xác nhận phiên bản mới"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
