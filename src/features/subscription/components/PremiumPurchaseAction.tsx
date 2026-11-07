import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/shadcn/dialog";
import { useMySubscription } from "@features/subscription/hooks/useSubscription";
import { usePurchase } from "@features/subscription/hooks/usePurchase";
import type { PlanBillingOption } from "@features/subscription/types/subscription.types";

export default function PremiumPurchaseAction({ userId, option }: { userId: string; option: PlanBillingOption }) {
  const [open, setOpen] = useState(false);
  const summary = useMySubscription();
  const purchase = usePurchase(userId);
  const active = summary.data?.data.status === "ACTIVE";
  const mismatched = purchase.intent && !purchase.intent.reference && purchase.intent.billingPeriod !== option.billingPeriod;
  if (purchase.intent?.reference) return <Button asChild className="min-h-12 rounded-xl"><Link to={`/subscription/purchases/${encodeURIComponent(purchase.intent.reference)}`}>Tiếp tục yêu cầu mua gói</Link></Button>;
  if (active) return <p className="leading-6 text-muted-foreground">Premium đang có hiệu lực. Bạn có thể đăng ký kỳ mới sau khi kỳ hiện tại kết thúc.</p>;
  const price = new Intl.NumberFormat("vi-VN", { style: "currency", currency: option.currency }).format(option.amount);
  return <div className="space-y-3">
    {summary.error && <p role="alert" className="leading-6 text-muted-foreground">Chưa kiểm tra được quyền lợi hiện tại. <button className="font-semibold text-primary underline" onClick={summary.refetch}>Thử lại</button></p>}
    {mismatched && <p role="status" className="leading-6 text-muted-foreground">Yêu cầu trước đang dùng kỳ {purchase.intent?.billingPeriod === "MONTHLY" ? "tháng" : "năm"}. Chọn lại kỳ đó để tiếp tục với cùng yêu cầu.</p>}
    <Dialog open={open} onOpenChange={value => { if (!purchase.pending) setOpen(value); }}>
      <DialogTrigger asChild><Button className="min-h-12 w-full rounded-xl" disabled={summary.loading || !!summary.error || !!mismatched || option.currency !== "VND"}>{summary.loading ? "Đang kiểm tra quyền lợi…" : purchase.intent ? "Thử lại yêu cầu mua" : "Mua Premium"}</Button></DialogTrigger>
      <DialogContent showCloseButton={false} onEscapeKeyDown={event => { if (purchase.pending) event.preventDefault(); }} onInteractOutside={event => { if (purchase.pending) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Xác nhận mua Premium</DialogTitle><DialogDescription className="leading-6">Gói {option.billingPeriod === "MONTHLY" ? "tháng" : "năm"}: {price}. Bạn sẽ xem lại đơn và thanh toán qua VNPay. Không tự động gia hạn. Nếu còn Trial, kỳ dùng thử kết thúc khi thanh toán thành công và Premium bắt đầu ngay.</DialogDescription></DialogHeader>
        {purchase.error && <p role="alert" className="leading-6 text-destructive">{purchase.error}</p>}
        <DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" disabled={purchase.pending} onClick={() => setOpen(false)}>Để sau</Button><Button className="min-h-12 rounded-xl" disabled={purchase.pending} onClick={() => void purchase.create(option.billingPeriod)}>{purchase.pending ? "Đang tạo yêu cầu…" : "Xác nhận mua"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Link to="/subscription/purchases" className="inline-flex min-h-12 items-center font-semibold text-primary underline">Xem lịch sử mua hàng</Link>
  </div>;
}
