# Speaking V2 — frontend module

Speaking owns learner session routes, REST/realtime transport, audio framing, playback, history, and assessment presentation. Topic owns the entry points and the Speaking profile editor. Topic consumes Speaking through `@features/speaking/contract`.

## Documentation

| Document | Contents |
| --- | --- |
| [Module map](module-map.md) | Public boundary and source locations. |
| [Runtime flows](runtime-flows.md) | Entry, microphone, reconnect, result and history behavior. |
| [User flows](user-flows.md) | Learner screens and state handling. |
| [FE–BE API contract](api-contract.md) | REST and WebSocket operations. |
| [Session results](achievement-session-result.md) | Four criteria, partial results, audio replay and empty states. |

The accepted cross-component contract is [Speaking V2 contract](../../../../docs/system-design/speaking-v2-contract.md), with the [shared protocol fixture](../../../../docs/system-design/speaking-v2-protocol.fixture.json). Business behavior is defined in the pinned Speaking V2 specification under `docs/engolearn-business-doc`.

## Local setup and checks

Run the frontend with `npm run dev`; Vite proxies `/api` and `/ws` to the configured backend. Speaking routes require an authenticated learner session. The explicit create/replacement action first requests microphone permission and releases its probe tracks. History and result screens do not access the microphone.

Run `npm run test:speaking` for fixture parity, API boundary and profile validation tests. `npm run build`, `npm run lint`, and `npm run test:auth` cover compilation, frontend conventions and protected-route behavior. These checks do not make live provider or microphone claims.

Homepage read capability: the module exports its new `loadSpeakingHomeSummary` client and summary types through its public contract. Existing APIs and feature flows are unchanged. See [homepage integration](../topic/learner/15-homepage.md).
