import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { dashboardService } from "@features/management-dashboard/services/dashboard.service";

export function useDashboardSummary(includeAdministration: boolean) {
  const fetchSummary = useCallback((signal: AbortSignal) => dashboardService.getSummary(signal, includeAdministration), [includeAdministration]);
  return useFetch(fetchSummary);
}
