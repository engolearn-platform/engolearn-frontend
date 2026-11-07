# Speaking with AI — FE migration

**Branch:** `feat/speaking-ai-baseline`
**Status:** Speaking demo merged with current `main` auth; live browser/provider verification is pending.

## Current evidence

- `/dev/speaking` is a development route using `MediaRecorder` and multipart upload per turn. It is not the target PCM/WebSocket contract.
- `/dev/speaking-session` renders the current PCM/WebSocket `SpeakingView` directly and defaults to café item `691b00000000000000000003`. Use `?itemId=691b00000000000000000004` to try a learner-led opening. Level and predecessor checks still apply. The route looks up existing sessions and offers an explicit start action.
- This DEV-only route requires cookie login and enables the existing diagnostics surface. It shows the authoritative session state, latest committed transcript/turn, connection/recording state, recent WebSocket lifecycle events (including `AI_AUDIO_READY` and `TTS_ERROR` when emitted), and optional ConversationManager `demoDecision` metadata for each committed turn.

Local backend setup uses the café opening configuration seed for the existing café Topic items in `engolearn_db`. Vite proxies `/api` and `/ws` to `http://localhost:8080` by default. Provider keys must be configured in the backend `.env` for live voice interaction.
- The existing demo view and its types are retained for comparison. Opening the route does not create a session; it asks for microphone access before create; closing the route does not send End.
- `src/features/topic/types/speaking.types.ts` mirrors the BE snapshot, turn, assessment and configuration response.
- `SpeakingView` is available from the item Context tab at `/topics/:topicId/speaking`; `/speaking/history` lists all of the learner's non-deleted sessions, including sessions from hidden items, and is linked from the learner sidebar. Speaking stays outside Context → Vocabulary → Expressions → Practice progress.
- `speaking.service.ts` uses the shared HTTP client and cookie session flow from `main`, including one refresh retry on 401. The view never submits a learner ID.
- `useSpeakingStream` tracks connection separately from recording. It obtains a one-use socket ticket, sends 16 kHz mono PCM frames from `speaking-pcm-worklet.js`, shows interim text, and reloads the authoritative snapshot after connection or turn completion. It retries connection up to three times at roughly three-second intervals and drops uncommitted audio after disconnection. Microphone access is requested before session creation.
- `AI_AUDIO_READY` refreshes the snapshot (the `TURN_RESULT` snapshot predates TTS, so `aiAudioAvailable` is still false there) and notifies the view so a `SUCCEEDED` reply can play automatically while the session is active. Each AI bubble with `aiAudioAvailable` keeps a “Nghe phản hồi AI” button that reuses the same short-lived `AI_REPLY` playback URL as learner replay. The view ignores audio-ready callbacks for turns without an authoritative `SUCCEEDED` state.
- `demoDecision` is optional and event-local. The FE validates its shape before storing it by session/turn, clears diagnostic state when the session changes, and keeps normal snapshot/audio/achievement rendering unchanged when the field is absent or malformed.
- A turn shows “Đang xử lý…” only while its evaluation state is `PENDING`. When assessment fails, the view shows a retry message instead of leaving the AI reply in a processing state.
- `SpeakingTurn.evaluationState` accepts the v0.7 states plus `UNRESOLVED` and tolerates future string values. `UNRESOLVED` is rendered as a settled neutral notice that says the turn is still counted as finalized; the view suppresses any AI reply, audio control, or assessment evidence carried with that state. Once a terminal snapshot contains an unresolved turn, later snapshots must match its terminal semantics (status, end reason, counts, goal results, and turn assessments/evidence) or the whole incoming snapshot is rejected. Revision and playback-availability fields may still change on hydration. Unknown values use a neutral refresh notice and never fall through to pending, invalid, or failed messaging.
- A finalized turn can have `transcript: null` while its external payload is not durable. `PENDING` displays “Nội dung lời nói tạm không khả dụng”; `UNAVAILABLE` displays “Đã ghi nhận lượt nói nhưng không thể khôi phục nội dung”. A null transcript with missing or unknown availability uses the general “Nội dung lời nói không khả dụng” message. An empty string uses the state-specific copy for `PENDING` or `UNAVAILABLE`; otherwise it retains “Không có lời nói được ghi nhận”. This does not change evaluation-state handling.
- Session progress shows `committedTurnCount/30` as finalized slots alongside the separate valid-turn requirement count. On `TURN_EMPTY`, the stream clears recording state and hydrates the authoritative session snapshot when the event does not carry one, so the committed count and terminal slot-30 state come from the server.
- [Achievement celebrations and finalized result summary](achievement-session-result.md) document the committed-turn adapter, deduplicated milestone behavior, final summary, UI-only finalizing state, and current verification/contract gaps.
- The view supports create/replace/resume/end, item and account history, detail, 30-day recording availability, short-lived Cloudinary playback, deleting one session and deleting all. Closing the page stops local capture without sending End.

## Contract with BE

### Opening snapshot (accepted r2)

Each session snapshot carries the immutable `content.context`, `learnerRole`,
`aiRole`, and `openingSide`, plus `opening: { status, reply,
hintExampleEn, aiAudioAvailable }`. The shared view used by the item route and
`/dev/speaking-session` shows the situation and goal descriptions before the
dialogue. `NOT_REQUIRED` tells the learner role to start; `GENERATING` and
`SYNTHESIZING` show progress; `FAILED` offers retry to the connected
controller; `READY` and `TEXT_ONLY` show the AI opener and English hint.
Ready audio can be replayed through the opening audio endpoint.

The AI opener appears once as the first AI chat bubble below the situation
instructions, using the same message layout as AI replies. It retains the
opening hint, text-only notice and replay control. This is a visual conversation
entry only: it is not added to `turns`, turn counts or assessment. Learner-led
openings and generation/retry notices remain in the instructions section.

The WebSocket `OPENING_UPDATED` event carries the authoritative session
snapshot. It follows the existing revision acceptance path. Only a direct
transition to `READY` can trigger one automatic audio attempt; hydration and
reconnect snapshots never autoplay. The microphone stays disabled while any
session audio is loading or playing, and `canStartTurn` remains the server
authority for starting a turn.
The tab that starts or resumes a session records the controller epoch in
session storage. Other tabs can view the session and take control explicitly
with “Tiếp tục phiên”.

New assessment snapshots may include additive nullable `hintExampleEn` and
`hintLeadVi`. The FE renders the English example with the optional Vietnamese
lead; historical sessions continue rendering legacy `hint` without relabeling
it. Closing/terminal turns render no hint. The persisted partner reply remains
the single source for both the visible AI message and permitted TTS.

REST uses `/api/v1/speaking`, the `ApiResponse<T>` envelope, and `ProblemDetail` errors. The socket is `/ws/speaking/{sessionId}?ticket=...`. It sends `START_TURN`/`END_OF_TURN`/`CANCEL_TURN` with `turnId` and `controllerEpoch`, plus binary PCM; BE emits `CONNECTED`, `INTERIM_TRANSCRIPT`, `TURN_ACCEPTED`, `TURN_RESULT`, `AI_AUDIO_READY`, and stage errors with `turnId`, epoch, and revision. `AI_AUDIO_READY` carries no snapshot and arrives after the `TURN_RESULT` snapshot, so FE must re-read `GET /sessions/{id}` before trusting `aiAudioAvailable`. The FE takes the BE snapshot as authority after reconnect.

The old `/dev/speaking` route remains only as a comparison and still points at its legacy demo API. It is not the main Speaking entry point.

## Direct local test

1. Start MongoDB and the backend with the `dev` profile. The backend seeds the fixed Topic item and Speaking config at startup, including on an existing dev database.
2. Set the provider keys and Cloudinary credentials in the backend's local `.env`, then start the frontend with `npm run dev`.
3. Sign in through the shared auth flow, then open `http://localhost:3000/dev/speaking-session`. The route selects the fixture item and shows the normal session UI plus the dev diagnostics panel. Use the “Bắt đầu phiên mới” button to request microphone permission and create a session.
4. With the backend manager demo flag enabled, complete a turn and confirm the panel shows the event lifecycle and `demoDecision`; with legacy/fallback events or a missing field, confirm the panel reports that no decision is available without hiding the session or turn.

The fixture is available only with the backend `dev` profile; the route is excluded from production builds.

## Remaining verification and limitations

- `npm run lint`: exit 0, no errors; 72 warnings on the merged baseline.
- `npm run build`: exit 0 after the Speaking integration; Vite reports the existing bundle-size warning.
- Browser checks on current Chrome, Edge, and Safari, weak networks, microphone loss, two-tab handoff, and Cloudinary playback still require a running backend, MongoDB, and provider credentials. The dev fixture supplies the Topic item and Speaking configuration.
- The diagnostics panel has not been live-browser verified in this worktree; provider, MongoDB, backend manager flag, microphone, and TTS credentials were not available during static verification.
- The acceptance target for interim text and response latency has not been measured. The AudioWorklet/VAD threshold is taken from the demo and needs device/browser tuning.
- Speaking routes require the shared `AuthProvider`/`useAuth` session. The legacy `/dev/speaking` comparison route still targets its old demo API and needs separate migration before use.

## Verification on this branch

- 2026-11-07 opening chat placement: build passed (existing bundle-size
  warning); lint passed with 72 warnings. `test:topic` has two pre-existing
  failures: operation count `20 !== 17` and schema example `Missing entries`.
  The opening now reuses `AiMessage` outside the instructions card. Live
  authenticated browser and audio checks were not run for this layout change.

- 2026-11-07 opening integration. Build and lint passed with the existing
  72 lint warnings and bundle-size warning. Backend and frontend were
  started locally, and the real proxy preserved unauthenticated HTTP 401.
  Browser automation was blocked for Cốc Cốc by the computer-use URL policy.
  Authenticated UI, autoplay and microphone checks remain manual. The user
  will perform live Gemini/Cartesia testing.

- `npx eslint src/features/topic/hooks/useSpeakingStream.ts src/features/topic/views/learning/SpeakingView.tsx src/features/topic/services/speaking.service.ts`: exit 0, no warnings after the hook fix.
- `npm run lint`: exit 0; see warning count above.
- `npm run build`: exit 0; see bundle-size warning above.
