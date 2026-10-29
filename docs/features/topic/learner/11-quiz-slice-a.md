# Quiz lifecycle and reached-question navigation

Current consumer behavior, 2026-10-29. Supersedes the earlier current-question-only slice-A checkpoint.

`GET /topic-attempts/{id}/quiz` remains the current answer source. `GET /topic-attempts/{id}/quiz-navigation` supplies individual LOCKED/CURRENT/COMPLETED rows in pinned sequence order. LOCKED rows must have null quiz, feedback and firstTryCorrect; the FE rejects leaked/malformed snapshots. Completed rows are read-only; current questions alone can submit. The existing attempt route/query is unchanged.

Choosing an option sends `{revision,optionId}` once through the persisted mutation journal. Normal saving uses the reserved feedback/status region, without an uncertain-request panel. Wrong authoritative responses keep the same quiz snapshot mounted and update the submission revision; they expose no correct answer. Same-question refresh keeps the snapshot, and older reads cannot overwrite a newer revision. Correct responses hold the displayed quiz and feedback until Continue. Continue refreshes only the quiz frontier, avoiding a whole lesson refetch.

The exact pending quiz/body and original request key survive reload. A genuinely uncertain/restored request exposes explicit exact-key recovery; no automatic mutation retry or fresh-key replacement. State remains scoped to learner/attempt/pinned identity. Generation metadata accompanies journal descriptors/keys so confirmed topic reset clears only old topic work and retains newer-generation requests. Legacy descriptors mean generation zero; known old attempt IDs and topic scopes are removed on reset, and stale direct links clear their own descriptors on TOPIC_RESET.

Feedback has reserved space; options use existing Button with keyboard focus and aria-pressed, feedback uses live status, optional media never autoplays or blocks progression. Footer Continue always exists and explains saving, uncertainty, loading/recovery or the correct-answer requirement. No scroll gate applies to questions or review.

Legacy `IN_PROGRESS + quiz:null` still requires explicit completion recovery; null never fabricates completion. Hidden content stops playback and returns to detail. Foreign/missing resources retain normal access-denied behavior. Server-owned first-try counts and completion semantics are unchanged.

Current static/live evidence and remaining cases are recorded in the task FE report and [verification](../../../handout/topic-learning/verification.md); historical slice results do not prove this revision.
