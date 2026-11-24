# Speaking runtime flows

Topic owns the learner-facing UI and all Speaking routes. It calls the provider through `@features/speaking/contract`. The provider uses the shared HTTP client for REST operations and opens a WebSocket for live voice turns. The backend snapshot remains authoritative for persisted session and turn state.

## 1. Topic launches Speaking

1. `TopicItemResultView` reads `speakingEnabled` from the Speaking contract and, when enabled, opens the Topic-owned item Speaking route.
2. `topic/routes.ts` maps the item routes and `/speaking/history` to Topic's `SpeakingView`. In a development build, `/dev/speaking` maps to `SpeakingDemoView` and `/dev/speaking-session` maps to the same `SpeakingView` used by the item flow. The app router only aggregates these Topic routes.
3. `SpeakingView` uses the regular session service and realtime hook. `SpeakingDemoView` uses the legacy multipart service. Both import through the Speaking contract.

## 2. Session creation and resume

1. Topic's `SpeakingView` loads the current account session, item configuration, and item-filtered history through the contract's service façade.
2. Topic checks microphone permission before calling create or replace. Resuming calls the separate resume operation for the selected session. Topic records the returned session ID and controller epoch to track control in the tab.
3. The provider sends cookie-authenticated requests to `/api/v1/speaking`; the backend checks identity and permissions, item availability, ownership, and controller state, then returns a session snapshot.
4. Topic renders that snapshot and keeps the session selected. The backend retains authority over session state and eligibility.

## 3. Opening turn

1. The session snapshot reports the opening status. An AI-initiated opening can progress from `GENERATING` through `SYNTHESIZING` to `READY` or `TEXT_ONLY`. A failed opening reports `FAILED`. A learner-initiated opening reports `NOT_REQUIRED`.
2. Topic presents the opening and available hint. Audio playback obtains a short-lived URL through the provider service. Topic may retry a failed opening while the learner controls an interactive session.
3. `OPENING_UPDATED` carries a session snapshot and revision. The Speaking stream accepts only an update matching the active session and controller epoch whose event revision equals its snapshot revision. Topic's `acceptSnapshot` then rejects stale snapshots against the currently displayed session revision.
4. The opening and its hint are outside the learner turn count and assessment. Reopening or hydrating a page does not autoplay the opening.

## 4. Realtime voice turn

1. Topic passes the session and its snapshot callback to `useSpeakingStream` when the tab controls the session for the current item.
2. The Speaking provider requests a socket ticket from REST and connects to `/ws/speaking/{sessionId}`. When the learner starts a turn, it obtains the microphone and loads the AudioWorklet before sending `START_TURN` with a turn ID and controller epoch.
3. The AudioWorklet converts microphone audio to mono 16 kHz signed 16-bit little-endian PCM, which the provider sends as binary frames. The worklet remains served at `/speaking-pcm-worklet.js`.
4. Interim transcript events update Topic's transcript UI. Finishing recording sends `END_OF_TURN` for backend processing. If the microphone track ends unexpectedly, the provider sends `CANCEL_TURN` when the socket remains open.
5. The provider reports event snapshots through its callback. It fetches the authoritative session through REST after a connection or turn lifecycle event that omits a snapshot and when audio becomes available. Topic checks the session and revision before applying the snapshot.

## 5. Feedback and achievements

1. A committed turn snapshot returns to Topic through the stream's snapshot callback. Topic renders transcript, evaluation, AI reply and available audio playback from persisted fields.
2. The Topic achievement adapter maps the session snapshot into presentation data. The Topic selector uses committed server fields and ignores provisional, invalid, failed, history and hydration transitions for live celebrations.
3. Topic displays a final summary only after the backend reports `COMPLETED` or `INCOMPLETE`. Reaching goal or turn eligibility alone does not finalize a session.

## 6. Completion, history and recovery

1. Topic's explicit end action calls the provider service. Until the authoritative terminal snapshot returns, Topic can show its pending-result state. Automatic completion is recognized only from the resulting backend snapshot.
2. Topic loads account or item history through the same service façade. Selecting a history snapshot shows settled content without replaying live achievements. Audio playback uses a provider request for a temporary URL.
3. If the socket drops, the provider stops local capture and retries connection up to three times at about three-second intervals. Reconnection hydrates the session snapshot. The learner can return to Topic's Speaking view and resume if the session remains available.
4. A server controller-change event ends the old tab's control. Unmounting releases local microphone and playback resources. Session completion requires an explicit end action or backend settlement.
5. The dev-only legacy route retains its Topic-owned `MediaRecorder` flow and calls the provider's demo service. It is separate from the PCM WebSocket flow.

See the [user flows](user-flows.md) for observed gaps and unverified conditions. Backend implementation references are indexed by the [backend Speaking overview](../../../../engolearn-backend/docs/features/speaking-with-ai/README.md).
