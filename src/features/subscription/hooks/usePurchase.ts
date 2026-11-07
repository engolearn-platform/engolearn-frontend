import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useFetch } from "@shared/hooks";
import { subscriptionService } from "@features/subscription/services/subscription.service";
import { clearPurchaseIntent, readPurchaseIntent, savePurchaseIntent } from "@features/subscription/services/purchaseIntent";
import type { BillingPeriod, PurchaseStatus } from "@features/subscription/types/purchase.types";

export const purchaseWaiting = (status: PurchaseStatus) => ["PAYMENT_SETUP_PENDING", "PAYMENT_PENDING", "REFUND_PENDING"].includes(status);
export function usePurchase(userId: string) {
  const navigate = useNavigate();
  const [intent, setIntent] = useState(() => readPurchaseIntent(userId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const create = async (billingPeriod: BillingPeriod) => {
    if (request.current) return;
    const current = readPurchaseIntent(userId) ?? { key: crypto.randomUUID(), billingPeriod };
    if (current.reference) { navigate(`/subscription/purchases/${encodeURIComponent(current.reference)}`); return; }
    if (current.billingPeriod !== billingPeriod) { setError("Bạn có yêu cầu chưa rõ kết quả. Chọn lại kỳ đã yêu cầu để tiếp tục hoặc xem lịch sử mua hàng."); return; }
    savePurchaseIntent(userId, current); setIntent(current);
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError(null);
    try {
      const result = await subscriptionService.createPurchase(current.billingPeriod, current.key, controller.signal);
      if (controller.signal.aborted) return;
      savePurchaseIntent(userId, { ...current, reference: result.data.purchaseReference });
      navigate(`/subscription/purchases/${encodeURIComponent(result.data.purchaseReference)}`);
    } catch (failure) {
      if (controller.signal.aborted) return;
      const code = (failure as { code?: string }).code;
      const messages: Record<string, string> = {
        PREMIUM_ALREADY_ACTIVE: "Premium đang có hiệu lực. Bạn có thể mua kỳ mới sau khi kỳ hiện tại kết thúc.",
        PURCHASE_PENDING: "Bạn đang có một yêu cầu mua chưa có kết quả cuối cùng. Mở lịch sử để tiếp tục yêu cầu đó.",
        REFUND_PENDING: "Yêu cầu hoàn tiền trước đó chưa hoàn tất. Vui lòng kiểm tra lịch sử mua hàng.",
        OFFER_UNAVAILABLE: "Lựa chọn gói này hiện chưa được mở bán. Vui lòng tải lại thông tin gói.",
        IDEMPOTENCY_CONFLICT: "Lựa chọn không khớp yêu cầu trước đó. Vui lòng kiểm tra lịch sử mua hàng.",
        AUTHENTICATION_REQUIRED: "Vui lòng kiểm tra lại đăng nhập để mua gói.",
      };
      setError(code && messages[code] ? messages[code] : "Chưa xác định được kết quả tạo đơn. Thử lại sẽ giữ nguyên yêu cầu, không tạo đơn mới.");
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  };
  return { create, intent, pending, error };
}

export function usePurchaseDetail(userId: string, reference: string) {
  const fetcher = useCallback((signal: AbortSignal) => subscriptionService.purchase(reference, signal), [reference]);
  const state = useFetch(fetcher);
  const { refetch, loading, error } = state;
  const polls = useRef(0);
  const status = state.data?.data.status;
  const devResetAt = state.data?.data.devResetAt;
  useEffect(() => {
    if (status && !purchaseWaiting(status) && (status !== "REQUIRES_REVIEW" || devResetAt)) clearPurchaseIntent(userId, reference);
    if (!status || !purchaseWaiting(status) || loading || error || polls.current >= 60) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") { polls.current += 1; refetch(); }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [status, devResetAt, loading, error, refetch, reference, userId]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible" && (!status || purchaseWaiting(status))) refetch(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [refetch, status]);
  return { ...state, refresh: () => { polls.current = 0; refetch(); } };
}
