export interface MicroSkillDefinition {
  id: string;
  code: string;
  canonicalName: string;
  displayNameVi?: string | null;
  descriptionVi?: string | null;
  skill: "READING" | "LISTENING";
  active: boolean;
  displayOrder: number;
}

export interface MicroSkillCatalogMetadata {
  microSkillCatalog?: readonly MicroSkillDefinition[];
}
