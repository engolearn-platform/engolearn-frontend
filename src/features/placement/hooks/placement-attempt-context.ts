import { createContext, useContext } from "react";
import type {
  PlacementAttemptDetail,
  PlacementSubmitResult,
} from "@features/placement/types/placement-attempt.types";

export interface PlacementAttemptContextValue {
  attempt: PlacementAttemptDetail;
  answers: Record<string, string | null>;
  answeredCount: number;
  setAnswer: (questionId: string, optionId: string) => void;
  saveError: string | null;
  remainingMs: number;
  isExpired: boolean;
  submitting: boolean;
  submitError: string | null;
  submitResult: PlacementSubmitResult | null;
  submit: () => void;
}

export const PlacementAttemptContext =
  createContext<PlacementAttemptContextValue | null>(null);

export function usePlacementAttemptContext(): PlacementAttemptContextValue {
  const value = useContext(PlacementAttemptContext);
  if (!value) {
    throw new Error(
      "usePlacementAttemptContext must be used inside PlacementAttemptLayout",
    );
  }
  return value;
}
