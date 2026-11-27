import type { TopicContextResource } from "@features/topic/types/topic-management.types";

export function hasContextContent(value: TopicContextResource | null): boolean {
  return Boolean(value && (
    value.scenarioDescription?.trim()
    || value.prompt?.trim()
    || value.tips?.trim()
    || value.durationSec !== null
    || value.dialogue.some((turn) => turn.speaker?.trim() || turn.textEn?.trim() || turn.textVi?.trim() || turn.audioUrl?.trim())
  ));
}
