# Review, item retry and topic reset

UI polish wording: the whole-topic reset CTA is “Làm lại chủ đề”. Its confirmation still explicitly describes clearing all progress/results and any active retry; only wording/presentation changed. Review reuses the polished sidebar/content/quiz surfaces, keeps viewing independent of committed counts, and scrolls to top after a successful Next transition.

Current behavior, 2026-10-29. Supersedes replacement/restart and new TOPIC retry creation in the original slice C.

Review stays on the existing attempt route with `mode=review`. It shares content/quiz renderers and the lesson navigation, desktop content-left/navigation-right order and mobile single-column layout. Back/Next traverse every content unit and question; the final footer action opens the existing item result. No scroll gate or answer mutation applies. Question statuses say correct on first try or needed another try, never final incorrect; every reviewed question was eventually solved. Access recency remains a separate event.

Item actions expose either Resume retry or a new Retry, never both. Restart/replacement is absent. New item retry confirms that the learner must finish it before another item in that topic. Same-item starts resume the same attempt; another item conflicts. The prior official score/review remains readable until completion, when the new result replaces it even if lower. There is no user-facing attempt history.

Whole-topic action is Reset progress. Detail/topic result use `resetAvailability`, not deprecated retryAvailability. Confirmation explicitly clears every item progress/result and any active item retry; Cancel sends no request. Confirm posts `{generation}` with an exact Idempotency-Key to `/topics/{id}/reset`. The observed generation is captured when the dialog opens. A successful receipt increments it once, removes journal scopes through the submitted generation, refreshes current detail/progress and returns to detail. New-generation requests survive delayed reset replay. Future normal starts use LEARN/current published content.

Old owned attempts/results/review/session/mutation handles fail with TOPIC_RESET and lead back to refreshed topic actions; they cannot restore prior results. No new TOPIC retry session is launched. Existing legacy TOPIC sessions retain resume/next-item completion support and their pinned manifest.

OpenAPI/generated types/client and shape assertions match the approved additive navigation/generation/reset contract. Server ownership, scoring, eligibility and cross-topic independence remain authoritative. No libraries, profile changes, service restarts or global redesign are introduced.

Verification follows the fixed task budget. Browser/live evidence is pending matching running services and coordinated topic use; historical slice acceptance is not proof of the new reset semantics.
