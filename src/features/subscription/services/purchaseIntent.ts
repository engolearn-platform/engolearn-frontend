import type { BillingPeriod } from "@features/subscription/types/purchase.types";

export interface PurchaseIntent { key: string; billingPeriod: BillingPeriod; reference?: string }
const intents = new Map<string, PurchaseIntent>();
const storageKey = (userId: string) => `engolearn.subscription.purchase.${userId}`;

export function readPurchaseIntent(userId: string): PurchaseIntent | null {
  const cached = intents.get(userId);
  if (cached) return cached;
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(storageKey(userId)) ?? "null");
    if (raw && typeof raw === "object" && "key" in raw && typeof raw.key === "string" && /^[0-9a-f-]{36}$/i.test(raw.key) &&
        "billingPeriod" in raw && (raw.billingPeriod === "MONTHLY" || raw.billingPeriod === "ANNUAL") &&
        (!("reference" in raw) || typeof raw.reference === "string" && raw.reference.length > 0 && raw.reference.length <= 128)) {
      const intent: PurchaseIntent = { key: raw.key, billingPeriod: raw.billingPeriod, ...("reference" in raw ? { reference: raw.reference as string } : {}) };
      intents.set(userId, intent);
      return intent;
    }
  } catch { /* Runtime storage remains available. */ }
  return null;
}
export function savePurchaseIntent(userId: string, intent: PurchaseIntent) {
  intents.set(userId, intent);
  try { sessionStorage.setItem(storageKey(userId), JSON.stringify(intent)); } catch { /* Preserve the same key in memory. */ }
}
export function clearPurchaseIntent(userId: string, reference: string) {
  if (readPurchaseIntent(userId)?.reference !== reference) return;
  intents.delete(userId);
  try { sessionStorage.removeItem(storageKey(userId)); } catch { /* Resolved runtime state is already cleared. */ }
}
