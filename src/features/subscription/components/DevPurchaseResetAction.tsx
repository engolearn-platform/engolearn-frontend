import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/shadcn/dialog";
import { subscriptionService } from "@features/subscription/services/subscription.service";
import { clearPurchaseIntent } from "@features/subscription/services/purchaseIntent";
import type { Purchase } from "@features/subscription/types/purchase.types";

export function DevPurchaseResetAction({ userId, purchase }: { userId: string; purchase: Purchase }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  if (!import.meta.env.DEV || !purchase.devResetAllowed) return null;
  const reset = async () => {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError(null);
    try {
      const result = await subscriptionService.devResetPurchase(purchase.purchaseReference, controller.signal);
      if (controller.signal.aborted) return;
      if (result.data.purchaseReference !== purchase.purchaseReference) throw new Error("Unexpected reset result");
      clearPurchaseIntent(userId, purchase.purchaseReference);
      navigate("/subscription");
    } catch {
      if (!controller.signal.aborted) setError("Chưa gỡ được đơn test. Kiểm tra lại kết quả đơn rồi thử lại; gói học và lịch sử vẫn được giữ nguyên.");
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  };
  return <div className="space-y-3 border-t pt-5">
    <p className="text-sm leading-6 text-muted-foreground">Công cụ thử nghiệm chỉ dành cho môi trường phát triển.</p>
    <Dialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }}>
      <DialogTrigger asChild><Button variant="outline" className="min-h-12 rounded-xl">Gỡ đơn test bị kẹt</Button></DialogTrigger>
      <DialogContent showCloseButton={false} onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} onInteractOutside={event => { if (pending) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Gỡ đơn test để mua lại?</DialogTitle><DialogDescription className="leading-6">Đơn cũ được giữ để đối soát. Gói học, Trial và hạn mức đã dùng được giữ nguyên. Thao tác này không hoàn tiền và không hủy giao dịch tại VNPay.</DialogDescription></DialogHeader>
        {error && <p role="alert" className="leading-6 text-destructive">{error}</p>}
        <DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" disabled={pending} onClick={() => setOpen(false)}>Để sau</Button><Button className="min-h-12 rounded-xl" disabled={pending} onClick={() => void reset()}>{pending ? "Đang gỡ đơn…" : "Gỡ đơn test"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
