import type { AssessmentState } from "@features/assessment/types/assessment.types";
export interface LiveSession {
  owner: string; binding: string; requestId: string; state: AssessmentState | null; sequence: number; live: boolean;
}
let session: LiveSession | null = null;
export function pendingSession(owner: string) {
  if (!session || session.owner !== owner || (!session.live && session.state !== null)) {
    session = {owner, binding: crypto.randomUUID(), requestId: crypto.randomUUID(), state: null, sequence: 0, live: false};
  }
  return session;
}
export function currentSession() { return session; }
export function clearSession() { if (session) session.live = false; session = null; }
