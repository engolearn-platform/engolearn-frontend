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
│   └── layouts/         # EngoAppLayout, FullLayout (+ layout-local components/)
├── shared/              # Cross-feature reusable code (no business domain)
│   ├── components/      # Card, Loading, EmptyState...
│   ├── hooks/           # useFetch, useLoading...
│   ├── services/        # API layer + HTTP utilities
│   ├── utils/           # Formatters, cn()...
│   ├── constants/       # API URLs, route paths...
│   └── types/           # Shared TypeScript interfaces
├── features/            # One folder per business domain
│   └── topic/           # Canonical Engo Learn example (see §4)
├── router.tsx           # Central route aggregation (useRoutes)
└── main.tsx             # Entry point (BrowserRouter + AppRouter)
```

## 3. Where does code go? (`core` vs `shared` vs `features`)

| Location | Put here | Do NOT put here |
|----------|----------|-----------------|
| `src/core/` | Layouts, global CSS, shadcn wrappers, app-wide providers | Feature-specific UI or business logic |
| `src/shared/` | Code used by **≥2 features** with no single owner | Single-feature code (keep it in the feature) |
| `src/features/<domain>/` | Everything owned by one domain: components, hooks, types, views, routes | Imports from another feature (forbidden, see §6) |

Decision rule: start inside the feature. Promote to `shared/` only on the second reuse. Promote to `core/` only if it affects the whole app shell (layout, theme, global CSS).

## 4. Canonical feature shape

Every feature follows this shape:

```bash
features/<domain>/
├── components/
│   ├── shared/          # Used by both learner + admin inside this feature
│   ├── learner/         # Learner-facing components only
│   └── admin/           # Admin-only components only
├── hooks/               # Feature-scoped hooks (shared by both roles)
├── types/               # Feature-scoped types (single definition per entity)
├── views/
│   ├── learner/         # Learner pages (e.g. LearnerTopicView.tsx)
│   └── admin/           # Admin pages (e.g. AdminTopicListView.tsx)
└── routes.ts            # Exports XxxRoutes: RouteObject[]
```

Reference implementation: `src/features/topic/routes.ts` + `src/features/Post/` (fullest legacy example with `hooks/` + `types/`).

### 4.1 Role split inside the feature (not at top level)

- Keep **one folder per domain** (`topic`, `grammar`), never `features/user/...` or `features/admin/...`.
- Splitting by role at the top level duplicates `types/` + `hooks/` + `services/` for the same entity and forces cross-feature imports — the exact problem feature-based architecture exists to avoid.
- Inside the feature, split only `components/` and `views/` by role:
  - `shared/` — reused by both roles (e.g. `TopicCard`, `FilterBar`).
  - `learner/` — learning experience (cards, practice, wizard steps).
  - `admin/` — CRUD / review / publish UI following `docs/design-system/patterns.md` (`Admin Page`, `List Page`, `Form Pattern`).
- `hooks/` and `types/` stay flat and role-agnostic: one `Topic` type, one `useTopics()` hook.
- `learner/` and `admin/` must never import from each other. Both may import from `../shared/`, `../../hooks/`, `../../types/`, `@shared/*`, `@/core/*`.
- Use `learner/` (not `user/`) because every admin is also a user — `learner` vs `admin` is unambiguous for Engo Learn.
- Keep it flat while small: if a feature has ≤5 components or only one role, skip the `shared/learner/admin` subfolders and split when it grows.

### 4.2 When to break the rule

Create a separate `features/<domain>-admin/` feature only when **all three** hold:

1. Admin lifecycle is fully independent (review, publish, audit, permissions),
2. Admin API + layout + guards differ entirely from learner,
3. A different owner/team maintains it and sharing a folder causes constant conflicts.

Even then, split as `<domain>-admin` (still by domain), never as one giant `features/admin/`.

## 5. Naming, aliases & TypeScript strictness

- Folder names: **lowercase singular domain** for all new Engo Learn work (`topic`, `grammar`, `vocabulary`). Legacy `Post/`, `Product/`, `Welcome/` keep their casing for history — do not copy that casing for new features.
- Files: `PascalCase.tsx` for components/views (`TopicCard.tsx`, `AdminTopicListView.tsx`), `camelCase.ts` for hooks/utils (`useTopics.ts`), `*.types.ts` for types (`topic.types.ts`).
- Route export: `<Domain>Routes` (e.g. `TopicRoutes`, `GrammarRoutes`).
- Aliases (defined in `vite.config.ts` + `tsconfig.app.json`):
  - `@/` → `src/`, `@features/` → `src/features/`, `@shared/` → `src/shared/`.
  - Prefer `@features/` over `@/` for feature imports; `react-router` (never `react-router-dom`).
- Strictness (`tsc -b` fails the build):
  - `verbatimModuleSyntax` + `erasableSyntaxOnly`: `import type { ... }` for types; no enums, namespaces, or parameter properties.
  - `noUnusedLocals` / `noUnusedParameters`: no dead code.

## 6. Boundaries & imports

```tsx
// ✅ Allowed inside features/topic/views/admin/AdminTopicListView.tsx
import type { Topic } from "../../types/topic.types";
import { useTopics } from "../../hooks/useTopics";
import { TopicTable } from "../../components/admin/TopicTable";
import { TopicCard } from "../../components/shared/TopicCard";
import { useFetch } from "@shared/hooks";
import EngoAppLayout from "@/core/layouts/EngoAppLayout";

// ❌ Forbidden: cross-feature import
import { GrammarCard } from "@features/grammar/components/shared/GrammarCard";
// → Move shared UI to src/shared/components/ or duplicate deliberately per domain.
```

Rules:

1. Features never import across features.
2. Features may import from `@shared/*` and `@/core/*`.
3. `shared/` never imports from `features/`; `core/` never imports from `features/` or `shared/`.
4. Check `src/core/components/shadcn/` and `src/shared/components/` before creating any UI primitive — reuse Button/Input/Select/Dialog/Card/Form.

## 7. Routing

- Each feature exports `RouteObject[]` from `routes.ts` (see `src/features/topic/routes.ts`, `src/features/Post/routes.ts`).
- `src/router.tsx` only aggregates: `export const appRoutes = [...TopicRoutes, ...GrammarRoutes, ...]`. No route definitions live in `router.tsx`.
- `src/main.tsx` wraps `AppRouter` in `BrowserRouter`; `AppRouter` calls `useRoutes(appRoutes)`.
- Role pattern inside one `routes.ts`:

```tsx
// features/topic/routes.ts
export const TopicRoutes: RouteObject[] = [
  {
    path: "/topics",
    Component: EngoAppLayout, // learner shell
    children: [{ path: "", Component: LearnerTopicView }],
  },
  {
    path: "/admin/topics",
    Component: EngoAppLayout, // swap to AdminLayout when it exists
    children: [
      { path: "", Component: AdminTopicListView },
      { path: "new", Component: AdminTopicFormView },
    ],
  },
];
```

Guards (auth/role) wrap the route element or layout — never duplicate the feature folder to enforce permissions.

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
- One entity defined twice (`user/Topic` vs `admin/Topic` types or hooks).
- `learner/` importing from `admin/` (or vice versa).
- Feature-specific components in `src/shared/components/` or `src/core/components/`.
- New Button/Input/Card/Dialog instead of reusing shadcn/shared.
- Arbitrary colors, fonts, spacing, radius outside `tokens.yaml`.
- Custom input/label implementations when a Form component exists.
- Route definitions outside `features/*/routes.ts` (except aggregation in `router.tsx`).

## 11. Checklist — add a new feature

1. Create `src/features/<domain>/` with `components/ hooks/ types/ views/ routes.ts`.
2. Define types in `types/<domain>.types.ts` (`import type` everywhere).
3. Add hooks with `useFetch`; no direct `fetch` in views.
4. Add `views/learner/` page first; add `views/admin/` + `components/admin/` only when the admin UI is real.
5. Export `<Domain>Routes` and register it in `src/router.tsx`'s `appRoutes`.
6. Reuse shadcn/shared UI; follow `docs/design-system/patterns.md` page shape.
7. Verify: `npm run build` (tsc + vite) and `npm run lint` — no test runner/CI configured.

## 12. Maintenance

- This file is the authority on structure. Keep `AGENTS.md` to a summary + link; keep `README.md` to overview + examples + link.
- Update this file whenever a new convention is adopted (new layout, guard strategy, `-admin` split). Do not let tribal knowledge live only in chat or PRs.
