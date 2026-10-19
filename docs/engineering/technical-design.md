# Technical design — frontend overall

> **Purpose:** One-page description of how `engolearn-frontend` is put together: layer boundaries,
> feature organization, routing and data-flow principles, and the current backend-integration status.
> **Scope:** Cross-cutting architecture only. Per-feature/per-screen detail lives in
> [`../features/`](../features/) docs and [`feature-design/`](feature-design/_template.md); UI visuals
> live in the design system. No implementation detail is duplicated here.
> **Owner:** Frontend engineering docs — update in the same change as any structural change.
> **Status:** PROPOSED (this document). It summarizes — and defers to — the APPROVED authority
> [../architecture/project-structure.md](../architecture/project-structure.md).
> **Relationships:** APPROVED structure:
> [../architecture/project-structure.md](../architecture/project-structure.md) ·
> APPROVED visuals: [../design-system/tokens.yaml](../design-system/tokens.yaml),
> [../design-system/principles.md](../design-system/principles.md),
> [../design-system/components.md](../design-system/components.md),
> [../design-system/patterns.md](../design-system/patterns.md) ·
> Rules: [implementation-constraints.md](implementation-constraints.md) ·
> Decisions: [decisions/README.md](decisions/README.md) ·
> Status quo findings: [traceability/deviations.md](traceability/deviations.md)

## 1. Layer boundaries — `core` / `shared` / `features` (EXISTING, APPROVED authority)

Three top-level layers under `src/`, split rules defined in
[project-structure.md §3 + §6](../architecture/project-structure.md) (link — not restated):

- `src/core/` — app-wide shell only (layouts, shadcn wrappers, global CSS).
- `src/shared/` — code used by ≥2 features with no domain owner (hooks, components, services,
  constants, utils, types).
- `src/features/<domain>/` — everything owned by one business domain; never imports another feature.

Import direction is one-way: `features → shared/core`; `shared` never imports `features`;
`core` never imports `features` or `shared`.

- **EXCEPTION ON RECORD (DEVIATION `DEV-02`)**: [`../../src/core/layouts/TopicLearningLayout.tsx:3`](../../src/core/layouts/TopicLearningLayout.tsx)
  imports `@features/topic/hooks/TopicProgressContext` (`core → features`). Open decision `D4`;
  left in code intentionally.
- Aliases (`@/`, `@features/`, `@shared/`) are defined in `vite.config.ts:13-16` and
  `tsconfig.app.json:26-30` (EXISTING) — see constraint `C-04`.

## 2. Feature organization & surface split (EXISTING for `topic`)

Canonical shape and the learning/management surface split are defined in
[project-structure.md §4](../architecture/project-structure.md). Working summary:

- One folder per **domain** (`topic`, `grammar`) — never per role (`admin`, `user`).
- Inside a feature, only `components/` and `views/` split into `shared/`, `learning/`,
  `management/`; `hooks/` and `types/` stay flat with **one definition per entity**.
- `management/` may further split by **screen slice** when the surface grows; current slices in
  `topic`: `management/list/` (topic list page) and `management/upsert/` (create/update wizard +
  item editors).
- `learning/` and `management/` never import each other; both may use `../shared/`, `hooks/`,
  `types/`, `@shared/*`, `@/core/*`.
- Management symbols named by capability (`TopicManagement*`, `TopicUpsert*`), never by role
  (`Admin*`).

Observed state (EXISTING): `src/features/topic/` follows the split; `management/` is grouped into
`list/` + `upsert/`; legacy `Post/`, `Product/`, `Welcome/` predate it and keep their casing
(decision `D2`); `grammar/` is flat (allowed while small).

## 3. Routing principles (EXISTING)

- Each feature exports `<Domain>Routes: RouteObject[]` from `src/features/<domain>/routes.ts`;
  [`src/router.tsx`](../../src/router.tsx) only aggregates into `appRoutes` via `useRoutes`
  ([project-structure.md §7](../architecture/project-structure.md)).
- Entry: [`src/main.tsx`](../../src/main.tsx) wraps `AppRouter` in `BrowserRouter`.
- Router APIs imported from `"react-router"` only — `react-router-dom` is not a dependency
  (EXISTING, `package.json`) → constraint `C-01`.
- Layout wrapping carries cross-cutting providers (e.g. pathless
  `TopicLearningLayout` mounts `TopicProgressProvider` once for all learner stages —
  `src/features/topic/routes.ts:28-34`).
- Route constants centralized in `src/shared/constants/app.constants.ts` (`ROUTES`).
- Guards: [project-structure.md §7](../architecture/project-structure.md) documents that auth
  guards wrap the route element/layout — **but 0 guard code exists** (see `DEV-06`,
  [guides/auth.md](guides/auth.md)).

```text
main.tsx (BrowserRouter)
  └─ router.tsx  ← aggregation only (appRoutes)
       ├─ features/topic/routes.ts    → LearningLayout / TopicLearningLayout / ManagementLayout
       ├─ features/grammar|Post|Product|Welcome/routes.ts
       └─ …children = views/* (page components)
```

## 4. Data-flow principles (EXISTING)

```text
View (features/<d>/views/**)
  └─ Feature hook (features/<d>/hooks/useX.ts)   ← owns fetch logic, mock or real
       └─ useFetch((signal) => Promise<T>)       ← @shared/hooks; abort + loading/error/refetch
            └─ Service/function (features/<d>/services/**  or  shared/services/**)
                 └─ HTTP primitive (shared/services/http.service.ts — NOT USABLE today, §5)
```

- Views never call `fetch` directly; feature hooks own data (constraint `C-06`).
  Grounded examples: [`guides/api-integration.md`](guides/api-integration.md).
- Feature-specific types live in `features/<d>/types/*.types.ts` with `import type`
  (`verbatimModuleSyntax` + `erasableSyntaxOnly`, `tsconfig.app.json:13,22`).

## 5. Backend integration status (as of this doc)

| Piece | Status | Evidence |
|---|---|---|
| Learner topic content/progress | **EXISTING — mock**: hooks resolve local mock data; PATCH logs to console | `src/features/topic/hooks/useTopicDetail.ts` (`MOCK_TOPIC_DETAIL`), `src/features/topic/services/topic-progress.service.ts`; tracker: [../features/topic/learner/00-mock-api-status.md](../features/topic/learner/00-mock-api-status.md) |
| `HttpService` (`shared/services/http.service.ts`) | **EXISTING but NOT USABLE**: constructed with `baseUrl = ""` (`http.service.ts:11,75`), **0 call sites** in `src/` | relative endpoints would throw in `new URL(endpoint, "")`; no base URL configured anywhere |
| `API_URLS` (`shared/constants/api.constants.ts`) | **EXISTING — placeholders only**: two third-party demo hosts (jsonplaceholder, fakestore) used by legacy `Post`/`Product` | `api.constants.ts:1-4` |
| Real API base URL / env config | **NOT USABLE / UNKNOWN**: no `import.meta.env`/`VITE_*` usage in `src/` (0 hits); contract not available | see [guides/environment.md](guides/environment.md), [guides/api-integration.md](guides/api-integration.md) |
| Auth/session | **NOT IMPLEMENTED** — 0 code; `/admin/*` routes public | [guides/auth.md](guides/auth.md), `DEV-06` |

No backend endpoint, DTO, or error contract is described anywhere in `docs/engineering/` — those
are **UNKNOWN** until a frozen contract is provided (business/backend docs beat engineering docs:
[README precedence](README.md#precedence-rules-tie-break-order)).

## 6. Related decisions & constraints

- Open decisions: [`decisions/README.md`](decisions/README.md) (`D1`–`D12`, all PROPOSED).
- Enforceable rules: [`implementation-constraints.md`](implementation-constraints.md).
- Known departures kept in code: [`traceability/deviations.md`](traceability/deviations.md).
- Validation procedure: [`code-validation.md`](code-validation.md).

> Typo note (EXISTING): `src/router.tsx:4,11` exports/uses `ProducsRoute` (sic) — cosmetic
> deviation `DEV-05`, registered, not fixed by the docs task.
