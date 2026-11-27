import type { PlanCard, QuotaUsageItem } from "@features/subscription/contract";

export function formatSpeakingDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.trunc(seconds));
  if (safeSeconds < 60) return `${safeSeconds} giây`;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  return [hours ? `${hours} giờ` : "", minutes ? `${minutes} phút` : "", remainder ? `${remainder} giây` : ""].filter(Boolean).join(" ");
}

export function remainingPercentage(remaining: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.max(0, remaining / limit * 100));
}

export function isQuotaWindowExpired(windowEndsAt: string, now = Date.now()) {
  return Date.parse(windowEndsAt) <= now;
}

export function isSpeakingDurationQuota(item: QuotaUsageItem) {
  return item.quotaType === "SPEAKING_DURATION" && item.period === "DAILY" && item.unit === "SECOND";
}

export function hasHigherSpeakingOffer(plans: PlanCard[], currentLimit: number) {
  return plans.some(plan => plan.planCode !== "FREE" && plan.saleStatus === "ON_SALE"
    && plan.billingOptions.some(option => option.amount > 0)
    && typeof plan.speakingDurationDailyLimitSeconds === "number"
    && Number.isSafeInteger(plan.speakingDurationDailyLimitSeconds)
    && plan.speakingDurationDailyLimitSeconds > currentLimit);
}
