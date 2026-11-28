import type { ReactNode } from "react";
import type { MicroSkillDefinition } from "@features/learning-path/types/micro-skill-catalog.types";
import { MicroSkillCatalogContext } from "@features/learning-path/utils/microSkillCatalogContext";

export default function MicroSkillCatalogProvider({ catalog, children }: {
  catalog?: readonly MicroSkillDefinition[]; children: ReactNode;
}) {
  return <MicroSkillCatalogContext.Provider value={catalog ?? []}>{children}</MicroSkillCatalogContext.Provider>;
}
