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
| Recent / exact history / delete | `GET /sessions`, `DELETE /sessions/{id}`, `DELETE /sessions` | Recent is account-wide across statuses/scopes; exact filters must be complete. Deletes require explicit confirmation. |
| Topic history groups | `GET /history/topics?group=IN_PROGRESS\|COMPLETED\|OTHER&page=0&size=9` | Returns authorized current Topic metadata, learning status, distinct Topic counts, latest session time, and full group totals. `OTHER` covers NOT_STARTED and UNKNOWN. Group page state is independent. |
| Parent Topic sessions | `GET /history/topics/{topicId}/sessions?page=0&size=20` | Summary-only union of the learner's Topic and Item sessions, including hidden historical Items, with an authorized current or saved fallback Topic title. |
| Audio | `GET .../audio/{LEARNER_RECORDING\|AI_REPLY}`, `GET .../opening/audio` | Streams opening and current reply playback over the active socket; history replay uses short-lived authorized URLs when selected. |

Problem details are normalized to `SpeakingV2ApiError`, retaining stable error code, boolean retryability and a non-empty active session ID when supplied. The entry can reload that active session after an `ACTIVE_SESSION_EXISTS` conflict. User-facing messages explain the recovery action; provider/audio failures leave text history usable.

History GETs accept an `AbortSignal`; the page hook aborts superseded requests and ignores responses from a prior query or auth identity generation. Group, parent, and exact URL intents are validated independently. Malformed or mixed filters never widen to account-wide recent history. Result links carry a sanitized same-origin history URL so direct loads and reloads can return to the originating tab, group, parent page, or exact scope. Exact history returns to the validated same-scope Speaking entry or its canonical Topic/Item entry path.

The account page loads unscoped recent sessions independently from Topic group sections. The default `Đang học` tab shows recent rows first, in-progress Topics, then `Lịch sử khác` only when nonempty. `Hoàn thành` requests and renders completed Topic cards only. Tab badges use full distinct Topic totals, and account-wide deletion remains available from either tab when sessions exist. Session rows separate scope, pinned titles, creation time, exchange count, speech duration, lifecycle, and assessment. Confirmed deletions reload the visible history and totals, correcting empty pages.

New-start access codes `LEVEL_TOO_HIGH`, `ITEM_LOCKED`, `PROFILE_DISABLED`, `SCOPE_FORBIDDEN`, and `DAILY_QUOTA_REACHED` use localized guidance. An owned active session retains explicit resume even when new admission is denied.

## WebSocket and audio

The V2 hook connects to `wsPath` with a one-time ticket from `INITIALIZING` through `CLOSING`. Commands use the frozen envelope `{type,requestId,sessionId,turnId?,sequence?,payload}`. `START_TURN` is sent before microphone capture; `TURN_ACCEPTED` must arrive before `getUserMedia` and AudioWorklet setup. Disconnect stops local capture, then reconnect obtains a new ticket at the current controller epoch, requests `SYNC_SESSION`, and reloads durable turns. It offers `CANCEL_TURN` only for a server turn still marked `RECEIVING`; sealed server work stays pending. `RETRY_TURN` reuses the failed server turn ID, requires its persisted transcript and a retryable failure, and is sent once until correlated acknowledgement.

The existing `public/speaking-pcm-worklet.js` resamples mono audio to 16 kHz PCM16. `speaking-audio-frame.ts` adds and validates the 28-byte `SPK2` binary header, turn UUID, direction, chunk index, reserved bytes, payload size and even upload length. Assistant WAV chunks are played only after a complete `TTS_COMPLETED` message with matching byte length; failed or incomplete audio falls back to text.

The access/history extension wire fixtures are in [`speaking-access-history.fixture.json`](../../../../docs/system-design/speaking-access-history.fixture.json). The approved constraints and traceability are in the [H0 implementation contract](../../../../docs/implementation/speaking-v2-evidence/access-history-h0-contract.md).

## Topic authoring

Topic owns the optional profile at `/api/management/topics/{topicId}/speaking-profile` or `/items/{itemId}/speaking-profile`. GET and PUT return revision, draft, publication, content version and the currently allowed `resources` collection. PUT sends `{revision,profile}`; profile publish sends `{revision}` to the `/publish` suffix. The editor uses resource IDs from this response and reloads after a `409` conflict. Enabled-only required-field validation is applied client-side and must also be enforced by the backend.
