import { httpService, type ApiEnvelope } from "@shared/services/http.service";

export type SkillSection = "READING" | "LISTENING";

export interface MicroSkill {
  code: string;
  label: string;
  section: SkillSection;
  active: boolean;
  legacyName: string | null;
}

const base = "/api/v1/assessment/admin/micro-skills";
const skillPath = (code: string) => base + "/" + encodeURIComponent(code);

export const microSkillService = {
  async list(signal: AbortSignal) {
    return (await httpService.get<ApiEnvelope<MicroSkill[]>>(base, {signal})).data;
  },
  async create(code: string, label: string, section: SkillSection) {
    return (await httpService.post<ApiEnvelope<MicroSkill>>(base, {code, label, section})).data;
  },
  async rename(code: string, label: string) {
    return (await httpService.patch<ApiEnvelope<MicroSkill>>(skillPath(code), {label})).data;
  },
  async retire(code: string) {
    return (await httpService.post<ApiEnvelope<MicroSkill>>(skillPath(code) + "/retire", {})).data;
  },
};
