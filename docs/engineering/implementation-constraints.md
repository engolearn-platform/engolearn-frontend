# Implementation constraints

> **Purpose:** Enforceable, reviewable rules for changes in `engolearn-frontend/src/` — each with a
> stable ID, normative strength, worked correct/incorrect example, and a named enforcement channel.
> **Scope:** All application code (`src/`, configs). Documentation-only changes are exempt from
> code rules but still obey `C-11` (doc sync).
> **Owner:** Frontend engineering docs — rule changes happen through a decision
> ([decisions/README.md](decisions/README.md)), then this file, then code.
> **Status:** PROPOSED — no rule here is approved; authorities they rephrase are APPROVED and linked.
> **Relationships:** [../architecture/project-structure.md](../architecture/project-structure.md) ·
> [../design-system/tokens.yaml](../design-system/tokens.yaml) · [../../AGENTS.md](../../AGENTS.md) ·
> [decisions/README.md](decisions/README.md) · [code-validation.md](code-validation.md) ·
> [traceability/deviations.md](traceability/deviations.md)

**Legend:** enforcement is **automated** only if `npm run build` (`tsc -b && vite build`) or
`npm run lint` (`eslint .`) catches it. Everything else is **review** or **manual**. Test runner,
CI, and pre-commit hooks are **NOT AVAILABLE** ([guides/testing.md](guides/testing.md)).

---

### C-01 — Router import source
- **Strength:** MUST import React Router APIs from `"react-router"`. MUST NOT import `react-router-dom`.
- **Scope & rationale:** RR v7 ships the `react-router` package; `react-router-dom` is not in
  `package.json` (EXISTING). One import surface avoids dual-package confusion.
- **Correct:** `import { useRoutes } from "react-router";` (`src/router.tsx:2`)
- **Incorrect:** `import { useRoutes } from "react-router-dom";`
- **Related:** [../../AGENTS.md](../../AGENTS.md) (Routing/entrypoints); no decision needed.
- **Enforcement:** automated — build fails (module not found). Dedicated lint rule: NOT AVAILABLE.
- **Exceptions:** none.

### C-02 — Route definitions live in `features/*/routes.ts`
- **Strength:** MUST define a feature's routes in `src/features/<domain>/routes.ts` as
  `<Domain>Routes: RouteObject[]`. `src/router.tsx` MUST only aggregate.
- **Scope & rationale:** Keeps route ownership with the feature; single wiring point
  ([project-structure.md §7](../architecture/project-structure.md)).
- **Correct:** `src/features/topic/routes.ts:17` (`export const TopicRoutes: RouteObject[]`)
- **Incorrect:** adding `{ path: "/x", Component: X }` directly inside `router.tsx` `appRoutes`.
- **Related:** decision `D5` covers naming/style questions; typo `ProducsRoute` is `DEV-05` (grandfathered).
- **Enforcement:** review/manual — no ESLint rule for route placement (NOT AVAILABLE).
- **Exceptions:** pathless layout parents inside the feature's own `routes.ts` are fine
  (e.g. `TopicLearningLayout`, `src/features/topic/routes.ts:34`).

### C-03 — Layer & feature import boundaries
- **Strength:** MUST NOT import across features; `shared/` MUST NOT import `features/`;
  `core/` MUST NOT import `features/` or `shared/`. Features MUST import shared code only via
  `@shared/*` and app shell via `@/core/*`.
- **Scope & rationale:** Feature isolation is the architecture's core promise
  ([project-structure.md §6](../architecture/project-structure.md)); cross-imports force duplicate
  entities and role-based folder splits.
- **Correct:** `src/features/topic/routes.ts:2` (`import ManagementLayout from "@/core/layouts/ManagementLayout"`)
- **Incorrect:** `import { GrammarCard } from "@features/grammar/...";` inside `topic`;
  `src/core/layouts/TopicLearningLayout.tsx:3` (`@features/topic/...` from `core` → `DEV-02`, decision `D4`).
- **Related:** decision `D4` (core→features exception, PROPOSED — until accepted, new code must not copy it).
- **Enforcement:** review/manual — boundary lint (e.g. `import/no-restricted-paths`) NOT AVAILABLE.
- **Exceptions:** none in force. `DEV-02` is registered, not an exception.

### C-04 — Alias instead of `../../`
- **Strength:** MUST use `@features/…`, `@shared/…`, or `@/…` for imports that jump 2+ directories;
  MUST NOT add new `../../…` imports. Relative `./X` (same dir) and `../X` (one level) remain allowed.
- **Scope & rationale:** Aliases are declared in `vite.config.ts:13-16` + `tsconfig.app.json:26-30`;
  deep relative paths break when folders move (AGENTS.md, Imports section).
- **Correct:** `import { useFetch } from "@shared/hooks";` (`src/features/topic/hooks/useTopicDetail.ts:2`)
- **Incorrect:** `import { useFetch } from "../../shared/hooks";`
- **Related:** grandfathered ~100 existing matches (audit) — `no-restricted-imports` stays at
  **warn** and existing hits migrate gradually; recorded as a standing note, not a new deviation.
- **Enforcement:** automated (warn only) — `eslint.config.js:29-41` `no-restricted-imports`.
  Warnings do not fail `npm run lint`; treat any **new** warning as FAIL in review.
- **Exceptions:** touching a legacy file does not license adding new `../../` imports in it.

### C-05 — Erasable TypeScript only
- **Strength:** MUST use `import type { … }` for type-only imports (verbatimModuleSyntax);
  MUST NOT use enums, namespaces, or parameter properties (erasableSyntaxOnly); MUST NOT leave
  unused locals/parameters (noUnusedLocals/noUnusedParameters).
- **Scope & rationale:** `tsconfig.app.json:13,20-22`; build stays erasable/deterministic.
- **Correct:** `import type { TopicDetail } from "../types/topic-detail.types";` (`useTopicDetail.ts:3`)
- **Incorrect:** `enum Stage { … }`; `export * from "./types"` used only for types without `import type`.
- **Related:** none; no decision required.
- **Enforcement:** automated — `npm run build` fails on all four (`tsc -b`).
- **Exceptions:** none.

### C-06 — Data fetching via `useFetch`; no `fetch` in views
- **Strength:** Views MUST NOT call `fetch`/HTTP directly. Data loading MUST go through
  `useFetch((signal) => Promise<T>)` from `@shared/hooks`, called by a feature hook; raw HTTP MUST
  live in a service (`features/<d>/services/` or `shared/services/`).
- **Scope & rationale:** Abort handling, loading/error normalization in one place
  ([project-structure.md §8](../architecture/project-structure.md), `src/shared/hooks/useFetch.ts`).
- **Correct:** `src/features/topic/hooks/useTopicDetail.ts:124-138` (mock) and
  `src/features/Product/hooks/useProducts.ts:7-12` (real fetch with `signal`, still inside the hook).
- **Incorrect:** `fetch(...)` inside a `View.tsx`/component body.
- **Related:** [guides/api-integration.md](guides/api-integration.md).
- **Enforcement:** review/manual — no lint rule banning `fetch` (NOT AVAILABLE).
- **Exceptions:** none.

### C-07 — Reuse UI primitives before creating any
- **Strength:** MUST check `src/core/components/shadcn/` and `src/shared/components/` before adding
  a UI primitive; MUST NOT ship a one-off Button/Input/Select/Dialog/Card/Form.
- **Scope & rationale:** shadcn is installed selectively — only `button.tsx` + `dialog.tsx` exist
  (EXISTING); shared has `Card`, `Loading`, `EmptyState`, `ThinScroll`. Divergent primitives drift
  from the design system ([project-structure.md §6.4](../architecture/project-structure.md)).
- **Correct:** `VocabularyUpsertDialog.tsx:4-15` imports `Dialog…` + `Button` from `@/core/components/shadcn/…`.
- **Incorrect:** writing a new modal overlay or button component in a feature folder when the
  shadcn `Dialog`/`Button` fits. Related open issue: native `<select>` in 7 files (`DEV-09`, decision `D7` context).
- **Related:** decisions `D7` (form lib), `D8` (toast — today no toast primitive exists; adding one
  requires a decision first).
- **Enforcement:** review/manual — component-usage lint NOT AVAILABLE.
- **Exceptions:** genuinely new capability (e.g. toast) may add a primitive only after a PROPOSED
  decision is accepted.

### C-08 — No arbitrary values in NEW code
- **Strength:** New/edited UI MUST use design-system tokens and scales (no arbitrary
  `w-[…]`, `text-[…]`, `shadow-[…]`, colors, fonts, spacing, radius). Existing arbitrary values
  MUST NOT be spread further; touch-ups must not add new ones.
- **Scope & rationale:** [../design-system/tokens.yaml](../design-system/tokens.yaml) +
  [principles.md](../design-system/principles.md) are the APPROVED visual authority.
- **Correct:** token-backed classes as used across `features/topic/components/management/**`.
- **Incorrect:** `className="w-[940px]"` in a **new** element (existing use in
  `TopicItemContextEditorView.tsx` etc. is grandfathered — `DEV-01`).
- **Related:** `DEV-01` (audit recorded 54 hits for the `w-[` / `text-[` / `shadow-[` pattern;
  totals vary with the counting pattern — treat it as the audit's recorded figure, not a live metric).
- **Enforcement:** review/manual — Tailwind arbitrary-value lint NOT AVAILABLE.
- **Exceptions:** `DEV-01` is a grandfathered DEVIATION, not a licence; decisions `D1` (radius) may
  re-classify specific values.

### C-09 — No auth-bypass assumptions
- **Strength:** New code MUST NOT assume a route, API, or screen is protected by authentication or
  authorization. MUST NOT claim "guarded/permissioned" in docs until guard code exists.
- **Scope & rationale:** Guards are documented ([project-structure.md §7](../architecture/project-structure.md))
  but **0 implementations** exist; `/admin/*` routes are public (`DEV-06`). Assuming protection
  would ship false security.
- **Correct:** treat `/admin/topics` (`src/features/topic/routes.ts:84`) as reachable by anyone; label
  docs "guard: NOT IMPLEMENTED".
- **Incorrect:** "admins only" copy/UI hints implying server-side enforcement the FE does not provide.
- **Related:** decisions `D6` (auth scope), [guides/auth.md](guides/auth.md).
- **Enforcement:** review/manual — auth checks NOT AVAILABLE (no test runner/CI).
- **Exceptions:** none.

### C-10 — One entity definition per feature; surfaces split only in `components/` + `views/`
- **Strength:** A feature MUST define each entity/hook once (flat `types/`, `hooks/`); MUST NOT
  define parallel `learning/*` vs `management/*` types or hooks. Management symbols MUST be named
  by capability, never by role (`Admin*`).
- **Scope & rationale:** Duplication forces cross-surface imports
  ([project-structure.md §4.1 + §10](../architecture/project-structure.md)).
- **Correct:** single `Topic` in `features/topic/types/topic.types.ts`, used by both surfaces.
- **Incorrect:** name collision already on record — two different `TopicProgress` interfaces
  (`topic.types.ts:5` vs `topic-progress.types.ts:11`, `DEV-04`): do not add a third.
- **Related:** `DEV-04`; decision `D5` (intra-feature import style) touches the same area.
- **Enforcement:** review/manual (type-aware duplicate detection NOT AVAILABLE).
- **Exceptions:** `DEV-04` registered, left in place.

### C-11 — Docs-first loop & doc sync in the same change
- **Strength:** Any change to routes/props/state/rules MUST locate + read the relevant docs before
  coding, and MUST update the matching doc (plus summary/mock-status rows) **in the same change**.
- **Scope & rationale:** anti doc-rot rule, [../../AGENTS.md](../../AGENTS.md) (Working discipline);
  on drift the doc is assumed right until fixed immediately.
- **Correct:** flipping a learner hook to real API → update `docs/features/topic/learner/00-…` row + screen doc together.
- **Incorrect:** landing a route/prop change with "fix docs later"; the docs task itself follows this
  by confining changes to `docs/engineering/`.
- **Related:** [code-validation.md](code-validation.md) step 1; [traceability/README.md](traceability/README.md).
- **Enforcement:** review/manual — doc-sync automation NOT AVAILABLE.
- **Exceptions:** none.

### C-12 — State layering: server via `useFetch`, no store library
- **Strength:** Server state MUST flow through `useFetch` feature hooks; navigation state MUST use
  router APIs (`useParams`/`useNavigate`); component-local drafts MUST use `useState`. Adding a
  global store library (Redux/Zustand/Jotai/etc.) MUST NOT happen without an accepted decision.
- **Scope & rationale:** current code has exactly these layers (EXISTING — see
  [guides/state-management.md](guides/state-management.md)); adding a store is an architecture change.
- **Correct:** `TopicProgressContext` pattern for one shared provider-backed state
  (`src/features/topic/hooks/TopicProgressContext.tsx`).
- **Incorrect:** introducing `zustand` for topic progress "because context is verbose".
- **Related:** no store decision is registered yet (**UNKNOWN**/open); record one in
  [decisions/README.md](decisions/README.md) before proposing a library.
- **Enforcement:** review/manual — dependency policy lint NOT AVAILABLE.
- **Exceptions:** none.

### C-13 — Forms: controlled drafts, no form library by default
- **Strength:** Forms SHOULD follow the controlled-draft pattern (`draft`/`patch`/`isValid`/`showErrors`);
  adding a form library MUST NOT happen without an accepted decision (`D7`).
- **Scope & rationale:** pattern is established across create/update (upsert) + editor flows (EXISTING — see
  [guides/form-handling.md](guides/form-handling.md)); a library is a dependency + learning-cost change.
- **Correct:** `useTopicBasicInfoForm` (`draft`, `patch`, `isValid`) + view-owned `showErrors`.
- **Incorrect:** wiring `react-hook-form` into a new dialog before `D7` is decided.
- **Related:** decision `D7` (form lib, PROPOSED).
- **Enforcement:** review/manual.
- **Exceptions:** none until `D7` is accepted.

### C-14 — Placement: start in the feature; promote on real reuse
- **Strength:** New code MUST start inside its feature. Promotion to `shared/` MUST happen only at
  the second reuse with no owning domain; promotion to `core/` ONLY for whole-app shell concerns.
  Feature components MUST NOT live in `src/shared/components/` or `src/core/components/`.
- **Scope & rationale:** decision rule in [project-structure.md §3](../architecture/project-structure.md);
  premature promotion pollutes global dirs with domain UI.
- **Correct:** keep `TopicCard` in `features/topic/components/shared/` (feature-shared ≠ global shared).
- **Incorrect:** placing a topic-only card in `src/shared/components/`.
- **Related:** `DEV-02` shows the reverse violation (core reaching into a feature).
- **Enforcement:** review/manual.
- **Exceptions:** none.

### C-15 — No secrets in source; env handling frozen pending `D10`
- **Strength:** MUST NOT commit secrets or hardcode API keys in `src/` or tracked config; key
  material MUST stay in ignored files (`.env`, `.opencode/.stitch-key` are gitignored — EXISTING).
- **Scope & rationale:** `.gitignore`; `.env.example` documents `STITCH_API_KEY` only.
- **Correct:** reading future config via env indirection once a `VITE_*` scheme is decided (`D10`).
- **Incorrect:** pasting an API key into a component, constant, or doc (see
  [guides/environment.md](guides/environment.md) — key values are never reproduced in docs).
- **Related:** decisions `D10` (MCP header file-vs-env), `D11` (reading business docs needs no secrets).
- **Enforcement:** review/manual — secret scanning NOT AVAILABLE.
- **Exceptions:** none.

---

## Rule index

| ID | One-liner | Enforcement |
|---|---|---|
| C-01 | `"react-router"` only | automated (build) |
| C-02 | routes in `features/*/routes.ts` | review |
| C-03 | no cross-layer/cross-feature imports | review |
| C-04 | aliases, no new `../../` | automated warn + review |
| C-05 | `import type`, no enums, no dead code | automated (build) |
| C-06 | `useFetch` pattern, no `fetch` in views | review |
| C-07 | reuse shadcn/shared primitives | review |
| C-08 | no arbitrary values in new code | review |
| C-09 | no auth-bypass assumptions | review |
| C-10 | one entity definition per feature | review |
| C-11 | docs-first + same-change doc sync | review |
| C-12 | state layering, no store lib | review |
| C-13 | controlled-draft forms, no form lib | review |
| C-14 | placement/promotion rule | review |
| C-15 | no secrets in source | review |
