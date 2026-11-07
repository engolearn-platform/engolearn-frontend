export type BillingPeriod = "MONTHLY" | "ANNUAL";
export type PurchaseStatus = "PAYMENT_SETUP_PENDING" | "PAYMENT_PENDING" | "PAYMENT_SETUP_FAILED" | "PAYMENT_FAILED" | "PAYMENT_EXPIRED" | "ACTIVE" | "REQUIRES_REVIEW" | "REFUND_PENDING" | "REFUNDED";
export interface Purchase {
  devResetAllowed?: boolean;
  devResetAt?: string | null;
  purchaseReference: string;
  status: PurchaseStatus;
  billingPeriod: BillingPeriod;
  amountVnd: number;
  currency: "VND";
  paymentId: string | null;
  checkoutUrl: string | null;
  expiresAt: string;
  paidAt: string | null;
  periodId: string | null;
  createdAt: string;
  failureCode: string | null;
  periodEndAt: string | null;
  refundReference: string | null;
  refundId: string | null;
  refundStatus: "NONE" | "REQUESTED" | "PROCESSING" | "UNKNOWN" | "SUCCEEDED" | "FAILED" | null;
}
export interface PurchaseHistory { items: Purchase[]; nextCursor: string | null }
export interface PaymentReturn { validSignature: boolean; purchaseReference: string | null; message: string }
export interface DevPurchaseReset { purchaseReference: string; resetAt: string }
