import { httpService } from "@shared/services/http.service";
import type { LearningPathApiResponse } from "@features/learning-path/types/learning-path.types";
import type { MicroSkillDefinition } from "@features/learning-path/types/micro-skill-catalog.types";

type CatalogItem = Omit<MicroSkillDefinition, "active"> & { status: "ACTIVE" | "INACTIVE" };

function isCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && !!item.id.trim()
    && typeof item.code === "string" && !!item.code.trim()
    && typeof item.canonicalName === "string" && !!item.canonicalName.trim()
    && (item.skill === "READING" || item.skill === "LISTENING")
    && (item.status === "ACTIVE" || item.status === "INACTIVE")
    && (item.displayNameVi == null || typeof item.displayNameVi === "string")
    && typeof item.displayOrder === "number" && Number.isInteger(item.displayOrder) && item.displayOrder >= 0;
}

export const microSkillCatalogService = {
  async list(signal: AbortSignal): Promise<MicroSkillDefinition[]> {
    const response = await httpService.get<LearningPathApiResponse<{ items: unknown[] }>>("/api/micro-skills", { signal });
    const items = response.data?.items;
    if (!Array.isArray(items) || !items.every(isCatalogItem)
      || new Set(items.map(item => item.id)).size !== items.length
      || new Set(items.map(item => item.canonicalName)).size !== items.length
      || new Set(items.map(item => item.code)).size !== items.length) {
      throw new Error("Danh mục kỹ năng không hợp lệ. Vui lòng thử tải lại.");
    }
    return items.map(item => ({ id: item.id, code: item.code, canonicalName: item.canonicalName,
      displayNameVi: item.displayNameVi, descriptionVi: item.descriptionVi, skill: item.skill,
      active: item.status === "ACTIVE", displayOrder: item.displayOrder }))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code));
  },
};
