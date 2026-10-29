import { useState } from "react";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/shadcn/dialog";
import { useMySubscription, usePlans, useTrialActivation } from "@features/subscription/hooks/useSubscription";
import { Benefits, DateTime, LoadingState, PrivateAccount, SubscriptionPage, Surface, Unavailable, UsageLink } from "@features/subscription/components/SubscriptionUi";
import type { MySubscriptionSummary, PlanCard } from "@features/subscription/types/subscription.types";

const statusLabels: Record<MySubscriptionSummary["status"], string> = { FREE: "Gói miễn phí", TRIAL: "Đang dùng thử", ACTIVE: "Premium đang hoạt động", EXPIRED: "Gói trước đã hết hạn", REFUNDED: "Gói trước đã hoàn tiền" };

function TrialAction({ summary, trial, refresh }: { summary: MySubscriptionSummary; trial: ReturnType<typeof useTrialActivation>; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const canRetry = trial.failure?.ambiguous || trial.failure?.code === "SUBSCRIPTION_STATE_UNAVAILABLE";
  return <div className="space-y-3 border-t border-border pt-4">
    {trial.failure && <div role="alert" className="space-y-2"><p className="font-semibold">{trial.failure.ambiguous ? "Chưa xác định kết quả kích hoạt" : "Chưa thể kích hoạt dùng thử"}</p><p className="break-words text-muted-foreground">{trial.failure.message}</p>{trial.failure.code && <p className="text-sm text-muted-foreground">Mã: {trial.failure.code}</p>}{trial.failure.ambiguous && <p className="text-muted-foreground">Yêu cầu có thể đã được xử lý. Thử lại sẽ dùng cùng mã yêu cầu, không tạo một lần dùng thử mới.</p>}<div className="flex flex-wrap gap-2">{canRetry && <Button className="min-h-12 rounded-xl" disabled={trial.pending} onClick={() => void trial.activate()}>{trial.pending ? "Đang xác nhận…" : "Thử lại cùng yêu cầu"}</Button>}<Button variant="outline" className="min-h-12 rounded-xl" disabled={trial.pending} onClick={refresh}>Kiểm tra quyền lợi hiện tại</Button></div></div>}
    {summary.trialEligible && !trial.failure && !trial.confirmed && <Dialog open={open} onOpenChange={value => { if (!trial.pending) setOpen(value); }}><DialogTrigger asChild><Button className="min-h-12 rounded-xl"><Sparkles aria-hidden="true" />Kích hoạt dùng thử 7 ngày</Button></DialogTrigger><DialogContent showCloseButton={false} onEscapeKeyDown={event => { if (trial.pending) event.preventDefault(); }} onInteractOutside={event => { if (trial.pending) event.preventDefault(); }}><DialogHeader><DialogTitle>Kích hoạt dùng thử Premium?</DialogTitle><DialogDescription className="leading-6">Dùng thử bắt đầu ngay khi máy chủ xác nhận, kéo dài 7 ngày và chỉ được kích hoạt một lần cho mỗi tài khoản. Hạn mức đã sử dụng trong kỳ được giữ nguyên. Không tự động thu phí.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" className="min-h-12 rounded-xl" disabled={trial.pending} onClick={() => setOpen(false)}>Để sau</Button><Button className="min-h-12 rounded-xl" disabled={trial.pending} onClick={() => void trial.activate()}>{trial.pending ? "Đang kích hoạt…" : "Xác nhận kích hoạt"}</Button></DialogFooter></DialogContent></Dialog>}
    {!summary.trialEligible && !trial.failure && <p className="leading-6 text-muted-foreground">{summary.trialIneligibilityReason === "ACTIVE_PREMIUM" ? "Premium của bạn đang hoạt động. Không có thao tác đăng ký thêm gói trong kỳ này." : summary.status === "TRIAL" ? "Bạn đang sử dụng lần dùng thử của tài khoản." : "Tài khoản đã sử dụng quyền dùng thử một lần."}</p>}
  </div>;
}
function CurrentSubscription({ userId }: { userId: string }) {
  const state = useMySubscription();
  const trial = useTrialActivation(userId, state.refetch);
  const confirmation = trial.confirmed && <p role="status" className="flex gap-2 leading-6 text-primary"><CheckCircle2 className="mt-1 size-5 shrink-0" aria-hidden="true" />Máy chủ đã xác nhận kích hoạt dùng thử. Quyền lợi hiện tại được kiểm tra riêng bên dưới.</p>;
  if (state.loading) return <div className="space-y-4">{confirmation}<LoadingState label="Đang tải quyền lợi hiện tại…" /></div>;
  if (state.error) return <div className="space-y-4">{confirmation}<Unavailable error={state.error} retry={state.refetch} /></div>;
  if (!state.data) return null;
  const summary = state.data.data;
  const historical = summary.status === "EXPIRED" || summary.status === "REFUNDED";
  return <Surface className="space-y-5">
    {confirmation}
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 font-semibold text-primary"><ShieldCheck className="size-5" aria-hidden="true" />QUYỀN LỢI HIỆN TẠI</p><h2 className="mt-2 text-[22px] font-semibold leading-7">{summary.currentBenefits.displayName}</h2><p className="mt-2 text-muted-foreground">{statusLabels[summary.status]}</p></div><UsageLink /></div>
    {summary.periodStartAt && summary.periodEndAt && <p className="leading-6 text-muted-foreground">{historical ? "Kỳ trước: " : "Kỳ hiện tại: "}<DateTime value={summary.periodStartAt} /> — <DateTime value={summary.periodEndAt} /> (giờ Việt Nam).{!historical && " Quyền lợi có hiệu lực đến thời điểm kết thúc này."}</p>}
    <Benefits items={summary.currentBenefits.benefits} />
    <p className="text-sm leading-6 text-muted-foreground">{summary.tier === "PREMIUM" ? "Quyền lợi của bạn được giữ đến hết kỳ hiện tại." : "Hạn mức đang áp dụng cho tài khoản của bạn."}</p>
    <TrialAction summary={summary} trial={trial} refresh={state.refetch} />
  </Surface>;
}
function PublishedPlan({ plan }: { plan: PlanCard }) {
  const [selection, setSelection] = useState(0);
  const option = plan.billingOptions[selection] ?? plan.billingOptions[0];
  let price: string | null = null;
  if (option) {
    const formatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: option.currency });
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 0;
    price = formatter.format(option.amount / 10 ** digits);
  }
  return <Surface className="flex h-full flex-col gap-5">
    <div><p className="text-sm font-semibold text-primary">{plan.planCode}</p><h3 className="mt-2 text-[22px] font-semibold leading-7">{plan.displayName}</h3>{plan.description && <p className="mt-2 leading-6 text-muted-foreground">{plan.description}</p>}</div>
    {plan.billingOptions.length > 1 && <div role="group" aria-label={`Kỳ thanh toán của ${plan.displayName}`} className="flex flex-wrap gap-2">{plan.billingOptions.map((item, index) => <Button key={`${item.billingPeriod}-${index}`} variant={index === selection ? "default" : "outline"} aria-pressed={index === selection} className="min-h-12 rounded-xl" onClick={() => setSelection(index)}>{item.billingPeriod === "MONTHLY" ? "Hàng tháng" : "Hàng năm"}</Button>)}</div>}
    {price && option && <div><p className="break-words text-[28px] font-bold leading-9">{price}</p><p className="text-muted-foreground">{option.billingPeriod === "MONTHLY" ? "mỗi tháng" : "mỗi năm"}</p></div>}
    <Benefits items={plan.benefits} />
    <p className="mt-auto border-t border-border pt-4 leading-6 text-muted-foreground">{plan.billingOptions.length ? "Thông tin giá đã công bố. Thanh toán Premium chưa được mở tại đây." : "Gói không có lựa chọn thanh toán."}</p>
  </Surface>;
}
export default function SubscriptionPlansView() {
  const plans = usePlans();
  return <SubscriptionPage><PrivateAccount>{userId => <CurrentSubscription userId={userId} />}</PrivateAccount><section aria-labelledby="offers-heading" className="space-y-4"><div><h2 id="offers-heading" className="text-[22px] font-semibold leading-7">Các gói học đang công bố</h2><p className="mt-2 leading-6 text-muted-foreground">Thông tin mới nhất của các gói học. Quyền lợi cá nhân của bạn được hiển thị riêng ở trên.</p></div>{plans.loading ? <LoadingState label="Đang tải các gói học…" /> : plans.error ? <Unavailable error={plans.error} retry={plans.refetch} /> : plans.data?.data.items.length === 0 ? <Surface><p>Hiện chưa có gói học được công bố.</p></Surface> : <div className="grid gap-4 lg:grid-cols-2">{plans.data?.data.items.map(plan => <PublishedPlan key={plan.planCode} plan={plan} />)}</div>}</section><Surface><h2 className="text-lg font-semibold">Chủ động với việc học của bạn</h2><p className="mt-2 leading-6 text-muted-foreground">Không tự động gia hạn hay thu phí. Đổi gói áp dụng hạn mức hiện tại và giữ lượng đã sử dụng trong cùng kỳ. Dữ liệu học tập được giữ lại khi gói kết thúc.</p></Surface></SubscriptionPage>;
}
