# Speaking V2 module map

Speaking provides a public capability contract for Topic. Session UI and standalone routes stay in Speaking; Topic imports only the contract for entry components and DTOs. Topic's profile authoring remains inside Topic.

| Task | Start here | Ownership |
| --- | --- | --- |
| Topic/Item learner entry | [SpeakingEntry.tsx](../../../src/features/speaking/views/SpeakingEntry.tsx) | Speaking public entry components; Topic mounts them from its existing workspaces. |
| REST request paths and errors | [speaking-v2.service.ts](../../../src/features/speaking/services/speaking-v2.service.ts) | Speaking; exact wire shapes follow the accepted shared contract. |
| Realtime, mic, VAD, reconnect and PCM | [useSpeakingV2Stream.ts](../../../src/features/speaking/hooks/useSpeakingV2Stream.ts) | Speaking; capture starts only after `TURN_ACCEPTED`. |
| Binary framing | [speaking-audio-frame.ts](../../../src/features/speaking/utils/speaking-audio-frame.ts) | Speaking; 28-byte SPK2 header and little-endian PCM16 payload validation. |
| Live turn presentation | [speaking-live-turn.ts](../../../src/features/speaking/utils/speaking-live-turn.ts) | Speaking; hides the persisted in-progress turn while it has no transcript so the interim bubble is the only live turn. |
| Workspace, result and history | [SpeakingSessionView.tsx](../../../src/features/speaking/views/SpeakingSessionView.tsx), [SpeakingResultView.tsx](../../../src/features/speaking/views/SpeakingResultView.tsx), [SpeakingHistoryView.tsx](../../../src/features/speaking/views/SpeakingHistoryView.tsx) | Speaking views and standalone protected routes. |
| Protocol DTOs | [speaking-v2.types.ts](../../../src/features/speaking/types/speaking-v2.types.ts) | Speaking; only types used by Topic are exported through the contract. |
| Topic profile editor | [TopicSpeakingProfileView.tsx](../../../src/features/topic/views/management/TopicSpeakingProfileView.tsx) | Topic management; GET/PUT/publish profile-only API and server-provided resource IDs. |
| Route and role boundaries | [speaking/routes.ts](../../../src/features/speaking/routes.ts), [topic/routes.ts](../../../src/features/topic/routes.ts) | Speaking protects learner pages; Topic protects profile management with Content Manager access. |

## Public boundary

Consumers import `TopicSpeakingEntry`, `ItemSpeakingEntry`, the V2 service facade, and required V2 types from `@features/speaking/contract`. They do not import Speaking's hook, service implementation, or model files directly. Topic owns profile read/write screens and calls its own management service.

## Tests

- `tests/speaking-protocol.test.mjs` builds the fixture's learner binary frame and validates assistant frames.
- `tests/speaking-api.test.mjs` checks REST paths and request bodies for session and profile operations.
- `tests/speaking-profile.test.mjs` checks enabled-only validation and revision-conflict handling.
- `npm run test:auth` exercises the shared protected-route and inherited-role policy.
