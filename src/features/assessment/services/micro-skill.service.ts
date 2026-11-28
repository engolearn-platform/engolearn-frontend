import { httpService, type ApiEnvelope } from "@shared/services/http.service";

export type SkillSection = "READING" | "LISTENING";
type SkillStatus = "ACTIVE" | "INACTIVE";

interface CatalogFields {
  displayNameVi: string;
  descriptionVi: string;
  status: SkillStatus;
  displayOrder: number;
}

interface CreateCatalogSkill extends CatalogFields {
  code: string;
  canonicalName: string;
  skill: SkillSection;
}

export interface MicroSkill extends CreateCatalogSkill {
  id: string;
  revision: number;
}

const base = "/api/management/micro-skills";

export const microSkillService = {
  async list(signal: AbortSignal) {
    return (await httpService.get<ApiEnvelope<{items: MicroSkill[]}>>(base, {signal})).data.items;
  },
  async create(input: CreateCatalogSkill) {
    return (await httpService.post<ApiEnvelope<MicroSkill>>(base, input)).data;
  },
  async update(skill: MicroSkill, displayNameVi: string, status: SkillStatus) {
    const {id, revision, descriptionVi, displayOrder} = skill;
    return (await httpService.put<ApiEnvelope<MicroSkill>>(base + "/" + encodeURIComponent(id),
      {revision, displayNameVi, descriptionVi, status, displayOrder})).data;
  },
};
