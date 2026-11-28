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

export interface MicroSkillCatalogState {
  data: readonly MicroSkillDefinition[] | null;
  loading: boolean;
  error: { message: string } | null;
  refetch: () => void;
}
