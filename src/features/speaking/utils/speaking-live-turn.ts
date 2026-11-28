import type { SpeakingTurn } from "@features/speaking/types/speaking-v2.types";

const inProgressStatuses = new Set(["RECEIVING", "TRANSCRIBING", "GENERATING"]);

export function isInProgressSpeakingTurn(turn: Pick<SpeakingTurn, "status">) {
  return inProgressStatuses.has(turn.status.toUpperCase());
}

/**
 * The turns endpoint merges the session's active turn into the page, so an in-progress
 * turn without a transcript would duplicate the live interim bubble. Hide it until it
 * carries a transcript, and fall back to the interim bubble only when no in-progress
 * turn is already rendering the spoken text.
 */
export function speakingLiveTurn(turns: SpeakingTurn[], interim: string, recording: string) {
  const visibleTurns = turns.filter(turn => !isInProgressSpeakingTurn(turn) || Boolean(turn.transcript?.trim()));
  const renderingLiveTurn = visibleTurns.some(isInProgressSpeakingTurn);
  const transcript = interim.trim();
  const waiting = recording === "requesting" || recording === "recording";
  const liveText = renderingLiveTurn ? null
    : transcript ? `Đang nhận diện: ${transcript}`
      : waiting ? "Đang ghi âm…" : null;
  return { turns: visibleTurns, liveText };
}
