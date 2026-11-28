import { useEffect } from "react";
import { useCompanion } from "../state/CompanionProvider";
import type { AvailableScreenContext } from "../types/companion.types";

/** Register a memoized reference for the currently rendered page. */
export function useScreenContext(context: AvailableScreenContext | null) {
  const { registerScreenContext } = useCompanion();
  useEffect(() => context ? registerScreenContext(context) : undefined, [context, registerScreenContext]);
}
