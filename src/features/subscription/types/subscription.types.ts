export interface PlanBenefit {
  code: string;
  title: string;
  description: string;
  displayValue?: string | null;
  sortOrder: number;
}
export interface PlanBillingOption {
  billingPeriod: "MONTHLY" | "ANNUAL";
  amount: number;
  currency: string;
}
export interface PlanCard {
  planCode: string;
  displayName: string;
  description?: string | null;
  benefits: PlanBenefit[];
  billingOptions: PlanBillingOption[];
}
export interface MySubscriptionSummary {
  tier: "FREE" | "PREMIUM";
  status: "FREE" | "TRIAL" | "ACTIVE" | "EXPIRED" | "REFUNDED";
  periodStartAt: string | null;
  periodEndAt: string | null;
  trialEligible: boolean;
  trialIneligibilityReason: "ALREADY_USED" | "ACTIVE_PREMIUM" | null;
  currentBenefits: {
    planCode: "FREE" | "PREMIUM";
    displayName: string;
    policySnapshotId: string;
    benefits: PlanBenefit[];
  };
}
export interface QuotaUsageItem {
  quotaType: string;
  displayName: string;
  used: number;
  limit: number;
  remaining: number;
  unit: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  windowStartAt: string;
  windowEndsAt: string;
  allowanceStartAt: string;
  status: "AVAILABLE" | "EXHAUSTED" | "OVER_LIMIT";
  overLimitAmount?: number;
}
export interface TrialActivation {
  trialPeriodId: string;
  periodStartAt: string;
  periodEndAt: string;
  policySnapshotId: string;
}
export interface ApiEnvelope<T> { data: T; timestamp: string }
