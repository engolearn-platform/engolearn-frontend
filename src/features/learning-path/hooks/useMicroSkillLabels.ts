import { useContext } from "react";
import { MicroSkillCatalogContext } from "@features/learning-path/utils/microSkillCatalogContext";
import { microSkillLabel } from "@features/learning-path/utils/microSkillCatalog";

export function useMicroSkillLabels() {
  const catalog = useContext(MicroSkillCatalogContext);
  return { catalog, label: (value: string | null) => microSkillLabel(value, catalog) };
}
