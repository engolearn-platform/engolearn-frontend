# Speaking with AI — frontend module

Speaking is the frontend capability provider for speaking sessions, REST and realtime communication, and Speaking protocol types. Topic owns the current learner-facing views, routes, navigation, item-result entry point, and achievement/session-result presentation. Topic consumes Speaking through `@features/speaking/contract`.

## Documentation index

| Document | Contents |
| --- | --- |
| [Module map](module-map.md) | Capability ownership, public contract, implementation locations, tests, and task locator. |
| [Runtime flows](runtime-flows.md) | Topic-to-contract-to-provider-to-backend transitions for launch, sessions, opening, voice turns, feedback, completion, and recovery. |
| [User flows](user-flows.md) | Learner entry points, use cases SPK-UC-001–010, implementation gaps, and known verification limits. |
| [FE–BE API contract](api-contract.md) | REST/WebSocket shapes, authentication, audio, event handling, and compatibility notes. |
| [Achievements and session results](achievement-session-result.md) | Topic-owned presentation and server-authoritative result behavior. |

The [business module specification](../../../../docs/engolearn-business-doc/docs/usecase_spec/speaking-with-AI/00-module.md) is the source for observable business behavior. The [backend Speaking overview](../../../../engolearn-backend/docs/features/speaking-with-ai/README.md) describes backend implementation and limitations.

## Availability and local setup

Speaking is enabled in Vite development builds. For other builds, `VITE_SPEAKING_ENABLED=true` enables its entry point. `VITE_SPEAKING_DEMO_ENABLED` is the fallback when the newer flag is unset, and the value must be the string `"true"`. This flag controls frontend visibility. Backend authentication, authorization, and availability remain enforced by the service. The backend blocks Speaking whenever the `prod` profile is active. Its legacy evaluator can be selected by setting `engolearn.speaking.manager.enabled=false` at backend startup, without changing FE configuration. See the [backend runtime configuration](../../../../engolearn-backend/docs/technical/speaking-ai/module-contract.md#runtime-selection-and-rollback).

Vite proxies `/api` and `/ws` to `http://localhost:8080` by default. Set `VITE_API_PROXY_TARGET` when the backend uses another address. A deployed reverse proxy must support HTTP and WebSocket traffic on both paths.

For local end-to-end checks, follow the backend [startup and seed guidance](../../../../engolearn-backend/docs/technical/speaking-ai/module-contract.md#local-startup-and-seed-data), run `npm run dev`, and sign in with an account that can open the configured Topic item. The `/dev/speaking-session` and `/dev/speaking` routes are available only in development. The first uses the Topic `SpeakingView`; the latter uses the legacy `MediaRecorder` demo client. The fixed airport fixture uses item `690000000000000000000002`. An optional café seed pack supports AI-open and learner-open examples using item IDs `691b00000000000000000003` and `691b00000000000000000004`. The current backend controller does not expose the legacy demo endpoints, so that older demo flow requires a compatible server.

Source review and automated checks do not verify microphone permission, browser audio behavior, provider credentials, live backend availability, or network recovery. See [user flows](user-flows.md) and [achievement verification notes](achievement-session-result.md) for outstanding manual checks.
