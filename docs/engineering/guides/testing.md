# Guide — Testing & validation strategy

Updated 2026-10-27 for topic API stage 1.
Related: [code validation](../code-validation.md), [decision register](../decisions/README.md), [topic evidence](../../handout/topic-learning/verification.md).

## Available checks

| Capability | Command / status |
| --- | --- |
| Type check and production build | npm run build |
| Lint | npm run lint; no new warnings allowed |
| Contract refs, metadata and generated DTO drift | npm run topic:types:check |
| Topic API transport/contract-boundary tests | npm run test:topic-api |
| Dev server for browser checks | npm run dev |
| React component/hook/browser test suite | NOT IMPLEMENTED |
| CI, pre-commit, coverage | NOT IMPLEMENTED |
| Real multi-user auth/ownership tests | NOT IMPLEMENTED; BE topic provider is fixed |

Build+lint remain mandatory. Native API tests are additional when editing the topic contract/client/generator.
The native runner requires Node22.18+ and strips erasable TypeScript in tests; npm dependencies were not added.
Production code still compiles through the existing TypeScript/Vite build.

## D13 — narrow tooling choice

Status: accepted 2026-10-27, routine implementation choice within the user's approved staged API work and FE-mocked persona tests.
Choice: node:test + assert, injected fetch, and a dependency-free OpenAPI-to-TypeScript generator. No test library, store or browser automation framework is introduced.
Rationale: test the transport's consequential failure paths and contract wiring using Node already installed.
Alternative: add a general test framework now, or keep build/lint only. A framework adds dependencies before component-testing needs are settled; build/lint alone cannot exercise cancellation, failed/malformed responses or mutation identity.
Scope: API boundary only. This does not settle auth guards, React testing tooling, CI or a whole-project testing standard.
The source OpenAPI is written in JSON syntax (valid YAML1.2) so Node can parse it without a YAML library.

## What the tests prove

- Stable code/status survive ProblemDetail; malformed success/HTML failures do not become mocks, guest or empty state.
- AbortSignal propagation, encoded search/cursors/IDs, same-origin credentials.
- No automatic retry of an uncertain mutation; required caller-supplied Idempotency-Key.
- All client operations match their declared paths/methods/request schemas.
- Guest and A1–C2 viewer payloads can be supplied in isolated tests without auth/user collection.

They do not prove server idempotency/transactions/authorization, UI state isolation, accessibility or real end-to-end behavior.
Generated-type checks validate local refs and operation metadata; no external full OpenAPI validator has been run.

## Evidence and later stages

Record actual command outcomes, existing/new warnings, UI scenarios run/skipped and BE dependencies in [verification.md](../../handout/topic-learning/verification.md).
Only call a screen integrated when its hook/view calls the real endpoint and that has been exercised.
The historical Playwright wording in learner docs remains unverified: this task has not added or run Playwright.
