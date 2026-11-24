# Speaking V2 FE–BE API contract

The accepted [shared contract](../../../../docs/system-design/speaking-v2-contract.md) is the wire-level authority. This page summarizes how the frontend uses it. Successful REST responses are unwrapped from `{data: ...}` by the shared HTTP client. Requests use the existing same-origin cookie authentication; the browser never places a bearer token in a WebSocket URL.

## REST client

The Speaking facade is `speakingV2Service` from `@features/speaking/contract`.

| Operation | Path | Frontend behavior |
| --- | --- | --- |
| Availability | `GET /api/v1/speaking/availability` | Sends complete scope query parameters before entry. |
| Create / replace | `POST /sessions`, `POST /sessions/replace` | Generates stable client request UUIDs; replacement requires explicit learner action. |
| Read / resume / end | `GET /sessions/{id}`, `POST /sessions/{id}/resume`, `POST /sessions/{id}/end` | Uses server session IDs and controller epochs. |
| Socket ticket | `POST /sessions/{id}/socket-ticket` | Fetches a one-time ticket, then connects to the session's `wsPath`. |
| Turns / assessment | `GET /sessions/{id}/turns`, `GET /sessions/{id}/assessment` | Paged turns and assessment polling are independent of microphone state. |
| History / delete | `GET /sessions`, `DELETE /sessions/{id}`, `DELETE /sessions` | Optional exact scope filter; deletes require explicit confirmation in the UI. |
| Audio | `GET .../audio/{LEARNER_RECORDING\|AI_REPLY}`, `GET .../opening/audio` | Streams opening and current reply playback over the active socket; history replay uses short-lived authorized URLs when selected. |

Problem details are normalized to `SpeakingV2ApiError`, retaining stable error code, boolean retryability and a non-empty active session ID when supplied. The entry can reload that active session after an `ACTIVE_SESSION_EXISTS` conflict. User-facing messages explain the recovery action; provider/audio failures leave text history usable.

## WebSocket and audio

The V2 hook connects to `wsPath` with a one-time ticket from `INITIALIZING` through `CLOSING`. Commands use the frozen envelope `{type,requestId,sessionId,turnId?,sequence?,payload}`. `START_TURN` is sent before microphone capture; `TURN_ACCEPTED` must arrive before `getUserMedia` and AudioWorklet setup. Disconnect stops local capture, then reconnect obtains a new ticket at the current controller epoch, requests `SYNC_SESSION`, and reloads durable turns. It offers `CANCEL_TURN` only for a server turn still marked `RECEIVING`; sealed server work stays pending. `RETRY_TURN` reuses the failed server turn ID, requires its persisted transcript and a retryable failure, and is sent once until correlated acknowledgement.

The existing `public/speaking-pcm-worklet.js` resamples mono audio to 16 kHz PCM16. `speaking-audio-frame.ts` adds and validates the 28-byte `SPK2` binary header, turn UUID, direction, chunk index, reserved bytes, payload size and even upload length. Assistant WAV chunks are played only after a complete `TTS_COMPLETED` message with matching byte length; failed or incomplete audio falls back to text.

## Topic authoring

Topic owns the optional profile at `/api/management/topics/{topicId}/speaking-profile` or `/items/{itemId}/speaking-profile`. GET and PUT return revision, draft, publication, content version and the currently allowed `resources` collection. PUT sends `{revision,profile}`; profile publish sends `{revision}` to the `/publish` suffix. The editor uses resource IDs from this response and reloads after a `409` conflict. Enabled-only required-field validation is applied client-side and must also be enforced by the backend.
