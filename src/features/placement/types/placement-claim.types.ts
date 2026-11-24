import type { PlacementSubmitStatus } from "./placement-attempt.types";

/**
 * FE-normalized claim-gate state — NOT a backend enum.
 *
 * The real API may answer with a different shape; the service layer is
 * responsible for mapping that response into one of these values. The view
 * never derives a state by itself (BR-F2.4/F2.5/F2.7).
 *
 * - `ALREADY_CLAIMED`: the attempt was already claimed by the authenticated
 *   owner (idempotent repeat, BR-F2.6).
 * - `OWNED_BY_OTHER`: the attempt belongs to a different account (BR-F2.5).
 */
export type PlacementClaimStatus =
  | "CLAIMABLE"
  | "CLAIM_EXPIRED"
  | "SESSION_MISMATCH"
  | "OWNED_BY_OTHER"
  | "ALREADY_CLAIMED"
  | "USER_HAS_RESULT"
  | "NO_RESULT";

export interface PlacementClaimGate {
  attemptId: string;
  attemptStatus: PlacementSubmitStatus;
  claimStatus: PlacementClaimStatus;
  /**
   * Backend-owned `endedAt + 2h` (BR-F2.4). `null` when the attempt produced
   * no result (`EXPIRED`). Kept for the future countdown; P03 renders the
   * static 2-hour copy from Stitch.
   */
  claimExpiresAt: string | null;
  /** Server clock at response time, reserved for a later countdown. */
  serverNow: string;
  /** Backend-provided attempt to navigate to after claim/auth; may differ from attemptId. */
  resultAttemptId: string | null;
}
