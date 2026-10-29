import { httpService } from "@shared/services";
import type { ApiEnvelope, MySubscriptionSummary, PlanBenefit, PlanCard, QuotaUsageItem, TrialActivation } from "@features/subscription/types/subscription.types";

function invalid(): never { throw new Error("Dữ liệu phản hồi không hợp lệ. Vui lòng thử lại."); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function integer(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
function instant(value: unknown): value is string { return text(value) && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)); }
function benefits(value: unknown): asserts value is PlanBenefit[] {
  if (!Array.isArray(value)) invalid();
  const seen = new Set<string>();
  for (const entry of value) {
    const b = record(entry);
    if (!text(b.code) || seen.has(b.code) || !text(b.title) || typeof b.description !== "string" || !integer(b.sortOrder) || (b.displayValue !== undefined && b.displayValue !== null && typeof b.displayValue !== "string")) invalid();
    seen.add(b.code);
  }
}
function envelope<T>(value: unknown, validate: (data: Record<string, unknown>) => void): ApiEnvelope<T> {
  const result = record(value);
  if (!instant(result.timestamp)) invalid();
  validate(record(result.data));
  return result as unknown as ApiEnvelope<T>;
}
export const subscriptionService = {
  async plans(signal: AbortSignal) {
    return envelope<{ items: PlanCard[] }>(await httpService.get<unknown>("/api/v1/subscription/plans", { signal }), data => {
      if (!Array.isArray(data.items)) invalid();
      const seen = new Set<string>();
      for (const entry of data.items) {
        const p = record(entry);
        if (!text(p.planCode) || seen.has(p.planCode) || !text(p.displayName) || (p.description !== undefined && p.description !== null && typeof p.description !== "string")) invalid();
        seen.add(p.planCode);
        benefits(p.benefits);
        if (!Array.isArray(p.billingOptions)) invalid();
        for (const entry of p.billingOptions) {
          const b = record(entry);
          if (!["MONTHLY", "ANNUAL"].includes(String(b.billingPeriod)) || !integer(b.amount) || typeof b.currency !== "string" || !/^[A-Z]{3}$/.test(b.currency)) invalid();
          try { new Intl.NumberFormat("vi-VN", { style: "currency", currency: b.currency }); } catch { invalid(); }
        }
      }
    });
  },
  async me(signal: AbortSignal) {
    return envelope<MySubscriptionSummary>(await httpService.get<unknown>("/api/v1/subscription/me", { signal }), d => {
      if (!["FREE", "PREMIUM"].includes(String(d.tier)) || !["FREE", "TRIAL", "ACTIVE", "EXPIRED", "REFUNDED"].includes(String(d.status)) || typeof d.trialEligible !== "boolean") invalid();
      if (!(d.periodStartAt === null || instant(d.periodStartAt)) || !(d.periodEndAt === null || instant(d.periodEndAt))) invalid();
      if ((d.periodStartAt === null) !== (d.periodEndAt === null)) invalid();
      if (d.periodStartAt && d.periodEndAt && Date.parse(String(d.periodStartAt)) >= Date.parse(String(d.periodEndAt))) invalid();
      if (![null, "ALREADY_USED", "ACTIVE_PREMIUM"].includes(d.trialIneligibilityReason as null)) invalid();
      const b = record(d.currentBenefits);
      if (b.planCode !== d.tier || !text(b.displayName) || !text(b.policySnapshotId)) invalid();
      if ((d.status === "TRIAL" || d.status === "ACTIVE") && (d.tier !== "PREMIUM" || !d.periodEndAt)) invalid();
      if (d.trialEligible ? d.trialIneligibilityReason !== null || d.tier !== "FREE" : d.trialIneligibilityReason === null) invalid();
      benefits(b.benefits);
    });
  },
  async usage(signal: AbortSignal) {
    return envelope<{ items: QuotaUsageItem[] }>(await httpService.get<unknown>("/api/v1/quota/me/usage", { signal }), d => {
      if (!Array.isArray(d.items)) invalid();
      const seen = new Set<string>();
      for (const entry of d.items) {
        const q = record(entry);
        if (!text(q.quotaType) || seen.has(q.quotaType) || !text(q.displayName) || !text(q.unit) || !integer(q.used) || !integer(q.limit) || !integer(q.remaining)) invalid();
        seen.add(q.quotaType);
        if (!["DAILY", "WEEKLY", "MONTHLY"].includes(String(q.period)) || !instant(q.windowStartAt) || !instant(q.windowEndsAt) || !instant(q.allowanceStartAt)) invalid();
        if (Date.parse(q.windowStartAt) >= Date.parse(q.windowEndsAt) || Date.parse(q.allowanceStartAt) < Date.parse(q.windowStartAt) || Date.parse(q.allowanceStartAt) >= Date.parse(q.windowEndsAt)) invalid();
        if (q.remaining !== Math.max(0, q.limit - q.used) || q.status !== (q.used > q.limit ? "OVER_LIMIT" : q.used === q.limit ? "EXHAUSTED" : "AVAILABLE")) invalid();
        if (q.status === "OVER_LIMIT" ? q.overLimitAmount !== q.used - q.limit : q.overLimitAmount !== undefined && q.overLimitAmount !== 0) invalid();
      }
    });
  },
  async activateTrial(key: string, signal: AbortSignal) {
    return envelope<TrialActivation>(await httpService.post<unknown>("/api/v1/subscription/me/trial", {}, { signal, headers: { "Idempotency-Key": key } }), d => {
      if (!text(d.trialPeriodId) || !text(d.policySnapshotId) || !instant(d.periodStartAt) || !instant(d.periodEndAt) || Date.parse(d.periodStartAt) >= Date.parse(d.periodEndAt)) invalid();
    });
  },
};
