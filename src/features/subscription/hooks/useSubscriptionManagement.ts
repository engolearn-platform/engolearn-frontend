import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { subscriptionManagementService as service } from "@features/subscription/services/subscriptionManagement.service";
import type { ConfigurationScope } from "@features/subscription/types/subscriptionManagement.types";

export function useSubscriptionManagement(scope: ConfigurationScope) {
  return useFetch(useCallback(async (signal: AbortSignal) => {
    const [catalog, configuration] = await Promise.all([service.catalog(signal), service.configuration(scope, signal)]);
    if (catalog.revision !== configuration.revision) throw new Error("Cấu hình đã thay đổi trong khi tải. Vui lòng tải lại.");
    for (const version of [configuration.current, configuration.pending]) {
      if (!version) continue;
      if (version.content.quotaRules.some(rule => !catalog.quotaTypes.some(type => type.quotaType === rule.quotaType && type.unit === rule.unit && type.period === rule.period))) throw new Error("Cấu hình và danh mục hạn mức không nhất quán.");
    }
    const now = Date.parse(configuration.serverTime);
    if (configuration.current && Date.parse(configuration.current.effectiveAt) > now || configuration.pending && (configuration.pending.status === "SCHEDULED" ? Date.parse(configuration.pending.effectiveAt) <= now : !configuration.activationPending || Date.parse(configuration.pending.effectiveAt) > now) || configuration.activationPending && !configuration.pending) throw new Error("Trạng thái phiên bản không nhất quán với thời gian máy chủ.");
    return { catalog, configuration };
  }, [scope]));
}
