import { createContext, useContext } from "react";
import type { ManagementState, PlacementManagementService } from "@features/placement/types/placement-management.types";
export interface ManagementContextValue {
  state: ManagementState; service: PlacementManagementService; busy: boolean;
  run: <T>(operation: () => Promise<T>, successMessage?: string) => Promise<T | null>;
  reload: () => void;
}
export const PlacementManagementContext = createContext<ManagementContextValue | null>(null);
export function usePlacementManagement() {
  const value = useContext(PlacementManagementContext);
  if (!value) throw new Error("Placement management provider is required");
  return value;
}
