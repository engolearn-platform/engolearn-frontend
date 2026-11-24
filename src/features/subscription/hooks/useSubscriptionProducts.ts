import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { subscriptionProductService } from "@features/subscription/services/subscriptionProduct.service";

export function useSubscriptionProducts() {
  return useFetch(useCallback((signal: AbortSignal) => subscriptionProductService.catalog(signal), []));
}

export function useSubscriptionProduct(planCode: string) {
  return useFetch(useCallback((signal: AbortSignal) => subscriptionProductService.detail(planCode, signal), [planCode]));
}
