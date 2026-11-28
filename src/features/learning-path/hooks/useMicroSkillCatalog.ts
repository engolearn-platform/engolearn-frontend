import { useCallback } from "react";
import { useFetch } from "@shared/hooks";
import { microSkillCatalogService } from "@features/learning-path/services/micro-skill-catalog.service";

export function useMicroSkillCatalog() {
  const load = useCallback((signal: AbortSignal) => microSkillCatalogService.list(signal), []);
  return useFetch(load);
}
