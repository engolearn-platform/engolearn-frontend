import { useCallback, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useFetch } from "@shared/hooks";
import { DateTime, LoadingState, PrivateAccount, SubscriptionPage, Surface, Unavailable } from "@features/subscription/components/SubscriptionUi";
import { usePurchaseDetail, purchaseWaiting } from "@features/subscription/hooks/usePurchase";
import { subscriptionService } from "@features/subscription/services/subscription.service";
import type { Purchase, PurchaseStatus } from "@features/subscription/types/purchase.types";
import { DevPurchaseResetAction } from "@features/subscription/components/DevPurchaseResetAction";

const labels: Record<PurchaseStatus, string> = {
  PAYMENT_SETUP_PENDING: "Đang chuẩn bị thanh toán", PAYMENT_PENDING: "Chờ kết quả thanh toán",
  PAYMENT_SETUP_FAILED: "Chưa tạo được phiên thanh toán", PAYMENT_FAILED: "Thanh toán không thành công",
  PAYMENT_EXPIRED: "Đã xác nhận hết hạn, chưa thanh toán", ACTIVE: "Đã ghi nhận kích hoạt Premium",
  REQUIRES_REVIEW: "Cần kiểm tra kết quả", REFUND_PENDING: "Đang xử lý hoàn tiền", REFUNDED: "Đã hoàn tiền",
};
const price = (purchase: Purchase) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(purchase.amountVnd);

function PurchaseHistory() {
  const [cursor, setCursor] = useState<string | null>(null);
  const fetcher = useCallback((signal: AbortSignal) => subscriptionService.purchases(cursor, signal), [cursor]);
  const state = useFetch(fetcher);
  return <section className="space-y-4" aria-labelledby="purchase-history-heading"><div className="flex flex-wrap items-center justify-between gap-4"><h2 id="purchase-history-heading" className="text-[22px] font-semibold leading-7">Lịch sử mua hàng</h2><Button variant="outline" className="min-h-12 rounded-xl" onClick={state.refetch} disabled={state.loading}>Tải lại</Button></div>
    {state.loading ? <LoadingState /> : state.error ? <Unavailable error={state.error} retry={state.refetch} /> : <>
      {!state.data?.data.items.length && <Surface><p className="leading-6 text-muted-foreground">Bạn chưa có yêu cầu mua gói nào.</p></Surface>}
      {state.data?.data.items.map(purchase => <Surface key={purchase.purchaseReference} className="space-y-3"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-lg font-semibold">Premium {purchase.billingPeriod === "MONTHLY" ? "tháng" : "năm"}</h3><p className="mt-2 text-muted-foreground"><DateTime value={purchase.createdAt} /></p></div><p className="text-lg font-semibold">{price(purchase)}</p></div><p>{labels[purchase.status]}</p>{purchase.refundStatus && purchase.refundStatus !== "NONE" && <p className="text-sm text-muted-foreground">{purchase.refundStatus === "SUCCEEDED" ? "Hoàn tiền đã được xác nhận" : purchase.refundStatus === "FAILED" ? "Lần hoàn tiền trước không thành công" : "Yêu cầu hoàn tiền đang chờ kết quả"}</p>}<Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to={`/subscription/purchases/${encodeURIComponent(purchase.purchaseReference)}`}>Xem đơn & thanh toán</Link></Button></Surface>)}
      <div className="flex flex-wrap gap-3">{cursor && <Button variant="outline" className="min-h-12 rounded-xl" onClick={() => setCursor(null)}>Về trang đầu</Button>}{state.data?.data.nextCursor && <Button variant="outline" className="min-h-12 rounded-xl" onClick={() => setCursor(state.data?.data.nextCursor ?? null)}>Xem tiếp</Button>}</div>
    </>}
  </section>;
}
function PurchaseDetail({ userId, reference }: { userId: string; reference: string }) {
  const state = usePurchaseDetail(userId, reference);
  if (state.error) return <Unavailable error={state.error} retry={state.refresh} />;
  if (!state.data) return <LoadingState label="Đang kiểm tra đơn mua…" />;
  const purchase = state.data.data;
  const checkout = purchase.status === "PAYMENT_PENDING" && purchase.checkoutUrl && Date.now() < Date.parse(purchase.expiresAt);
  return <Surface className="space-y-5"><div><h2 className="text-[22px] font-semibold leading-7">Premium {purchase.billingPeriod === "MONTHLY" ? "tháng" : "năm"}</h2><p className="mt-3 text-[28px] font-bold leading-9">{price(purchase)}</p><p className="mt-2 break-all text-sm text-muted-foreground">Mã yêu cầu: {purchase.purchaseReference}</p></div>
    <p role="status" className="font-semibold text-primary">{labels[purchase.status]}</p>
    {purchaseWaiting(purchase.status) && <p className="leading-6 text-muted-foreground">Kết quả sẽ được cập nhật khi máy chủ xác nhận. Nếu vừa thanh toán, vui lòng chờ hoặc bấm kiểm tra lại. Đóng trang hay hết thời gian chờ chưa có nghĩa là thanh toán thất bại.</p>}
    {purchase.status === "REQUIRES_REVIEW" && <p className="leading-6 text-muted-foreground">{purchase.devResetAt ? "Đơn test đã được gỡ để thử mua lại. Lịch sử thanh toán cũ vẫn được giữ để đối soát." : "Kết quả cần được đối soát. Không tạo yêu cầu thanh toán khác; hãy liên hệ hỗ trợ và cung cấp mã yêu cầu này."}</p>}
    {purchase.status === "ACTIVE" && <p className="leading-6 text-muted-foreground">Máy chủ đã ghi nhận kỳ Premium. Mở trang gói học để xem quyền lợi đang có hiệu lực.</p>}
    {purchase.status === "REFUNDED" && <p className="leading-6 text-muted-foreground">Hoàn tiền đã được xác nhận. Kỳ Premium tương ứng kết thúc; lượng hạn mức đã dùng được giữ nguyên.</p>}
    {purchase.periodEndAt && <p className="leading-6 text-muted-foreground">Kỳ đã mua kết thúc: <DateTime value={purchase.periodEndAt} />.</p>}
    {checkout && <div className="space-y-3"><Button asChild className="min-h-12 rounded-xl"><a href={purchase.checkoutUrl ?? undefined} target="_blank" rel="noopener noreferrer">Thanh toán qua VNPay</a></Button><p className="text-sm leading-6 text-muted-foreground">Trang thanh toán mở trong thẻ mới. Quay lại đây để xem kết quả.</p></div>}
    {purchase.status === "PAYMENT_PENDING" && !checkout && <p className="leading-6 text-muted-foreground">Liên kết thanh toán không còn khả dụng. Máy chủ tiếp tục kiểm tra kết quả của yêu cầu này.</p>}
    <DevPurchaseResetAction userId={userId} purchase={purchase} />
    <div className="flex flex-wrap gap-3"><Button variant="outline" className="min-h-12 rounded-xl" disabled={state.loading} onClick={state.refresh}>{state.loading ? "Đang kiểm tra…" : "Kiểm tra lại kết quả"}</Button><Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to="/subscription">Xem gói học & quyền lợi</Link></Button></div>
  </Surface>;
}
export function SubscriptionPurchasesView() {
  return <SubscriptionPage title="Lịch sử mua hàng" description="Theo dõi đơn hàng và thanh toán."><PrivateAccount>{() => <PurchaseHistory />}</PrivateAccount></SubscriptionPage>;
}
export function SubscriptionPurchaseDetailView() {
  const { reference = "" } = useParams();
  return <SubscriptionPage title="Chi tiết đơn hàng" description="Theo dõi trạng thái thanh toán."><PrivateAccount>{userId => <PurchaseDetail key={reference} userId={userId} reference={reference} />}</PrivateAccount></SubscriptionPage>;
}
function PaymentReturn({ search }: { search: string }) {
  const fetcher = useCallback((signal: AbortSignal) => subscriptionService.paymentReturn(search, signal), [search]);
  const state = useFetch(fetcher);
  if (state.loading) return <LoadingState label="Đang kiểm tra thông tin trả về…" />;
  if (state.error) return <Unavailable error={state.error} retry={state.refetch} />;
  return <Surface className="space-y-4"><h2 className="text-[22px] font-semibold leading-7">Quay lại từ thanh toán</h2><p className="leading-6 text-muted-foreground">{state.data?.validSignature ? "Thông tin trả về đã được kiểm tra. Kết quả thanh toán vẫn cần được máy chủ xác nhận." : "Chưa xác minh được thông tin trả về. Hãy mở lịch sử để kiểm tra yêu cầu của bạn."}</p><Button asChild className="min-h-12 rounded-xl"><Link to={state.data?.validSignature && state.data.purchaseReference ? `/subscription/purchases/${encodeURIComponent(state.data.purchaseReference)}` : "/subscription/purchases"}>Kiểm tra đơn mua</Link></Button></Surface>;
}
export function SubscriptionPaymentReturnView() {
  const { search } = useLocation();
  return <SubscriptionPage title="Kết quả thanh toán" description="Kiểm tra kết quả từ VNPay."><PrivateAccount>{() => <PaymentReturn search={search} />}</PrivateAccount></SubscriptionPage>;
}
