import { createContext } from "react";
import type { RefObject } from "react";

export interface CompanionScrollAnchor {
  conversationId: string;
  messageId: string | null;
  offset: number;
  nearBottom: boolean;
}

export const CompanionScrollContext = createContext<RefObject<CompanionScrollAnchor | null> | null>(null);