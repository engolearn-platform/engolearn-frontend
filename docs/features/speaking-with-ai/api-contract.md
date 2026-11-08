# Speaking FE–BE API contract

This page records the contract implemented by the official FE service and the current BE `SpeakingController` / `SpeakingRealtimeService`. It is a source-based handoff, not a claim of live provider verification. Backend technical entry is the [speaking technical README](../../../../speaking-ai-baseline-backend/docs/technical/speaking-ai/README.md), with configuration details in the [module contract](../../../../speaking-ai-baseline-backend/docs/technical/speaking-ai/module-contract.md). The current implementation is directly inspectable in the [controller](../../../../speaking-ai-baseline-backend/src/main/java/fit/iuh/engolearn/speaking/controller/SpeakingController.java), [realtime service](../../../../speaking-ai-baseline-backend/src/main/java/fit/iuh/engolearn/speaking/service/SpeakingRealtimeService.java), and [socket handler](../../../../speaking-ai-baseline-backend/src/main/java/fit/iuh/engolearn/speaking/controller/SpeakingSocketHandler.java).

## HTTP

Base path is `/api/v1/speaking`. Official requests use the shared HTTP client and cookie authentication; FE does not send a learner ID. The client attaches `X-Speaking-Contract: 0.8.3` to all these requests. JSON POSTs are serialized by the shared client. Success bodies use `{ "data": ..., "timestamp": ... }`; the service unwraps `data`. Errors are RFC 9457-style `ProblemDetail` JSON (`type`, `title`, `status`, `detail`, with `code` on speaking errors). FE normalizes these to `SpeakingApiError(code, message)`; missing code/status fall back to `HTTP_<status>` / `Speaking request failed`.

| Method and path | Request | Success data |
|---|---|---|
| `GET /items/{itemId}/config` | none | item ID/version, title, goals, minimum valid turns; BE also returns context, learner role, AI role and opening side |
| `GET /sessions/current` | none | session snapshot or `null` |
| `GET /sessions?itemId={id}` | optional item filter | session snapshot array |
| `GET /sessions/{id}` | none | authoritative session snapshot |
| `POST /sessions` | `{itemId, requestId}` | created snapshot |
| `POST /sessions/replace` | `{itemId, requestId}` | replacement snapshot |
| `POST /sessions/{id}/resume` | `{controllerEpoch, requestId}` | resumed snapshot; current BE uses request ID for resume and advances controller ownership |
| `POST /sessions/{id}/end` | `{controllerEpoch, requestId}` | ended snapshot |
| `POST /sessions/{id}/opening/retry` | `{controllerEpoch, requestId}` | snapshot after retry request |
| `GET /sessions/{id}/opening/audio` | none | `{url, expiresInSeconds}` |
| `POST /sessions/{id}/socket-ticket` | `{controllerEpoch, requestId}` | `{ticket, expiresInSeconds}` |
| `DELETE /sessions/{id}` | none | resulting session snapshot |
| `DELETE /sessions` | none | count deleted |
| `GET /sessions/{id}/turns/{turnId}/audio/{kind}` | kind is `LEARNER_RECORDING` or `AI_REPLY` | `{url, expiresInSeconds}` |

The FE generates UUID `requestId` values for create, replace, resume, end, opening retry and ticket requests. A socket ticket is one-use and lasts 30 seconds. Audio playback uses a signed URL with a 60-second lifetime. Authentication failures are HTTP 401; the shared client can refresh the session and retry once. Domain errors include `CONTROLLER_CHANGED`, `SESSION_EXISTS`, `DAILY_QUOTA`, `AUDIO_EXPIRED` and `CONFIG_MISSING`; a persistence conflict can return 409 `STATE_CHANGED`. See the [BE error reference](../../../../speaking-ai-baseline-backend/docs/technical/speaking-ai/api-contract.md#error-boundaries).

The snapshot shape is described in [speaking.types.ts](../../../src/features/topic/types/speaking.types.ts). It contains pinned content, opening, session status/end reason, counts, controller epoch/revision, goals, and turns with optional assessment/audio availability. The backend snapshot is authoritative: FE accepts snapshots with revision checks and uses `GET /sessions/{id}` for connection or turn events without a snapshot. FE does not calculate persisted assessments, turn counts, status or goal completion.

The reader also tolerates `UNRESOLVED`, unknown evaluation states and optional `payloadAvailability` with nullable transcript for the [v0.8.3 contract](../../../../../docs/system-design/speaking-demo-contract-v0.8.3-addendum.md). These are client compatibility paths; this BE worktree does not implement the corresponding durable-payload writer or emit `UNRESOLVED` on closing timeout. Hydration must not change terminal meaning once the FE has seen a terminal snapshot with an unresolved turn.

## WebSocket and audio

Connect to `/ws/speaking/{sessionId}?ticket={ticket}` (the FE also adds `contractVersion=0.8.3`). Ticket issuance is an authenticated HTTP request; the WebSocket connection itself presents the ticket. FE sends JSON `START_TURN`, `END_OF_TURN`, and `CANCEL_TURN`, each with `turnId` and `controllerEpoch`, plus binary PCM frames while recording. AudioWorklet emits mono, signed 16-bit little-endian PCM at 16 kHz; frames are sent as binary WebSocket messages. Empty, invalid or oversized frames can be rejected; the BE enforces a two-minute/byte ceiling.

The [BE event table](../../../../speaking-ai-baseline-backend/docs/technical/speaking-ai/api-contract.md#socket-handshake-and-messages) lists all server events. FE sets interim text from `INTERIM_TRANSCRIPT`, clears recording state on results/turn errors, and drops control on `CONTROLLER_CHANGED`. `AI_AUDIO_READY` has no snapshot: FE requests a new snapshot for availability and can independently attempt playback if the active view already has a successful turn. `OPENING_UPDATED` is accepted only for matching session, epoch and revision.

The BE can attach optional `demoDecision` on manager result/error events. The stream hook parses it as `SpeakingDialogueDecision` for its opt-in diagnostics callback; the main `SpeakingView` does not enable that callback. It is not used to compute learner progress.
