# Project Structure — engolearn-frontend

> Single source of truth for the frontend architecture.
> `AGENTS.md` and `README.md` are summaries only — if they conflict with this file, this file wins.

## 1. Goal & scope

- Stack: React 19 + Vite 6 + TypeScript (~5.8) + React Router v7 + Tailwind v4 + shadcn (`new-york/stone`).
- Architecture: **feature-based, split by business domain** (e.g. `topic`, `grammar`, `vocabulary`), not by role (`user` / `admin`).
- Current goal: **Engo Learn** English-learning UI for Vietnamese learners.
- Related sources of truth:
  - UI tokens & visual language: `docs/design-system/tokens.yaml`, `principles.md`, `components.md`, `patterns.md`
  - Agent workflow: `AGENTS.md` + `frontend-ui` skill
  - Boilerplate examples (legacy): `README.md` (`Post` / `Product` features — keep for reference, new Engo Learn work follows this doc)

## 2. Top-level layout

```bash
src/
├── core/                # App-wide infra (layouts, shadcn wrappers, global CSS)
│   ├── assets/css/      # Global styles (App.css)
│   ├── components/shadcn/ # shadcn/ui wrappers (Button, Input, Card, Dialog, Form...)
│   └── layouts/         # LearningLayout, ManagementLayout, FullLayout (+ layout-local components/)
├── shared/              # Cross-feature reusable code (no business domain)
│   ├── components/      # Card, Loading, EmptyState...
│   ├── hooks/           # useFetch, useLoading...
│   ├── services/        # API layer + HTTP utilities
│   ├── utils/           # Formatters, cn()...
│   ├── constants/       # API URLs, route paths...
│   └── types/           # Shared TypeScript interfaces
├── features/            # One folder per business domain
│   └── <domain>/        # Domain capabilities, implementations and optional contracts
├── router.tsx           # Central route aggregation (useRoutes)
└── main.tsx             # Entry point (BrowserRouter + AppRouter)
```

## 3. Where does code go? (`core` vs `shared` vs `features`)

| Location | Put here | Do NOT put here |
|----------|----------|-----------------|
| `src/core/` | Layouts, global CSS, shadcn wrappers, app-wide providers | Feature-specific UI or business logic |
| `src/shared/` | Generic, feature-neutral code with no single business-domain owner | Domain-specific capabilities or code that only shares an implementation detail |
| `src/features/<domain>/` | Capabilities owned by one domain, their implementations, and any public contract they provide | Another feature's internal implementation (see §6) |

Decision rule: keep domain-specific capabilities in their owning feature. When another feature needs one, publish and consume the provider's contract. Use `shared/` for genuinely generic functionality without a business-domain owner, even when several features reuse it. Promote code to `core/` when it belongs to the app shell, such as layouts, theme, or global CSS.

## 4. Canonical feature shape

Features use the parts of this shape that fit their domain and capability:

```bash
features/<domain>/
├── components/
│   ├── shared/          # Used by both learning + management inside this feature
│   ├── learning/        # Learning-experience components only
│   └── management/      # Management-console components only
├── contract/            # Optional public capability API (contract/index.ts)
├── hooks/               # Feature-scoped hooks (shared by both surfaces)
├── services/            # Feature-owned API clients and business operations
├── types/               # Feature-scoped types (single definition per entity)
├── views/               # When the feature owns a UI surface
│   ├── learning/        # Learning pages (e.g. TopicDetailView.tsx)
│   └── management/      # Management pages (e.g. TopicManagementListView.tsx)
└── routes.ts            # Optional: exports XxxRoutes when the feature owns routes
```

Add views and routes when the feature owns a UI surface. Add a contract when another feature needs to consume the capability.

Reference implementation: `src/features/topic/routes.ts` + `src/features/Post/` (fullest legacy example with `hooks/` + `types/`).

### 4.1 Public capability contracts

Publish the capability API from `src/features/<provider>/contract/index.ts`. It may expose public types, domain operations or service façades, reusable hooks, read-only selectors, capability status or configuration, and public events or errors. Export only the symbols consumers need. Typed re-exports are sufficient when they preserve a clear and stable boundary.

Keep capability ownership with its business domain. A consumer imports the provider's contract while the provider owns and encapsulates its implementation. A contract must not import its consumers. Avoid cycles between feature contracts and implementations.

When a feature needs another feature's internal UI or utility, reconsider who owns the behavior. Extract the feature-neutral portion into `shared/` if it can stand on its own.

### 4.2 Surface split inside the feature (not at top level)

- Keep **one folder per domain** (`topic`, `grammar`), never `features/user/...` or `features/admin/...`.
- Splitting by role at the top level duplicates `types/` + `hooks/` + `services/` for the same entity and blurs capability ownership.
- Inside the feature, split only `components/` and `views/` by **experience surface** (what the UI is for, never who may access it):
  - `shared/` — reused by both surfaces (e.g. `TopicCard`, `FilterBar`).
  - `learning/` — learning experience (cards, practice, wizard steps).
  - `management/` — management console UI following `docs/design-system/patterns.md` (`Admin Page`, `List Page`, `Form Pattern`). Accessible by any role holding the required permission — enforced by route guards (§7), never by folder placement. When it grows, group by **screen slice** inside `management/` (e.g. `management/list/`, `management/upsert/`).
- `hooks/` and `types/` stay flat and surface-agnostic: one `Topic` type, one `useTopics()` hook.
- `learning/` and `management/` must never import from each other. Both can use their feature's shared components, hooks, and types through `@features/<domain>/*`, along with `@shared/*` and `@/core/*`.
- Name management symbols by capability (`TopicManagementTable`, `useTopicManagement`), never by role (`AdminTopicTable`); roles change, capabilities don't.
- Keep it flat while small: if a feature has ≤5 components or only one surface, skip the `shared/learning/management` subfolders and split when it grows.

### 4.3 When to break the rule

Create a separate `features/<domain>-management/` feature only when **all three** hold:

1. Admin lifecycle is fully independent (review, publish, audit, permissions),
2. Admin API + layout + guards differ entirely from learner,
3. A different owner/team maintains it and sharing a folder causes constant conflicts.

Even then, split as `<domain>-management` (still by domain), never as one giant `features/admin/`.

## 5. Naming, aliases & TypeScript strictness

- Folder names: **lowercase singular domain** for all new Engo Learn work (`topic`, `grammar`, `vocabulary`). Legacy `Post/`, `Product/`, `Welcome/` keep their casing for history — do not copy that casing for new features.
- Files: `PascalCase.tsx` for components/views (`TopicCard.tsx`, `TopicManagementListView.tsx`), `camelCase.ts` for hooks/utils (`useTopics.ts`), `*.types.ts` for types (`topic.types.ts`).
- Route exports: `<Domain>Routes` or purpose-specific route groups where a feature spans surfaces (e.g. topic catalog, standalone learner, and management routes).
- Aliases (defined in `vite.config.ts` + `tsconfig.app.json`):
  - `@/` → `src/`, `@features/` → `src/features/`, `@shared/` → `src/shared/`.
  - Prefer `@features/` over `@/` for feature imports; `react-router` (never `react-router-dom`).
- Strictness (`tsc -b` fails the build):
  - `verbatimModuleSyntax` + `erasableSyntaxOnly`: `import type { ... }` for types; no enums, namespaces, or parameter properties.
  - `noUnusedLocals` / `noUnusedParameters`: no dead code.

## 6. Feature boundaries & imports

```tsx
// ✅ Allowed inside features/topic/views/management/TopicManagementListView.tsx
import type { TopicManagementFilter } from "@features/topic/types/topic.types";
import { useTopicList } from "@features/topic/hooks/useTopicList";
import TopicManagementTable from "@features/topic/components/management/list/TopicManagementTable";
import { useFetch } from "@shared/hooks";
import LearningLayout from "@/core/layouts/LearningLayout";

// ✅ A consumer uses the provider's published capability contract (illustrative names)
import { subscriptionCapability } from "@features/subscription/contract";
import type { Subscription } from "@features/subscription/contract";

// ❌ Forbidden: importing provider implementation details
import { usePlans } from "@features/subscription/hooks/useSubscription";
import { subscriptionService } from "@features/subscription/services/subscription.service";
import UnitCard from "@features/grammar/components/UnitCard";
```

Rules:

1. Import other features' capabilities through `@features/<provider>/contract`. This resolves to the provider's `contract/index.ts`. Direct imports from another feature's implementation are prohibited.
2. Feature dependencies follow `consumer → provider contract → provider implementation`. Providers must not depend on consumer implementations. Avoid feature-level cycles, including cycles through contracts.
3. Features may also import feature-neutral functionality from `@shared/*` and app-shell infrastructure from `@/core/*`.
4. `shared/` never imports from `features/`; `core/` never imports from `features/` or `shared/`.
5. For reuse across features, keep domain-specific capabilities in the owning feature and publish a contract. Use `shared/` when functionality is generic and has no business-domain owner.
6. Check `src/core/components/shadcn/` and `src/shared/components/` before creating any UI primitive — reuse Button/Input/Select/Dialog/Card/Form.

## 7. Routing

- A feature that owns routes exports `RouteObject[]` from `routes.ts` (see `src/features/topic/routes.ts`, `src/features/Post/routes.ts`).
- Feature route files own URL patterns and view declarations. `src/router.tsx` composes Home through the landing entry. Topic catalog and Grammar use a session-aware resource layout, which renders the public header for guests and `LearningLayout` for learners. My Topics, Learning Path and learner Subscription use a pathless `LearningLayout` parent.
- `src/main.tsx` wraps `AppRouter` in `BrowserRouter`; `AppRouter` calls `useRoutes(appRoutes)`.
- Surface pattern inside one `routes.ts`:

```tsx
// features/topic/routes.ts
export const TopicCatalogRoutes: RouteObject[] = [
  {
    Component: TopicViewerLayout,
    children: [
      { path: ROUTES.TOPICS, Component: TopicPage },
    ],
  },
];
```

`router.tsx` places `TopicCatalogRoutes` and `TopicDetailRoutes` under the session-aware resource layout. The topic viewer provider remains feature-owned and wraps routes that need viewer state. Topic Detail adds the public header for guests and retains its standalone presentation for learners. Attempt, result and review screens remain standalone. Topic management stays under its feature guard and management layout.

Guards (auth/permission) wrap the route element or layout — never duplicate the feature folder to enforce permissions.

## 8. Data fetching

Reuse `useFetch(fetchFn)` from `@shared/hooks` (see `src/features/Product/hooks/useProducts.ts`):

```tsx
const { data, loading, error, refetch } = useFetch((signal: AbortSignal) =>
  topicService.list(signal),
);
```

Pass an `(signal: AbortSignal) => Promise<T>` callback; abort handling is built in. Feature-specific fetch logic lives in `features/<domain>/hooks/`; HTTP primitives live in `src/shared/services/`.

## 9. UI linkage (design system)

Before writing UI, load the `frontend-ui` skill and read `docs/design-system/`:

- `tokens.yaml` — primary `#006565`, `Hanken Grotesk`, radii/spacing scale (no arbitrary values).
- `principles.md` — Modern Minimalism, mobile-first 20px page margin, EN > VI hierarchy, line-height for VI diacritics.
- `components.md` — Button, Learning Card (`rounded-2xl`, 20px padding).
- `patterns.md` — `Admin Page`, `List Page`, `Form Pattern`, `Wizard Pattern`.

Feature components live in `src/features/<domain>/components/` — never in global UI dirs. (Note: `.opencode/UI_CONSTITUTION.md` still says `Inter`; for Engo Learn UI, `docs/design-system/*` wins.)

## 10. Anti-patterns

- `features/admin/*`, `features/user/*`, or `features/common/*` buckets.
- One entity defined twice (`learning/Topic` vs `management/Topic` types or hooks).
- `learning/` importing from `management/` (or vice versa).
- Naming management symbols by role (`AdminTopicTable`) instead of capability (`TopicManagementTable`).
- Feature-specific components in `src/shared/components/` or `src/core/components/`.
- New Button/Input/Card/Dialog instead of reusing shadcn/shared.
- Arbitrary colors, fonts, spacing, radius outside `tokens.yaml`.
- Custom input/label implementations when a Form component exists.
- Route definitions outside `features/*/routes.ts` (except aggregation in `router.tsx`).

## 11. Checklist — add a new feature

1. Create `src/features/<domain>/` with the folders and entry points the domain needs. Views and `routes.ts` are optional for capabilities without UI routes.
2. Define types in `types/<domain>.types.ts` (`import type` everywhere).
3. Add hooks with `useFetch`; no direct `fetch` in views. Publish `contract/index.ts` when another feature needs to consume this feature's domain capability.
4. Add `views/learning/` or `views/management/` when the feature owns those UI surfaces.
5. When the feature owns routes, export its `RouteObject[]` and register it in `src/router.tsx`'s `appRoutes`.
6. Reuse shadcn/shared UI; follow `docs/design-system/patterns.md` page shape.
7. Verify: `npm run build` (tsc + vite) and `npm run lint` — no test runner/CI configured.

## 12. Maintenance

- This file is the authority on structure. Keep `AGENTS.md` to a summary + link; keep `README.md` to overview + examples + link.
- Update this file whenever a new convention is adopted (new layout, guard strategy, `-admin` split). Do not let tribal knowledge live only in chat or PRs.

## Placement User shell sync — 2026-11-08

Authenticated Placement entry/result/review now reuse the core LearningLayout (shared sidebar, top bar, compact preference and mobile drawer). PlacementUserLayout is a thin identityGeneration-keyed adapter; legacy PlacementUserSidebar/TopBar are not mounted. The shared practice menu includes a distinct Kiểm tra đầu vào link matching /placement and its descendants. This supersedes the earlier custom Placement sidebar/240px/lg-breakpoint descriptions. Existing periodic-assessment entry remains separate. Guest public navigation and standalone attempt timer/layout are unchanged.
