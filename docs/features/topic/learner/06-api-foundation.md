# Learner — API foundation (stage 1)

Date: 2026-10-27. Status: client/contract implemented; views and BE integration pending review.
Sources: [OpenAPI](../../../handout/topic-learning/api.openapi.yaml), [handoff](../../../handout/topic-learning/backend-handoff.md), [verification](../../../handout/topic-learning/verification.md).

## Routes, components and state

No route, component or provider changes in this stage. Existing views remain on their current mocks.
The new client never silently substitutes mock data, a guest viewer or zero progress for a failed request.
Feature hooks will use useFetch and this client in stages 2–5; views will not call fetch.

## Ownership

- types/topic-api.types.ts: wire DTOs generated from the OpenAPI schemas. Existing UI models are not additional wire contracts.
- services/topic-api-client.ts: envelope/error handling, abort, same-origin requests and caller-supplied mutation identity.
- services/topic-api.service.ts: the 17 typed operations of the target contract, under /api/v1.
- scripts/generate-topic-api-types.mjs: dependency-free generation/check; contract is the source of truth.
- tests/topic-api.test.mjs: native Node transport and contract-boundary tests with injected fetch.

The transport starts in the topic feature (one owning domain); the old shared HttpService is not changed or advertised as usable.
Default base is /api/v1 through the existing Vite proxy/reverse proxy. No invented token/user header or new env variable.
No automatic network retry. The caller owns an Idempotency-Key per user action and reuses it for an uncertain response; revision is sent for advance/answer.
ProblemDetail keeps status and stable code; legacy payloads fall back to HTTP_status. Future hooks must preserve these fields when choosing UX, rather than treating every422 as “sign in”.
Viewer failure is an error; only a successful GUEST response is guest.

## Validation and adoption

npm run topic:types regenerates DTOs; npm run topic:types:check catches drift and unresolved refs.
npm run test:topic-api covers the transport and every operation route/body, not React UI or BE transactions.
Node22.18+ is required for native TypeScript stripping in these tests. Build remains tsc -b + Vite; lint remains required.
The OpenAPI file uses JSON syntax, valid YAML1.2, to avoid adding YAML/tooling dependencies.
Do not flip the existing screen rows to “real API” until those views have actually adopted the client.
