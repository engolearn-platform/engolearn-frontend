import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { useFetch } from "@shared/hooks";
import { subscriptionService } from "@features/subscription/services/subscription.service";
import PlanPurchaseAction from "@features/subscription/components/PlanPurchaseAction";
import { Benefits, LoadingState, PrivateAccount, SubscriptionPage, Surface, Unavailable } from "@features/subscription/components/SubscriptionUi";
import type { BillingPeriod } from "@features/subscription/types/purchase.types";
import type { PlanBillingOption, PlanCard } from "@features/subscription/types/subscription.types";

function price(option: PlanBillingOption) {
  const formatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: option.currency });
  return formatter.format(option.amount / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 0));
}

function PlanDetails({ plan, refreshPlan }: { plan: PlanCard; refreshPlan: () => void }) {
  const [period, setPeriod] = useState<BillingPeriod>(plan.billingOptions.some(option => option.billingPeriod === "MONTHLY") ? "MONTHLY" : "ANNUAL");
  const option = plan.billingOptions.find(item => item.billingPeriod === period);
  const periods = ["MONTHLY", "ANNUAL"] as const;

  return <div className="space-y-6">
    <Surface className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><p className="text-sm font-semibold text-primary">{plan.saleStatus === "STOPPED" ? "Đã dừng bán" : "Gói học"}</p><h2 className="text-headline-lg font-bold">{plan.displayName}</h2>{plan.description && <p className="max-w-3xl leading-6 text-muted-foreground">{plan.description}</p>}</div><span className="rounded-full bg-muted px-3 py-2 text-sm font-semibold">Phiên bản v{plan.version}</span></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Kỳ thanh toán">{periods.filter(value => plan.billingOptions.some(item => item.billingPeriod === value)).map(value => <Button key={value} type="button" variant="outline" aria-pressed={period === value} onClick={() => setPeriod(value)} className={"min-h-12 rounded-xl " + (period === value ? "border-primary text-primary" : "")}>{value === "MONTHLY" ? "Theo tháng" : "Theo năm"}</Button>)}</div>
      <p className="text-headline-md font-semibold">{option ? `${price(option)} / ${period === "MONTHLY" ? "tháng" : "năm"}` : "Kỳ này chưa có giá"}</p>
      <p className="text-sm text-muted-foreground">Không tự động gia hạn.</p>
      {option && plan.version && <PrivateAccount>{userId => <PlanPurchaseAction userId={userId} plan={plan} option={option} refreshPlan={refreshPlan} />}</PrivateAccount>}
      {plan.saleStatus === "STOPPED" && <p className="leading-6 text-muted-foreground">Gói này đang dừng bán. Bạn vẫn có thể xem quyền lợi của phiên bản hiện tại.</p>}
    </Surface>
    <Surface><h2 className="mb-5 text-headline-md font-semibold">Quyền lợi trong phiên bản này</h2><Benefits items={plan.benefits} /></Surface>
    <Button asChild variant="outline" className="min-h-12 rounded-xl"><Link to="/subscription">Quay lại các gói học</Link></Button>
  </div>;
}

export default function SubscriptionPlanDetailView() {
  const { planCode = "" } = useParams();
  const fetcher = useCallback((signal: AbortSignal) => subscriptionService.plan(planCode, signal), [planCode]);
  const state = useFetch(fetcher);
  return <SubscriptionPage title="Chi tiết gói" description="Xem quyền lợi và giá của phiên bản đang được cung cấp.">
    {state.loading && <LoadingState label="Đang tải gói học…" />}
    {state.error && <Unavailable error={state.error} retry={state.refetch} />}
    {state.data && <PlanDetails plan={state.data.data} refreshPlan={state.refetch} />}
  </SubscriptionPage>;
}
