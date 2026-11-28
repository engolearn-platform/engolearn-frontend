import { createContext } from "react";
import type { MicroSkillDefinition } from "@features/learning-path/types/micro-skill-catalog.types";

export const MicroSkillCatalogContext = createContext<readonly MicroSkillDefinition[]>([]);
