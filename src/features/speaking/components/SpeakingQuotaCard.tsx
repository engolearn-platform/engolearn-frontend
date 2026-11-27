import { useEffect } from "react";
import { Link } from "react-router";
import { Button } from "@/core/components/shadcn/button";
import { usePlans, useQuotaUsage, type QuotaUsageItem } from "@features/subscription/contract";
import { ROUTES } from "@shared/constants";
import { formatSpeakingDuration, hasHigherSpeakingOffer, isQuotaWindowExpired, isSpeakingDurationQuota, remainingPercentage } from "@features/speaking/utils/speaking-quota-presentation";

function resetLabel(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(date);
}

function QuotaDetails({ quota, plans, onRetry }: { quota: QuotaUsageItem; plans: ReturnType<typeof usePlans>; onRetry: () => void }) {
  const progress = remainingPercentage(quota.remaining, quota.limit);
  const exhausted = quota.status === "EXHAUSTED" || quota.remaining === 0;
  const overLimit = quota.status === "OVER_LIMIT" || quota.used > quota.limit;
  const expired = isQuotaWindowExpired(quota.windowEndsAt);
  const canUpgrade = !plans.loading && !plans.error && Boolean(plans.data
    && hasHigherSpeakingOffer(plans.data.data.items, quota.limit));

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="speaking-quota-title" className="text-headline-md font-semibold">Hạn mức luyện nói hôm nay</h2>
        {!expired && <p className="mt-1 text-body-md leading-6 text-on-surface-variant">Còn lại {formatSpeakingDuration(quota.remaining)}</p>}
      </div>
      {!expired && canUpgrade && <Button asChild className="min-h-12 shrink-0"><Link to={ROUTES.SUBSCRIPTION}>Nâng cấp gói</Link></Button>}
    </div>
    {expired ? <div role="status" className="flex flex-wrap items-center justify-between gap-3"><p className="leading-6 text-on-surface-variant">Hạn mức đang được cập nhật sau khi kỳ mới bắt đầu.</p><Button variant="outline" className="min-h-12" onClick={onRetry}>Thử lại</Button></div> : <>
    <div className="grid gap-2 sm:grid-cols-3">
      <p className="text-sm leading-6 text-on-surface-variant">Tổng hạn mức {formatSpeakingDuration(quota.limit)}</p>
      <p className="text-sm leading-6 text-on-surface-variant">Đã sử dụng {formatSpeakingDuration(quota.used)}</p>
      <p className="text-sm leading-6 text-on-surface-variant sm:text-right">Cấp lại lúc {resetLabel(quota.windowEndsAt)} (GMT+7)</p>
    </div>
    <div role="progressbar" aria-label="Thời lượng luyện nói còn lại hôm nay" aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={progress} aria-valuetext={`Còn ${formatSpeakingDuration(quota.remaining)} trên ${formatSpeakingDuration(quota.limit)}.`}
      className="h-2 overflow-hidden rounded-full bg-surface-container-high">
      <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
    </div>
    {overLimit && <p className="text-sm leading-6 text-on-surface-variant">Lượng đã sử dụng vượt hạn mức; không còn thời lượng cho lượt mới.</p>}
    {exhausted && !overLimit && <p className="text-sm leading-6 text-on-surface-variant">Bạn đã dùng hết hạn mức luyện nói hôm nay.</p>}
    </>}
  </>;
}

export default function SpeakingQuotaCard() {
  const usage = useQuotaUsage();
  const quota = usage.data?.data.items.find(isSpeakingDurationQuota);
  const plans = usePlans(Boolean(quota));
  const refetchUsage = usage.refetch;
  const refetchPlans = plans.refetch;
  const hasQuota = Boolean(quota);
  const windowEndsAt = quota?.windowEndsAt;

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      refetchUsage();
      if (hasQuota) refetchPlans();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [hasQuota, refetchPlans, refetchUsage]);

  useEffect(() => {
    if (!windowEndsAt) return;
    const untilReset = Date.parse(windowEndsAt) - Date.now();
    const timer = window.setTimeout(() => refetchUsage(), Math.min(Math.max(untilReset + 250, 1000), 2_147_000_000));
    return () => window.clearTimeout(timer);
  }, [windowEndsAt, refetchUsage]);

  return <section aria-labelledby="speaking-quota-title" className="grid gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
    {usage.loading && <div><h2 id="speaking-quota-title" className="text-headline-md font-semibold">Hạn mức luyện nói</h2><p role="status" className="mt-1 text-on-surface-variant">Đang tải hạn mức luyện nói…</p></div>}
    {!usage.loading && usage.error?.code === "QUOTA_NOT_CONFIGURED" && <div role="status" className="space-y-3"><h2 id="speaking-quota-title" className="text-headline-md font-semibold">Hạn mức luyện nói</h2><p className="leading-6 text-on-surface-variant">Hạn mức luyện nói chưa được cấu hình.</p></div>}
    {!usage.loading && usage.error && usage.error.code !== "QUOTA_NOT_CONFIGURED" && <div role="alert" className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="speaking-quota-title" className="text-headline-md font-semibold">Hạn mức luyện nói</h2><p className="mt-1 leading-6 text-on-surface-variant">Chưa thể tải hạn mức luyện nói. Thử lại.</p></div><Button variant="outline" className="min-h-12" onClick={usage.refetch}>Thử lại</Button></div>}
    {!usage.loading && !usage.error && usage.data && !quota && <div><h2 id="speaking-quota-title" className="text-headline-md font-semibold">Hạn mức luyện nói</h2><p className="mt-1 leading-6 text-on-surface-variant">Chưa có hạn mức luyện nói áp dụng.</p></div>}
    {!usage.loading && !usage.error && quota && <QuotaDetails quota={quota} plans={plans} onRetry={usage.refetch} />}
  </section>;
}
