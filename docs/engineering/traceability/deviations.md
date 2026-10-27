# Deviation register — `DEV-01` … `DEV-11`

> **Purpose:** Record every known, intentional departure from the architecture/design/rules, with
> verifiable evidence, impact, and what "fixed" would mean — so nothing is silently re-broken or
> silently "cleaned up" outside a decision.
> **Scope:** Findings verified in `engolearn-frontend` (audit evidence). **This register changes no
> code: all eleven deviations remain in the codebase as-is** — no refactoring is part of the
> documentation task that created this file.
> **Owner:** Frontend engineering docs — append/adjust in the same change that introduces or
> resolves a deviation (`C-11`).
> **Status:** Entries = EXISTING findings (audit, verified where re-checked); the register format
> and triage = PROPOSED. No entry implies approval to copy the pattern.
> **Relationships:** [../implementation-constraints.md](../implementation-constraints.md) (the `C-xx`
> rules) · [../decisions/README.md](../decisions/README.md) (`Dn` stubs) ·
> [../technical-design.md](../technical-design.md) · [../code-validation.md](../code-validation.md) ·
> [../guides/api-integration.md](../guides/api-integration.md) ·
> [../guides/auth.md](../guides/auth.md) · [../guides/a11y-ui-quality.md](../guides/a11y-ui-quality.md)

**Rules of use**

1. Evidence = file + symbol/line, re-checkable. Counts quoted from the audit are labeled as such.
2. "Left in code intentionally" ≠ "allowed for new code": every entry names the `C-xx` rule that
   **new** code must obey regardless of this register.
3. Resolving an entry = code change + this register + any linked decision, in one change, then
   build+lint evidence ([../code-validation.md](../code-validation.md)).
4. No severity here is a test result — native topic API tests were added on2026-10-27, but do not verify these historical deviations; impact statements
   are reasoned risk, not measured failures.

---

## A. Immediate correctness / security

### DEV-06 — `/admin/*` routes are public (no guards)
- **Category:** immediate correctness/security
- **Rule violated:** `C-09` (auth-bypass assumptions) / guard placement documented in
  [project-structure §7](../../architecture/project-structure.md)
- **Evidence:** `src/features/topic/routes.ts:83-104` — `ROUTES.ADMIN_TOPICS` branch renders
  `ManagementLayout` + list/create/editor views with no guard wrapper; repo-wide search finds **0**
  guard/auth/session/token implementation (see [../guides/auth.md](../guides/auth.md) §1).
- **Impact / risk:** any visitor can open admin screens; UI must not imply otherwise; permission
  UX (menus/labels) is decorative until server + FE guards exist.
- **Blocking?** Blocks any claim of protected admin access (docs/UI copy). Does not block
  day-to-day feature development on mocks.
- **Remediation:** route/layout-wrapping guard per [../guides/auth.md](../guides/auth.md) §3 once
  `D6` + backend contract exist; server-side enforcement is out of FE scope.
- **Dependencies:** decision `D6`, backend auth contract (**UNKNOWN**).
- **Priority:** High (first security item to land with real auth).
- **Verification criteria:** new guard component wraps every `ROUTES.ADMIN_*` branch; manual check —
  protected route without session redirects (behavior TBD by `D6`); this entry flips to resolved
  with build+lint evidence.

### DEV-11 — `ContextBanner` interpolates URL into CSS `background-image` unsanitized
- **Category:** immediate correctness/security
- **Rule violated:** no dedicated `C-xx` (see security spot-check,
  [../code-validation.md](../code-validation.md) step 5; caution documented in
  [../guides/a11y-ui-quality.md](../guides/a11y-ui-quality.md) §5)
- **Evidence:** `src/features/topic/components/learning/ContextBanner.tsx:20` —
  `style={{ backgroundImage: \`url("${imageUrl}")\` }}`; consumed via
  `ContextHeroCard.tsx:46-47` (`hero.imageUrl`); `imageUrl` values currently originate from local
  mocks (`useTopicContext.ts:22`, `useTopicVocab.ts:84,136,187`).
- **Impact / risk:** a value containing `"`/`)` breaks out of the CSS string → style injection;
  latent today (mock-controlled values), becomes real when imageUrl comes from backend/user content.
- **Blocking?** Blocking **before** real content URLs flow (gated on content contract).
- **Remediation:** sanitize/allow-list the URL, or render via `<img>` element (also improves
  a11y/reduces the `role="img"` workaround); pick via the content contract work.
- **Dependencies:** backend content contract (**UNKNOWN**).
- **Priority:** High.
- **Verification criteria:** no raw `imageUrl` in a CSS string; crafted value
  (`x") ; *{background:url(evil)`-style) renders inert; build+lint green.

---

## B. Architectural

### DEV-02 — `core` imports a feature (`TopicLearningLayout`)
- **Category:** architectural
- **Rule violated:** `C-03`, `C-14` / [project-structure §6.3](../../architecture/project-structure.md)
  ("`core/` never imports `features/`")
- **Evidence:** `src/core/layouts/TopicLearningLayout.tsx:3` —
  `import { TopicProgressProvider } from "@features/topic/hooks/TopicProgressContext";`
  (layout mounts the topic provider above `LearningLayout`, lines 11-17).
- **Impact / risk:** inverts layer direction; `core` now depends on a specific domain — blocks
  reuse of the layout and couples app shell to topic internals.
- **Blocking?** No (works today).
- **Remediation:** let the feature own the composition (e.g. provider-wrapped layout exported from
  the feature's `routes.ts`, `C-02`) — requires restructuring who mounts the provider.
- **Dependencies:** decision `D4` (PROPOSED), route layout arrangement
  (`src/features/topic/routes.ts:28-34`), progress-state docs.
- **Priority:** Medium.
- **Verification criteria:** `src/core/` contains zero `@features/` imports (grep); provider still
  mounts exactly once per learner flow; build+lint green; docs (`D4`, technical-design §1) updated.

### DEV-03 — `API_URLS` contains only third-party placeholder hosts
- **Category:** architectural
- **Rule violated:** data-layer expectations of [project-structure §8](../../architecture/project-structure.md)
  (backend integration path; see [../guides/api-integration.md](../guides/api-integration.md) §2)
- **Evidence:** `src/shared/constants/api.constants.ts:1-4` — only
  `JSON_PLACEHOLDER` + `FAKE_STORE` demo hosts; consumed by legacy
  `useProducts.ts:8` / `usePost.ts:8`. No first-party API base URL exists anywhere.
- **Impact / risk:** the "shared constants" layer models demos, not the product backend — invites
  accidental calls to demo hosts and gives no home for the real base URL.
- **Blocking?** No for mock development; blocks real integration (with `DEV-07`).
- **Remediation:** replace placeholders with the real base-URL mechanism once decided (`D10`
  env scheme) and the contract lands; migrate/remove demo consumers per `D2`.
- **Dependencies:** decisions `D2`, `D10`; backend contract (**UNKNOWN**).
- **Priority:** Medium (becomes High at integration start).
- **Verification criteria:** `api.constants.ts` holds only first-party endpoints/base; demo hosts
  gone or isolated to legacy features slated by `D2`; matrix rows flip 🟡→✅ with doc updates.

### DEV-07 — `HttpService` exists but is unusable (empty `baseUrl`, 0 call sites)
- **Category:** architectural
- **Rule violated:** `C-06` ecosystem (services layer unusable — see
  [../guides/api-integration.md](../guides/api-integration.md) §3)
- **Evidence:** `src/shared/services/http.service.ts:11` (`constructor(baseUrl = "")`), `:75`
  (`new HttpService()` with default), `:16` (`new URL(endpoint, this.baseUrl)` — throws for relative
  endpoints with empty base); **0 call sites** in `src/` (only a doc-comment mention,
  `topic-progress.service.ts:11`).
- **Impact / risk:** dead-but-promising infrastructure; docs/comments suggest `httpService.patch`
  as the future path while the class cannot perform a single valid relative request.
- **Blocking?** Yes for any real HTTP claim through it (validation outcome BLOCKED).
- **Remediation:** wire base-URL config + error normalization + auth headers, or deliberately
  retire the class in favor of plain `fetch` in services — one of the two, decided.
- **Dependencies:** `D10` (base-URL scheme), backend contract (**UNKNOWN**), `D6` (auth headers).
- **Priority:** Medium now / High at integration start.
- **Verification criteria:** a real service call succeeds end-to-end with a configured base URL
  (or the class is removed with call-site grep = 0 and comments updated); build+lint green.

---

## C. Incremental maintainability

### DEV-01 — Arbitrary utility values in existing UI
- **Category:** incremental maintainability
- **Rule violated:** `C-08` / [project-structure §10](../../architecture/project-structure.md)
  (no arbitrary colors/fonts/spacing/radius outside [tokens.yaml](../../design-system/tokens.yaml))
- **Evidence:** audit figure: **54 hits** of the `w-[` / `text-[` / `shadow-[` pattern (count varies
  with the counting pattern — treat as the audit's recorded number, not a live metric). Verifiable
  examples: `src/features/topic/views/learning/TopicContextView.tsx` (`w-[1240px]`, `w-[840px]`,
  `w-[320px]`), `TopicManagementFilterBar.tsx` (`w-[280px]`), `TopicCard.tsx` /
  `UnitRowCard.tsx` (`shadow-[…]`), `grammar/components/StatusBadge.tsx` (`text-[10px]`).
- **Impact / risk:** bypasses the token system → inconsistent visuals and costly theme changes.
- **Blocking?** No.
- **Remediation:** gradual replacement with token/scale classes when touching those files anyway;
  never in unrelated changes; optional future lint (tooling **NOT AVAILABLE** today).
- **Dependencies:** `D1` (radius canonicalization) may re-classify some values.
- **Priority:** Low (grandfathered; explicitly tolerated).
- **Verification criteria:** per-file: classes map to token/scale values; no **new** arbitrary
  values introduced (review); count trends down when measured with the same pattern.

### DEV-04 — Two different types named `TopicProgress`
- **Category:** incremental maintainability
- **Rule violated:** `C-10` / [project-structure §10](../../architecture/project-structure.md)
  ("one entity defined twice")
- **Evidence:** `src/features/topic/types/topic.types.ts:5` — `TopicProgress { done, total, note }`
  (list-card progress) vs `src/features/topic/types/topic-progress.types.ts:11` —
  `TopicProgress { topic_item_id, topic_item_version, is_outdated, status, furthest_reached }`
  (learner progress contract).
- **Impact / risk:** name collision confuses imports/greps/reviewers; one of them will eventually
  shadow the other in `export *` aggregations.
- **Blocking?** No.
- **Remediation:** rename one (e.g. `TopicProgressSummary` for the list shape) across its users in
  one change; do not add a third definition meanwhile.
- **Dependencies:** users of `topic.types.ts` (`Topic.progress`), learner docs if the exported name
  appears in docs.
- **Priority:** Low/Medium.
- **Verification criteria:** unique type name per entity; grep for `TopicProgress` shows one
  interface per shape; build+lint green.

### DEV-08 — Unused `path` npm dependency
- **Category:** incremental maintainability
- **Rule violated:** no dedicated `C-xx` (dependency hygiene; tracked by decision `D3`)
- **Evidence:** `package.json:19` — `"path": "^0.12.7"` (browser shim package); the only `path`
  import is `vite.config.ts:3` (`import path from "path"`), a Node/Vite-config context (audit
  recorded the shim as unused).
- **Impact / risk:** unnecessary dependency surface; confusion about which `path` resolves.
- **Blocking?** No.
- **Remediation:** verify resolution context, remove the dependency if unused, run build+lint.
- **Dependencies:** decision `D3` (PROPOSED).
- **Priority:** Low.
- **Verification criteria:** `package.json` without the `path` entry; `npm run build` +
  `npm run lint` green; `D3` status updated.

---

## D. Cosmetic

### DEV-05 — `ProducsRoute` typo in the route export/usage
- **Category:** cosmetic
- **Rule violated:** `C-02` naming (`<Domain>Routes` convention,
  [project-structure §5](../../architecture/project-structure.md))
- **Evidence:** `src/router.tsx:4,11` — `import { ProducsRoute } from "@/features/Product/routes"`
  and `...ProducsRoute` in `appRoutes` (sic; source feature file exports the same misspelling).
- **Impact / risk:** inconsistent API name; confuses search and future renames.
- **Blocking?** No.
- **Remediation:** rename export + both usages atomically.
- **Dependencies:** `D2` (whether the Product feature is kept at all).
- **Priority:** Low.
- **Verification criteria:** `<Domain>Routes` naming holds in `router.tsx`; build+lint green.

### DEV-09 — Native `<select>` elements instead of a shared primitive
- **Category:** cosmetic
- **Rule violated:** `C-07` (reuse before creating; no shared Select exists to reuse — gap noted)
- **Evidence:** 7 files with `<select>` (verified, under
  `src/features/topic/components/management/`): `list/TopicManagementFilterBar.tsx` (3×),
  `list/TopicManagementPagination.tsx`, `upsert/TopicGeneralInfoCard.tsx`,
  `upsert/editor/TopicContextFormCard.tsx`, `upsert/editor/vocabulary/VocabularyUpsertDialog.tsx`,
  `upsert/editor/expressions/ExpressionUpsertDialog.tsx`,
  `upsert/editor/quiz/QuestionUpsertDialog.tsx`.
- **Impact / risk:** visual/behavioral drift from design-system components (styling, dark-mode
  behavior, sizing); inconsistent with shadcn usage elsewhere.
- **Blocking?** No.
- **Remediation:** decide a shared Select primitive (`D7` context) then migrate incrementally;
  until then **do not add more ad-hoc selects** (`C-07`).
- **Dependencies:** decision `D7`; shadcn install availability.
- **Priority:** Low (visual consistency).
- **Verification criteria:** native selects only where a decision sanctions them; any shared
  Select documented in [../guides/form-handling.md](../guides/form-handling.md) + design-system
  component doc updated.

### DEV-10 — Stale documentation/metadata lines
- **Category:** cosmetic
- **Rule violated:** `C-11` (docs-first sync)
- **Evidence (verified):**
  - [AGENTS.md:18](../../../AGENTS.md) — claims `src/features/topic/` "is currently an empty
    placeholder" (it is the largest, fully-built feature).
  - [README.md:123](README.md) — tech stack says "React Router DOM (v7)" (imports must be
    `"react-router"`, `C-01`).
  - [index.html:13](../../../index.html) — title `"Feature based arthiceture react 19"`
    (misspelling; also not the Engo Learn product name).
  - `docs/handout/` (`stitch-admin-topic-handoff.md`, `topic-item-context-url-note.md`) —
    historical handouts, superseded by `docs/features/**` but still present.
- **Impact / risk:** misleads new contributors/readers; conflicts with higher-precedence docs.
- **Blocking?** No.
- **Remediation:** correct the two stale lines + title; mark `docs/handout/` historical (header note)
  or archive — each with its owning doc updated in the same change.
- **Dependencies:** none. (Handout deprecation may need owner confirmation — **UNKNOWN**.)
- **Priority:** Low.
- **Verification criteria:** lines match verified repo state; no doc contradicts
  [project-structure](../../architecture/project-structure.md)/AGENTS on those points.

---

## Summary

| ID | Category | Rule / decision link | Blocking? | Priority |
|---|---|---|---|---|
| DEV-06 | immediate (security) | `C-09` / `D6` | blocks protection claims | High |
| DEV-11 | immediate (security) | code-validation §5 / content contract | before real URLs flow | High |
| DEV-02 | architectural | `C-03`, `C-14` / `D4` | no | Medium |
| DEV-03 | architectural | api-integration §2 / `D2`,`D10` | at integration | Medium |
| DEV-07 | architectural | `C-06` / api-integration §3 / `D10`,`D6` | blocks real HTTP via service | Medium→High |
| DEV-01 | maintainability | `C-08` / `D1` | no (grandfathered) | Low |
| DEV-04 | maintainability | `C-10` | no | Low/Medium |
| DEV-08 | maintainability | `D3` | no | Low |
| DEV-05 | cosmetic | `C-02` / `D2` | no | Low |
| DEV-09 | cosmetic | `C-07` / `D7` | no | Low |
| DEV-10 | cosmetic | `C-11` | no | Low |

**Statement:** all eleven deviations were left in place on purpose by the documentation task that
created this register. None is approved for copying into new code; each remains until its
remediation lands with linked decision/doc updates and build+lint evidence.
