# SpeakingView achievements and finalized summary

**Status:** Implemented locally; live provider/browser verification remains pending.  
**Business references:** BR-F1.11, BR-F1.14–16, BR-F1.18, BR-F1.22–25, BR-F1.37–38; SPK-UC-002 and SPK-UC-003.

## Scope and component map

The existing `SpeakingView` shell, transcript order, sticky microphone control and audio playback remain in place. The implementation adds only local presentation components under `src/features/topic/views/learning/speaking-achievements/`:

- `speakingAchievementAdapter.ts` maps the existing session response to a display-only snapshot.
- `speakingAchievementLogic.ts` selects one celebration/milestone per committed live transition and provides goal/turn totals.
- `AchievementFireworks` renders a one-shot decorative burst (expanding ring, core, 12 sparks) anchored on the existing authoritative “Đạt mục tiêu” feedback row; it does not duplicate that row with a second achievement card.
- `InlineMilestoneBanner` and `AllGoalsMilestone` render the larger business milestones in the relevant AI response.
- The all-goals milestone and a newly finalized all-goals summary use the larger fireworks burst (`--firework-radius: 2rem` versus `1.4rem` inline). The burst stays mounted for `CELEBRATION_VISIBLE_MS` = 2.8 s: sparks fly for 2.2 s (+150 ms stagger), the core fades over 1.6 s and the ring over 1.2 s, so the effect remains readable instead of flashing once. `SpeakingView` owns the timer; the CSS durations must stay inside it.
- Reduced motion keeps the celebration instead of deleting it: `prefers-reduced-motion: reduce` draws the same burst once, fully expanded and still, and hides only the expanding ring. A previous version used `display: none`, which silently removed every celebration on machines whose OS turns animations off (for example Windows “Animation effects” off, which Chromium reports as `prefers-reduced-motion: reduce`).
- `SessionResultSummary` renders only for server-final `COMPLETED` or `INCOMPLETE` sessions, above the replayable transcript.

The selector is deliberately not a completion-policy implementation. It only interprets server-confirmed `requiredGoalsMet`, `completionEligible`, status, and goal results.

## Existing transport-to-UI mapping

| UI input | Current authoritative field/event | UI use |
| --- | --- | --- |
| A committed, evaluated turn | WebSocket `TURN_RESULT.snapshot`, only when `snapshot.turns[turnId].evaluationState === "SUCCEEDED"` | Compare previous and new authoritative progress; generate one deduplicated live notice. |
| Progress and goal status | `content.goals`, `achievedGoalIds`, `goalResults`, `validTurnCount`, `content.minimumValidTurns`, `requiredGoalsMet`, `completionEligible` | Chips, counts, static milestones, and summary. |
| Evidence | `goalResults[].evidenceQuote`; matching `turns[].assessment.goalEvidence[]` resolves the turn number | Show only a supplied quote; no quote or link is fabricated. |
| Final summary | `SESSION_ENDED.snapshot` or successful `POST /sessions/{id}/end`; terminal `status`, `endReason`, `endedAt`, `revision` | Immutable summary and a single final animation where eligible. |
| Hydrate/reconnect/history | `GET /sessions/current`, `GET /sessions/{id}`, history selection, and post-event refresh | Settled chips and summary only—no animations. |

`useSpeakingStream` labels snapshots by source, so a provisional transcript, `PENDING`, `INVALID`, failed assessment, refresh, reconnect, and history view cannot trigger a celebration. A socket event carrying its own authoritative snapshot no longer causes a competing REST refresh. When a reconnect refresh reaches the same revision just before a live `TURN_RESULT`, the first goal evidence in that committed turn restores its one-time UI effect. Event keys use the backend session id, turn id (where present), goal ids, and terminal revision. A stale live event for a different active session is ignored.

## Finalization and UI actions

The backend has no public `FINALIZING` status or `closingAt` field. The UI therefore shows **Đang tổng kết phiên luyện nói…** only while the explicit end request is waiting, or when an active response has already stopped input because the published turn/time limit has been reached. It does not guess a terminal result. Recording start and resume are disabled in this state; existing in-flight audio/VAD handling is unchanged.

The server action remains authoritative: the UI never turns a completion-eligible milestone into `COMPLETED`. The result card offers the existing handlers to start another session, scroll to transcript, or return to item content.

## Known contract and verification gaps

- The response exposes no explicit `FINALIZING` state, close-start timestamp, or close reason before finalization. The in-progress copy is necessarily generic for automatic limits.
- Duration is derived from authoritative `startedAt` and `endedAt`; an explicit duration is not supplied.
- Celebration motion follows the OS preference. When `prefers-reduced-motion: reduce` is active the burst is static; to review the animated flight, enable motion in the OS/browser or force `--force-prefers-reduced-motion` off in DevTools rendering emulation. There is no in-app override.
- The Figma MCP Starter-plan limit blocked retrieval of nodes A02/A04/A06/A07/A08/A09 and their screenshots in this implementation session. The implementation follows the supplied handoff plus repository tokens, but a live Figma visual comparison is still required.
- The frontend has no React component-test framework. Pure selector tests cover the transition and dedup semantics; component/browser acceptance checks still require the documented live dev fixture and provider credentials.

## Verification

- `node --experimental-strip-types --test src/features/topic/views/learning/speaking-achievements/speakingAchievementLogic.test.ts` — 4 passing unit tests (grouping, priority/remaining turns, final/dedup/hydrate, incomplete finalization).
- `npm run build` — passed (existing bundle-size warning only).
- `npm run lint` — passed with 74 existing warnings outside this change.

Manual follow-up states: A01–A10 and A13–A24 from the implementation pack, especially a true auto-finalizing turn, manual completion with optional goals missing, a 30-turn limit, reconnection/history hydration, reduced motion, and narrow mobile viewport.

### Reduced-motion regression (fixed)

Reported symptom: the burst never played on either target (goal feedback row and all-goals milestone / final summary) even though goals and milestones were detected. Cause: `speakingAchievement.css` hid `.achievement-fireworks` with `display: none` under `prefers-reduced-motion: reduce`, and Chromium maps the Windows “Animation effects = off” setting to that media query. Verified on this workstation with `SPI_GETCLIENTAREAANIMATION = false` and `matchMedia("(prefers-reduced-motion: reduce)").matches === true`.

The burst is now verified in both modes with headless Chrome screenshots of the real stylesheet: the static still frame renders on all three targets, and frozen animated frames at 15 / 35 / 60 / 85 % progress confirm the ring, core and spark ring stay visible across the whole flight.

Follow-up (same bug report): the 1.5 s window was too short to check the result, so `CELEBRATION_VISIBLE_MS` is now 2.8 s and the keyframes hold the outer radius before fading (sparks are still visible at 85 % progress).

