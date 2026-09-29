# AGENTS.md — engolearn-frontend

> Detailed structure rules: `docs/architecture/project-structure.md` — it wins on conflicts.

React 19 + Vite 6 + TS (~5.8) + React Router v7 + Tailwind v4 + shadcn (new-york/stone). Template is a feature-based boilerplate (see `README.md` Post/Product examples); current goal is the **Engo Learn** English-learning UI.

## Commands

- `npm run dev` — dev server on port 3000 (see `vite.config.ts`).
- `npm run build` — always `tsc -b && vite build`; type errors fail the build, fix them first.
- `npm run lint` — `eslint .` (ignores `dist` only).
- No test runner, no CI, no pre-commit configured. Verify with `build` + `lint`.

## Routing / entrypoints

- `src/main.tsx` wraps `AppRouter` in `BrowserRouter`; `src/router.tsx` aggregates feature routes via `useRoutes`. Import router from `"react-router"`, **not** `react-router-dom`.
- Each feature exports `XxxRoutes: RouteObject[]` from `src/features/<Name>/routes.ts` (layout `FullLayout` + `children` with `Component: <View>`). Register it in `src/router.tsx`'s `appRoutes` array.
- Canonical shape per feature: `components/ hooks/ types/ views/ routes.ts`. `src/features/topic/` is currently an empty placeholder for new Engo Learn work.

## Imports & TS strictness

- Aliases (defined in both `vite.config.ts` and `tsconfig.app.json`): `@/` → `src/`, `@features/` → `src/features/`, `@shared/` → `src/shared/`. Prefer `@features/` over `@/` for feature imports.
- Dùng alias cho mọi import ra khỏi thư mục hiện tại (chỉ giữ relative `./X` cho file cùng thư mục). Relative 2+ cấp (`../../...`) bị rule `no-restricted-imports` warn trong `eslint.config.js` — thay bằng `@features/<ten-feature>/...`, `@shared/...`, `@/...` cho app shell (`@/core/...`).
- `verbatimModuleSyntax` + `erasableSyntaxOnly` are on: use `import type { ... }` for types, no TS enums/namespaces/parameter properties.
- `noUnusedLocals`/`noUnusedParameters` are on — `build` fails on dead code.

## Boundaries

- Features are self-contained: never import across features. Shared code goes in `src/shared/` (`components/ hooks/ services/ utils/ constants/ types/`); app-wide infra in `src/core/` (`layouts/`, shadcn wrappers in `components/shadcn/`, global CSS in `assets/css/App.css`).
- Data fetching: reuse `useFetch(fetchFn)` from `@shared/hooks` — pass a `(signal: AbortSignal) => Promise<T>` callback (see `src/features/Product/hooks/useProducts.ts`); it returns `{ data, loading, error, refetch }` with abort handling built in.
- shadcn config (`components.json`): CSS `src/core/assets/css/App.css`, aliases `core/components/shadcn`, `core/lib/...`. Check `src/core/components/shadcn/` and `src/shared/components/` before creating any UI primitive.

## Engo Learn UI (required reading before UI work)

Load the `frontend-ui` skill — it points at the real sources of truth:

- `docs/design-system/tokens.yaml` (EngoLearn Narrative: primary `#006565`, `Hanken Grotesk`, radii/spacing)
- `docs/design-system/principles.md` (Modern Minimalism, mobile-first 20px page margin, EN > VI hierarchy, line-height for VI diacritics)
- `docs/design-system/components.md` (Button, Learning Card: `rounded-2xl`, 20px padding)
- `docs/design-system/patterns.md` (Admin/List/Form/Wizard page shapes)

Rules: reuse existing Button/Input/Select/Dialog/Card/Form components; no arbitrary colors, fonts, spacing, or radius; feature components live in `src/features/<feature>/components/`, never in global UI dirs. Note: `.opencode/UI_CONSTITUTION.md` still says `Inter` — for Engo Learn UI, `docs/design-system/*` (Hanken Grotesk) wins.

## Working discipline — docs first (anti doc-rot)

Every UI/feature change follows this 4-step loop. No skipped steps:

1. **Locate** — identify the relevant docs *before* touching code:
   - UI standards: `docs/design-system/*` (+ load the `frontend-ui` skill).
   - Feature standards: the docs package of the feature at hand (e.g. under
     `docs/features/`).
   - No doc exists for the feature yet → create a minimal skeleton doc
     (Stitch → route → component → state → UI-only → responsive → checklist)
     first, then code.
2. **Read** — read the docs plus the current code (related
   component/hook/type/route) before proposing a plan. Never guess props/APIs
   from memory.
3. **Implement** — code exactly per the approved plan and the doc frame;
   changing a route/prop/state beyond the doc means going back to amend the
   plan first.
4. **Update** — in the *same change*: update the doc matching the edited code
   (new prop, changed route/rule, mock → real…). If the package has an extra
   summary table/index (e.g. a mock ↔ API table), update its row too.

Tie-break rule: docs are the living spec. When code and docs disagree, assume
**the doc is wrong** unless a refactor just landed without its doc update —
on spotting a drift, either fix the code back to the doc or update the doc
immediately. Never leave a "fix later".
