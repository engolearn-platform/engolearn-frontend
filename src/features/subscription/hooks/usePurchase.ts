import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useFetch } from "@shared/hooks";
import { subscriptionService } from "@features/subscription/services/subscription.service";
import { clearPurchaseIntent, clearPurchaseIntentByKey, clearUnreferencedPurchaseIntent, readPurchaseIntent, savePurchaseIntent } from "@features/subscription/services/purchaseIntent";
import type { BillingPeriod, PurchaseStatus } from "@features/subscription/types/purchase.types";
import type { PlanBillingOption, PlanCard } from "@features/subscription/types/subscription.types";

export const purchaseWaiting = (status: PurchaseStatus) => ["PAYMENT_SETUP_PENDING", "PAYMENT_PENDING", "REFUND_PENDING"].includes(status);
const activePurchaseRequests = new Set<string>();
export function usePurchase(userId: string) {
  const navigate = useNavigate();
  const [intent, setIntent] = useState(() => readPurchaseIntent(userId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleSelection, setStaleSelection] = useState<{ plan: PlanCard; billingPeriod: BillingPeriod } | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const submit = async (plan: PlanCard, billingPeriod: BillingPeriod, replaceExisting = false) => {
    if (request.current || activePurchaseRequests.has(userId)) return;
    if (!plan.version) { setError("Chưa thể xác nhận phiên bản gói. Tải lại thông tin trước khi mua."); return; }
    const existing = readPurchaseIntent(userId);
    const current = replaceExisting
      ? { key: crypto.randomUUID(), planCode: plan.planCode, expectedVersion: plan.version, billingPeriod }
      : existing ?? { key: crypto.randomUUID(), planCode: plan.planCode, expectedVersion: plan.version, billingPeriod };
    if (current.reference) { navigate(`/subscription/purchases/${encodeURIComponent(current.reference)}`); return; }
    if (!current.planCode || !current.expectedVersion) { setError("Có yêu cầu mua cũ chưa xác định được kết quả. Mở lịch sử mua hàng để kiểm tra trước."); return; }
    if (current.planCode !== plan.planCode || current.billingPeriod !== billingPeriod || current.expectedVersion !== plan.version) {
      setError("Bạn đang có yêu cầu mua chưa rõ kết quả. Mở lịch sử mua hàng để tiếp tục yêu cầu đó."); return;
    }
    savePurchaseIntent(userId, current); setIntent(current);
    activePurchaseRequests.add(userId);
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError(null);
    try {
      const result = await subscriptionService.createPurchase(current.planCode, current.billingPeriod, current.expectedVersion, current.key, controller.signal);
      if (controller.signal.aborted) return;
      savePurchaseIntent(userId, { ...current, reference: result.data.purchaseReference });
      navigate(`/subscription/purchases/${encodeURIComponent(result.data.purchaseReference)}`);
    } catch (failure) {
      if (controller.signal.aborted) return;
      const code = (failure as { code?: string }).code;
      if (code === "PLAN_VERSION_STALE") {
        clearPurchaseIntentByKey(userId, current.key);
        setIntent(null);
        try {
          const latest = (await subscriptionService.plan(current.planCode, controller.signal)).data;
          if (!controller.signal.aborted) {
            setStaleSelection({ plan: latest, billingPeriod: current.billingPeriod });
            setError(null);
          }
        } catch (refreshFailure) {
          if (!controller.signal.aborted) setError((refreshFailure as Error).message || "Gói đã thay đổi nhưng chưa thể tải thông tin mới. Tải lại để tiếp tục.");
        }
        return;
      }
      if (["PLAN_SALE_STOPPED", "PLAN_ARCHIVED", "OFFER_UNAVAILABLE"].includes(String(code))) {
        clearPurchaseIntentByKey(userId, current.key);
        setIntent(null);
      }
      const messages: Record<string, string> = {
        PREMIUM_ALREADY_ACTIVE: "Premium đang có hiệu lực. Bạn có thể mua kỳ mới sau khi kỳ hiện tại kết thúc.",
        PURCHASE_PENDING: "Bạn đang có một yêu cầu mua chưa có kết quả cuối cùng. Mở lịch sử để tiếp tục yêu cầu đó.",
        REFUND_PENDING: "Yêu cầu hoàn tiền trước đó chưa hoàn tất. Vui lòng kiểm tra lịch sử mua hàng.",
        OFFER_UNAVAILABLE: "Lựa chọn gói này hiện chưa được mở bán. Vui lòng tải lại thông tin gói.",
        PLAN_SALE_STOPPED: "Gói này vừa dừng bán. Tải lại danh sách để xem lựa chọn hiện tại.",
        PLAN_ARCHIVED: "Gói này không còn được cung cấp.",
        IDEMPOTENCY_CONFLICT: "Lựa chọn không khớp yêu cầu trước đó. Vui lòng kiểm tra lịch sử mua hàng.",
        AUTHENTICATION_REQUIRED: "Vui lòng kiểm tra lại đăng nhập để mua gói.",
      };
      setError(code && messages[code] ? messages[code] : "Chưa xác định được kết quả tạo đơn. Thử lại sẽ giữ nguyên yêu cầu, không tạo đơn mới.");
    } finally {
      activePurchaseRequests.delete(userId);
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  };
  const create = (plan: PlanCard, option: PlanBillingOption) => submit(plan, option.billingPeriod);
  const resumeIntent = () => {
    const current = readPurchaseIntent(userId);
    if (!current?.planCode || !current.expectedVersion || current.reference || pending) return;
    const confirmedPlan: PlanCard = {
      planCode: current.planCode,
      displayName: current.planCode,
      description: null,
      benefits: [],
      billingOptions: [],
      version: current.expectedVersion,
    };
    setIntent(current);
    void submit(confirmedPlan, current.billingPeriod);
  };
  const confirmStale = () => {
    if (!staleSelection) return;
    const current = staleSelection;
    setStaleSelection(null);
    void submit(current.plan, current.billingPeriod, true);
  };
  const cancelStale = () => { setStaleSelection(null); setError(null); };
  const clearLegacyIntent = () => {
    if (!intent || intent.reference || intent.planCode && intent.expectedVersion) return;
    clearUnreferencedPurchaseIntent(userId, intent.key);
    setIntent(null);
    setError(null);
  };
  return { create, resumeIntent, confirmStale, cancelStale, clearLegacyIntent, staleSelection, intent, pending, error };
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
