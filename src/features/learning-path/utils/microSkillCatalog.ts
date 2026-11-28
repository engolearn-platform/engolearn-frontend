import type { MicroSkillDefinition } from "@features/learning-path/types/micro-skill-catalog.types";

export function microSkillLabel(value: string | null, catalog: readonly MicroSkillDefinition[] = []): string {
  if (!value) return "Chưa phân loại";
  const translation = catalog.find(item => item.canonicalName === value)?.displayNameVi;
  return typeof translation === "string" && translation.trim() ? translation : value;
}
