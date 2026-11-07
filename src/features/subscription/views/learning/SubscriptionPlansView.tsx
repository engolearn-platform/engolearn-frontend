import { useState } from "react";
import { BadgeCheck, CalendarDays, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/shadcn/dialog";
import { useAuth } from "@shared/hooks/useAuth";
import PremiumPurchaseAction from "@features/subscription/components/PremiumPurchaseAction";
import { useMySubscription, usePlans, useTrialActivation } from "@features/subscription/hooks/useSubscription";
import { Benefits, DateTime, LoadingState, PrivateAccount, SubscriptionPage, Surface, Unavailable } from "@features/subscription/components/SubscriptionUi";
import type { MySubscriptionSummary, PlanCard } from "@features/subscription/types/subscription.types";

const planCopy: Record<string, { description: string; benefits: { code: string; title: string }[] }> = {
  FREE: {
    description: "Bắt đầu học tiếng Anh",
    benefits: [{ code: "TOPIC_ACCESS", title: "Học chủ đề A1–A2" }],
  },
  PREMIUM: {
    description: "Bứt phá kỹ năng tiếng Anh",
    benefits: [
      { code: "TOPIC_ACCESS", title: "Mở khóa toàn bộ chủ đề A1–B2" },
      { code: "SKILL_ANALYSIS", title: "Phân tích kỹ năng chuyên sâu" },
      { code: "PERSONALIZED_LEARNING_PATH", title: "Lộ trình cá nhân hóa" },
    ],
  },
};

const statusLabels: Record<MySubscriptionSummary["status"], string> = {
  FREE: "Đang sử dụng", TRIAL: "Đang dùng thử", ACTIVE: "Đang hoạt động",
  EXPIRED: "Gói trước đã hết hạn", REFUNDED: "Gói trước đã hoàn tiền",
};

function TrialAction({ summary, trial, refresh }: {
  summary: MySubscriptionSummary;
  trial: ReturnType<typeof useTrialActivation>;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const canRetry = trial.failure?.ambiguous || trial.failure?.code === "SUBSCRIPTION_STATE_UNAVAILABLE";
  if (trial.failure) return <div role="alert" className="space-y-3">
    <p className="font-semibold">{trial.failure.ambiguous ? "Đang xác nhận kết quả dùng thử" : "Chưa thể kích hoạt dùng thử"}</p>
    <p className="text-on-surface-variant">{trial.failure.ambiguous ? "Bấm thử lại để xác nhận yêu cầu đã gửi." : trial.failure.message}</p>
    <div className="flex flex-wrap gap-2">
      {canRetry && <Button disabled={trial.pending} className="min-h-12 rounded-xl" onClick={() => void trial.activate()}>{trial.pending ? "Đang xác nhận…" : "Thử lại"}</Button>}
      <Button variant="outline" disabled={trial.pending} className="min-h-12 rounded-xl" onClick={refresh}>Tải lại quyền lợi</Button>
    </div>
    {trial.failure.code && <details className="text-label-sm text-on-surface-variant"><summary className="cursor-pointer py-2">Chi tiết lỗi</summary><p className="break-words">{trial.failure.code}</p></details>}
  </div>;
  if (!summary.trialEligible || trial.confirmed) return null;
  return <Dialog open={open} onOpenChange={value => { if (!trial.pending) setOpen(value); }}>
    <DialogTrigger asChild><Button className="min-h-12 rounded-xl"><Sparkles className="size-4" aria-hidden="true" />Dùng thử Premium 7 ngày</Button></DialogTrigger>
    <DialogContent showCloseButton={false}
      onEscapeKeyDown={event => { if (trial.pending) event.preventDefault(); }}
      onInteractOutside={event => { if (trial.pending) event.preventDefault(); }}>
      <DialogHeader>
        <DialogTitle>Dùng thử Premium 7 ngày?</DialogTitle>
        <DialogDescription className="leading-6">Bắt đầu ngay sau khi kích hoạt, một lần mỗi tài khoản. Không tự thu phí. Lượng hạn mức đã dùng trong kỳ được giữ lại.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" disabled={trial.pending} className="min-h-12 rounded-xl" onClick={() => setOpen(false)}>Để sau</Button>
        <Button disabled={trial.pending} className="min-h-12 rounded-xl" onClick={() => void trial.activate()}>{trial.pending ? "Đang kích hoạt…" : "Bắt đầu dùng thử"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function CurrentSubscription({ summary }: { summary: MySubscriptionSummary }) {
  const historical = summary.status === "EXPIRED" || summary.status === "REFUNDED";
  return <Surface className="overflow-hidden !border-0 !bg-primary bg-gradient-to-r from-primary to-primary-container !p-6 !text-on-primary !shadow-sm md:!p-8">
    <div className="flex flex-wrap items-center justify-between gap-6">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-on-primary/15"><BadgeCheck className="size-8" aria-hidden="true" /></span>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="break-words text-headline-md font-semibold">{summary.currentBenefits.displayName}</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-label-sm font-semibold text-secondary"><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{statusLabels[summary.status]}</span>
          </div>
          <p className="max-w-2xl text-body-md leading-relaxed text-on-primary/90">{planCopy[summary.tier].description}</p>
          {summary.periodStartAt && summary.periodEndAt && <div className="flex flex-wrap gap-x-5 gap-y-2 text-label-sm text-on-primary/90">
            <span className="flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true" />{historical ? "Kỳ trước bắt đầu " : "Ngày bắt đầu "}<DateTime value={summary.periodStartAt} /></span>
            <span className="flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true" />{historical ? "Kỳ trước kết thúc " : "Ngày kết thúc kỳ "}<DateTime value={summary.periodEndAt} /></span>
          </div>}
        </div>
      </div>
      <div className="flex flex-col items-start gap-2 text-label-sm md:items-end">
        <span className="rounded-lg bg-on-primary/15 px-3 py-2 font-semibold">{summary.tier === "PREMIUM" ? "Kỳ học đang có hiệu lực" : "Gói mặc định của bạn"}</span>
      </div>
    </div>
  </Surface>;
}

function PublishedPlan({ plan, summary, billingPeriod }: { plan: PlanCard; summary?: MySubscriptionSummary; billingPeriod: "MONTHLY" | "ANNUAL" }) {
  const option = plan.billingOptions.find(item => item.billingPeriod === billingPeriod);
  const premium = plan.planCode === "PREMIUM";
  const free = plan.planCode === "FREE";
  const current = summary?.tier === plan.planCode;
  const copy = planCopy[plan.planCode];
  const description = copy?.description ?? plan.description?.trim().split(/\s+/).slice(0, 6).join(" ");
  const extraBenefits = (copy?.benefits ?? []).filter(extra =>
    !plan.benefits.some(benefit => benefit.code === extra.code || benefit.title.trim().toLocaleLowerCase() === extra.title.toLocaleLowerCase()));
  const lastOrder = Math.max(-1, ...plan.benefits.map(benefit => benefit.sortOrder));
  const benefits = [...plan.benefits, ...extraBenefits.map((extra, index) => ({
    ...extra, description: "", sortOrder: lastOrder + index + 1,
  }))];
  let price: string | null = null;
  if (option) {
    const formatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: option.currency });
    price = formatter.format(option.amount / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 0));
  }
  return <Surface className={"flex h-full flex-col gap-6 !border-learning-outline !p-6 !shadow-sm md:!p-8 " + (premium ? "!border-t-4 !border-t-primary" : "!border-t-4 !border-t-transparent")}>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={"inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-sm font-semibold " + (premium ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant")}>
          {premium && <Sparkles className="size-3" aria-hidden="true" />}{premium ? "Được khuyên dùng" : "Khởi đầu"}
        </span>
        <span className="text-label-sm font-semibold text-primary">{current ? "Gói hiện tại" : premium ? "Toàn quyền A1–B2" : "Cơ bản"}</span>
      </div>
      <h3 className="text-headline-lg font-bold">{plan.displayName}</h3>
      {description && <p className="text-body-md leading-relaxed text-on-surface-variant">{description}</p>}
    </div>
    <div className={"space-y-2 rounded-xl p-4 " + (premium ? "bg-learning-nav-active" : "bg-surface")}>
      <p className="flex flex-wrap items-baseline gap-2"><span className={"break-words text-headline-lg font-bold " + (premium ? "text-primary" : "")}>{free ? "0đ" : price ?? "Chưa mở bán"}</span><span className="text-body-md text-on-surface-variant">{free ? "/ tháng" : option ? option.billingPeriod === "MONTHLY" ? "/ tháng" : "/ năm" : ""}</span></p>
      <p className="text-label-sm text-on-surface-variant">{premium ? "Không tự động gia hạn" : "Mở sẵn cho mọi tài khoản"}</p>
    </div>
    <div>
      {premium && option && summary?.status !== "ACTIVE" ?
        <PrivateAccount>{userId => <PremiumPurchaseAction userId={userId} option={option} />}</PrivateAccount> :
        current ? <p className="rounded-xl bg-surface-container-low px-4 py-3 text-center font-semibold text-on-surface-variant">Gói đang sử dụng</p> :
        <p className="text-label-sm text-on-surface-variant">{plan.planCode === "FREE" ? "Gói cơ bản cho mọi tài khoản" : "Chưa có lựa chọn thanh toán"}</p>}
    </div>
    <Benefits items={benefits} />
  </Surface>;
}

function Offers({ plans, summary }: { plans: ReturnType<typeof usePlans>; summary?: MySubscriptionSummary }) {
  const [selectedPeriod, setSelectedPeriod] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const items = plans.data?.data.items ?? [];
  const periods = (["MONTHLY", "ANNUAL"] as const).filter(period => items.some(plan => plan.billingOptions.some(option => option.billingPeriod === period)));
  const billingPeriod = periods.includes(selectedPeriod) ? selectedPeriod : periods[0] ?? "MONTHLY";
  const premium = items.find(plan => plan.planCode === "PREMIUM");
  const monthly = premium?.billingOptions.find(option => option.billingPeriod === "MONTHLY");
  const annual = premium?.billingOptions.find(option => option.billingPeriod === "ANNUAL");
  const savings = monthly && annual && monthly.currency === annual.currency && monthly.amount > 0
    ? Math.round((1 - annual.amount / (monthly.amount * 12)) * 100) : 0;
  return <section aria-labelledby="offers-heading" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 id="offers-heading" className="text-headline-md font-semibold">Bảng so sánh chi tiết các gói</h2><p className="mt-1 text-body-md text-on-surface-variant">Lựa chọn phù hợp với tốc độ và mục tiêu của bạn.</p></div>
      {periods.length > 0 && <div role="group" aria-label="Kỳ thanh toán" className="inline-flex flex-wrap gap-1 rounded-xl bg-surface-container-high p-1">
        {periods.map(period => <Button key={period} type="button" variant="ghost" aria-pressed={billingPeriod === period} onClick={() => setSelectedPeriod(period)} className={"min-h-12 rounded-lg px-4 font-semibold " + (billingPeriod === period ? "bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container-lowest" : "text-on-surface-variant")}>{period === "MONTHLY" ? "Theo tháng" : "Theo năm"}{period === "ANNUAL" && savings > 0 && <span className="rounded-full bg-secondary-container px-2 py-1 text-label-sm text-secondary">Tiết kiệm {savings}%</span>}</Button>)}
      </div>}
    </div>
    {plans.loading ? <LoadingState label="Đang tải gói học…" /> :
      plans.error ? <Unavailable error={plans.error} retry={plans.refetch} /> :
      plans.data?.data.items.length === 0 ? <Surface><p>Hiện chưa có gói học được công bố.</p></Surface> :
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] items-stretch gap-6">{plans.data?.data.items.map(plan => <PublishedPlan key={plan.planCode} plan={plan} summary={summary} billingPeriod={billingPeriod} />)}</div>}
  </section>;
}

function AccountContent({ userId, plans }: { userId: string; plans: ReturnType<typeof usePlans> }) {
  const state = useMySubscription();
  const trial = useTrialActivation(userId, state.refetch);
  const summary = !state.loading && !state.error ? state.data?.data : undefined;
  return <div className="space-y-8">
    {trial.confirmed && <p role="status" className="flex items-start gap-2 text-primary"><CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />Đã kích hoạt dùng thử. Quyền lợi mới được hiển thị khi tải lại thành công.</p>}
    {state.loading ? <LoadingState label="Đang tải gói hiện tại…" /> :
      state.error ? <Unavailable error={state.error} retry={state.refetch} /> :
      summary && <CurrentSubscription summary={summary} />}
    {summary && <TrialAction summary={summary} trial={trial} refresh={state.refetch} />}
    <Offers plans={plans} summary={summary} />
  </div>;
}

export default function SubscriptionPlansView() {
  const plans = usePlans();
  const auth = useAuth();
  return <SubscriptionPage>
    <PrivateAccount>{userId => <AccountContent userId={userId} plans={plans} />}</PrivateAccount>
    {(!auth.user || auth.isLoading || auth.error) && <Offers plans={plans} />}
    <div className="flex items-start gap-4 rounded-2xl bg-surface-container-low p-6 text-on-surface-variant md:p-8">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-learning-mint"><ShieldCheck className="size-6 text-primary" aria-hidden="true" /></span>
      <div className="space-y-4"><h2 className="text-headline-sm font-semibold text-on-surface">Cam kết minh bạch về kỳ học & chi phí</h2><p className="text-body-md leading-relaxed">Không tự động gia hạn hay thu phí khi hết kỳ. Tài khoản trở về gói Miễn phí và dữ liệu học tập được giữ lại. Đổi gói giữ nguyên lượng hạn mức đã dùng trong kỳ.</p><div className="flex flex-wrap gap-x-6 gap-y-2 text-label-sm"><span>Không tự động gia hạn</span><span>Giữ dữ liệu học tập</span><span>Hạn mức minh bạch</span></div></div>
    </div>
  </SubscriptionPage>;
}
