# Speaking with AI — FE migration

**Branch:** `feat/speaking-ai-migration-f01-f02`  
**Status:** F01–F02 learner UI implemented for review; live browser/provider verification is pending.

## Current evidence

- `/dev/speaking` is a development route using `MediaRecorder` and multipart upload per turn. It is not the target PCM/WebSocket contract.
- `/dev/speaking-session` is a development-only entry point to the current PCM/WebSocket `SpeakingView`. It opens BE's fixed fixture item `690000000000000000000002` without depending on the Topic learning navigation. Opening the route checks for an existing session but does not create one.
- The existing demo view and its types are retained for comparison. Opening the route does not create a session; it asks for microphone access before create; closing the route does not send End.
- `src/features/topic/types/speaking.types.ts` mirrors the BE snapshot, turn, assessment and configuration response.
- `SpeakingView` is available from the item Context tab at `/topics/:topicId/speaking`; `/speaking/history` lists all of the learner's non-deleted sessions, including sessions from hidden items, and is linked from the learner sidebar. Speaking stays outside Context → Vocabulary → Expressions → Practice progress.
- `speaking.service.ts` uses the BE REST contract. In development only it attaches the backend fixture key `X-Dev-User-Id` from session storage or `VITE_DEV_USER_ID`; production builds do not attach it. The view never submits a learner ID.
- `useSpeakingStream` tracks connection separately from recording. It obtains a one-use socket ticket, sends 16 kHz mono PCM frames from `speaking-pcm-worklet.js`, shows interim text, and reloads the authoritative snapshot after connection or turn completion. It retries connection up to three times at roughly three-second intervals and drops uncommitted audio after disconnection. Microphone access is requested before session creation.
- `AI_AUDIO_READY` refreshes the snapshot (the `TURN_RESULT` snapshot predates TTS, so `aiAudioAvailable` is still false there) and notifies the view so a `SUCCEEDED` reply can play automatically while the session is active. Each AI bubble with `aiAudioAvailable` keeps a “Nghe phản hồi AI” button that reuses the same short-lived `AI_REPLY` playback URL as learner replay. The view ignores audio-ready callbacks for turns without an authoritative `SUCCEEDED` state.
- A turn shows “Đang xử lý…” only while its evaluation state is `PENDING`. When assessment fails, the view shows a retry message instead of leaving the AI reply in a processing state.
- `SpeakingTurn.evaluationState` accepts the v0.7 states plus `UNRESOLVED` and tolerates future string values. `UNRESOLVED` is rendered as a settled neutral notice that says the turn is still counted as finalized; the view suppresses any AI reply, audio control, or assessment evidence carried with that state and keeps it terminal if a later snapshot contains a conflicting state. Unknown values use a neutral refresh notice and never fall through to pending, invalid, or failed messaging.
- Session progress shows `committedTurnCount/30` as finalized slots alongside the separate valid-turn requirement count. On `TURN_EMPTY`, the stream clears recording state and hydrates the authoritative session snapshot when the event does not carry one, so the committed count and terminal slot-30 state come from the server.
- [Achievement celebrations and finalized result summary](achievement-session-result.md) document the committed-turn adapter, deduplicated milestone behavior, final summary, UI-only finalizing state, and current verification/contract gaps.
- The view supports create/replace/resume/end, item and account history, detail, 30-day recording availability, short-lived Cloudinary playback, deleting one session and deleting all. Closing the page stops local capture without sending End.

## Contract with BE

REST uses `/api/v1/speaking`, the `ApiResponse<T>` envelope, and `ProblemDetail` errors. The socket is `/ws/speaking/{sessionId}?ticket=...`. It sends `START_TURN`/`END_OF_TURN`/`CANCEL_TURN` with `turnId` and `controllerEpoch`, plus binary PCM; BE emits `CONNECTED`, `INTERIM_TRANSCRIPT`, `TURN_ACCEPTED`, `TURN_RESULT`, `AI_AUDIO_READY`, and stage errors with `turnId`, epoch, and revision. `AI_AUDIO_READY` carries no snapshot and arrives after the `TURN_RESULT` snapshot, so FE must re-read `GET /sessions/{id}` before trusting `aiAudioAvailable`. The FE takes the BE snapshot as authority after reconnect.

The old `/dev/speaking` route remains only as a comparison and still points at its legacy demo API. It is not the main Speaking entry point.

## Direct local test

1. Start MongoDB and the backend with the `dev` profile. The backend seeds the fixed Topic item and Speaking config at startup, including on an existing dev database.
2. Set the provider keys and Cloudinary credentials in the backend's local `.env`, then start the frontend with `npm run dev`.
3. Open `http://localhost:3000/dev/speaking-session`. The route selects the fixture item and shows the normal session UI. Use the “Bắt đầu phiên mới” button to request microphone permission and create a session.

The frontend uses `X-Dev-User-Id: dev-user` by default in development. The fixture is available only with the backend `dev` profile; the route is excluded from production builds.

## Remaining verification and limitations

- `npm run lint`: exit 0, no errors; 74 existing warnings elsewhere in the repo. The one hook warning introduced during development was fixed.
- `npm run build`: exit 0 after the Speaking integration; Vite reports the existing bundle-size warning.
- Browser checks on current Chrome, Edge, and Safari, weak networks, microphone loss, two-tab handoff, and Cloudinary playback still require a running backend, MongoDB, and provider credentials. The dev fixture supplies the Topic item and Speaking configuration.
- The acceptance target for interim text and response latency has not been measured. The AudioWorklet/VAD threshold is taken from the demo and needs device/browser tuning.
- The FE currently uses a development fixture header inside its Speaking service because the accepted shared `AuthProvider`/`useAuth` surface is not present on this FE branch. That surface should replace the fixture selection before release.

## Verification on this branch

- `npx eslint src/features/topic/hooks/useSpeakingStream.ts src/features/topic/views/learning/SpeakingView.tsx src/features/topic/services/speaking.service.ts`: exit 0, no warnings after the hook fix.
- `npm run lint`: exit 0; see warning count above.
- `npm run build`: exit 0; see bundle-size warning above.
