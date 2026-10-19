# Frontend Documentation & Engineering Audit — 2026-10

> **Type:** Audit report (read-only investigation). No code was modified; no existing
> document was changed, merged, or deleted. All dispositions below are **proposals**
> awaiting owner approval.
> **Scope:** `engolearn-frontend/` only (frontend structure, docs, agent config).
> **Method:** Documentation audit first (all docs + agent config + tooling config),
> then selective source validation of documented claims + new-issue scan.
> **Evidence classes used:** VERIFIED (file:line confirmed) · DOC-CLAIM (stated in a
> doc, not independently verified) · PROPOSED (recommendation, not approved) ·
> OPEN (needs owner decision).

---

## 1. Executive summary

**Overall state: documentation is unusually disciplined but partially stale; code is
largely conformant to its own structure rules but carries known, registered debt plus
several unregistered issues.**

Major risks, in priority order:

1. **The `docs/engineering/` system is self-labeled PROPOSED and invisible to the live
   agent workflow.** `docs/engineering/README.md:9-10` says every standard in the folder
   is a proposal, yet `implementation-constraints.md` (C-01…C-15) is written as
   normative MUST-rules, and `AGENTS.md` — the file agents actually load — never links
   to the folder. Result: agents either over-enforce unapproved rules or ignore them.
   This is the single biggest governance gap. *(VERIFIED)*
2. **Stale claims that contradict the files they cite.** Four documents
   (`AGENTS.md:42`, `project-structure.md:174`, decision `D12`,
   `guides/a11y-ui-quality.md:31-32`) assert `.opencode/UI_CONSTITUTION.md` "still says
   Inter" — the file already says "Hanken Grotesk only (not Inter)" at line 26. The
   conflict was fixed in content but the narrative was never cleaned up. *(VERIFIED)*
3. **`AGENTS.md:18` says `src/features/topic/` is "an empty placeholder"** — it is the
   largest feature in the repo (~130 files, full learner + management surfaces).
   *(VERIFIED — registered as DEV-10 but still live)*
4. **`README.md` still frames the repo as a generic boilerplate** ("React Feature-Based
   Architecture Boilerplate", "React Router DOM (v7)") while the actual dependency and
   all imports are `react-router`. Product identity is only stated in AGENTS.md /
   project-structure.md. *(VERIFIED)*
5. **Feature docs claim Playwright verification that cannot exist in this repo**
   (no Playwright dependency/config anywhere; `guides/testing.md:31-36` already flags
   this). The claims were never annotated as external evidence. *(VERIFIED)*
6. **Two backend JSON contracts exist inside feature docs** (quiz contract in
   `management/06`, TopicItemPart in `learner/04`) while the engineering system
   declares backend contracts UNKNOWN and has no single-writer home for contracts.
   *(VERIFIED conflict; ownership OPEN)*
7. **Known code debt is real but under-counted in docs:** arbitrary Tailwind values are
   ~138 (docs say ~54); native `<select>` count is 9 (docs say ~7); relative 2+ level
   imports are 123 (docs say ~100). Direction of all DEV findings is confirmed; the
   numbers drifted. *(VERIFIED)*
8. **Unregistered code issues found during validation:** duplicate `CefrLevel` union
   with drifting variants across `topic` and `grammar`; dead nav links to unregistered
   routes (`/admin`, `/review`, `/profile`…); mock data embedded in hooks; dead
   `useLoading` hook; 6× duplicated inline progress-bar markup; duplicated
   `simulateAudio` logic; a formatting bug (two statements on one line). *(VERIFIED —
   NEW, not in DEV register)*

**What is healthy and should be preserved:** feature-based structure authority
(`project-structure.md`), the design-system doc set, the deviations register
(DEV-01…11), the decisions register (D1–D12), the mock↔API matrix, and the per-screen
feature docs. The code respects the important boundaries: **zero cross-feature
imports, zero raw `fetch` in views, `useFetch` pattern holds everywhere.**

---

## 2. Documentation inventory

Statuses: `KEEP` / `REVISE` / `MERGE` / `ARCHIVE_OR_REMOVE` / `UNDECIDED`.
Nothing has been actioned.

### Root & config

| Path | Purpose (self-declared) | Disposition | Rationale |
|---|---|---|---|
| `AGENTS.md` | Agent operating manual; defers structure to project-structure.md | **REVISE** | Fix stale lines: topic "empty placeholder" (:18), UI_CONSTITUTION "Inter" (:42); add pointer to `docs/engineering/` once its status is settled |
| `README.md` | Boilerplate overview | **REVISE** | Reframe as Engo Learn product intro; fix "React Router DOM" (:123); keep Post/Product as legacy examples (ties to D2) |
| `components.json` | shadcn CLI config | **KEEP** | Accurate; matches code |
| `eslint.config.js` | Flat config; warn-only `no-restricted-imports` on `../../**` | **KEEP** | Matches C-04 warn policy; consider upgrading to error after cleanup (roadmap P3) |
| `vite.config.ts` | Port 3000, aliases | **KEEP** | Consistent with docs |
| `tsconfig*.json` | Strictness flags; aliases duplicated in 3 files (node config lacks `@shared`) | **KEEP** | Asymmetry harmless; optionally note alias triplication in one doc |
| `.env.example` | STITCH_API_KEY placeholder | **KEEP** | Pending D10 (key-delivery mechanism) |

### `.opencode/` / `.agents/` (agent config & skills)

| Path | Disposition | Rationale |
|---|---|---|
| `.opencode/opencode.json` | **KEEP** | Stitch MCP config; actual header is `{file:.stitch-key}` |
| `.opencode/UI_CONSTITUTION.md` | **REVISE (slim)** | Already says Hanken Grotesk; but restates tokens/principles/components nearly verbatim — strip copied values, keep pointer + short rules |
| `.opencode/skills/frontend-ui/SKILL.md` | **KEEP** | The pointer AGENTS.md mandates; slim overlap with AGENTS.md Engo Learn section |
| `.opencode/skills/frontend-design/SKILL.md` + `.agents/skills/frontend-design/SKILL.md` | **UNDECIDED (D9)** | Invites inventing palettes/fonts — conflicts with design-system mandate; two byte-identical copies double the risk. Keep at most one, scoped to non-EngoLearn work |
| `.opencode/skills/stitch-health/SKILL.md` | **REVISE** | Example uses `{env:STITCH_API_KEY}` but actual config is `{file:.stitch-key}` (D10) |
| `.opencode/skills/component-patterns/SKILL.md` | **ARCHIVE_OR_REMOVE** | Empty file (0 bytes), unreferenced |
| `.opencode/skills/design-system/SKILL.md` | **ARCHIVE_OR_REMOVE** | Empty file (0 bytes), unreferenced |
| `.opencode/skills/project-structure/SKILL.md` | **ARCHIVE_OR_REMOVE** | Empty file (0 bytes); authority lives in `docs/architecture/project-structure.md` |

### `docs/architecture/` + `docs/design-system/`

| Path | Disposition | Rationale |
|---|---|---|
| `docs/architecture/project-structure.md` | **KEEP** | Self-declared + mutually acknowledged structural SoT; accurate vs code (layouts, aliases, boundaries all verified). Fix only the stale "Inter" footnote (:174) |
| `docs/design-system/tokens.yaml` | **REVISE** | Visual authority, but incomplete: consumers cite `on-surface`, `outline-variant`, `surface-container-lowest`, `label-lg`, `text-error`, `*-fixed` — none defined in the file. Either expand tokens or stop citing undefined names |
| `docs/design-system/principles.md` | **KEEP** | Consistent with tokens; no conflicts |
| `docs/design-system/components.md` | **REVISE** | Radius naming says "lg / 16px" while AGENTS + feature docs say `rounded-2xl` (same value, different name — open D1); cites undefined tokens |
| `docs/design-system/patterns.md` | **KEEP** | Thin but non-contradictory; consistent with UI_CONSTITUTION §5 |

### `docs/engineering/` (the PROPOSED system)

| Path | Disposition | Rationale |
|---|---|---|
| `README.md` (index) | **REVISE** | Unique value: classification labels + precedence rules. Fix: circular "APPROVED" labeling (a PROPOSED index confers APPROVED on others); stale Inter narrative |
| `technical-design.md` | **MERGE** | §1–§4 restate project-structure §3/§4/§7/§8 despite claiming "link, not restate". Unique content = §5 backend-integration status table → move into `guides/api-integration.md`, then archive the file |
| `implementation-constraints.md` | **KEEP (normative layer)** | Highest-value engineering doc: C-01…C-15 with enforcement-channel map. Trim rationale prose that restates AGENTS/project-structure; needs an approval decision to become binding |
| `code-validation.md` | **KEEP** | Unique: 7-step procedure, evidence table, PASS/FAIL/BLOCKED taxonomy. De-duplicate evidence list with testing.md |
| `decisions/README.md` | **KEEP** | Entirely unique (D1–D12 + ADR format). Close D12 promptly — its premise ("UI_CONSTITUTION says Inter") is now false |
| `feature-design/_template.md` | **UNDECIDED** | 13-section template competes with the 8-section Vietnamese format actually used in `docs/features/topic/**`. Pick one canonical format (owner decision) |
| `guides/api-integration.md` | **KEEP** | Unique: HttpService NOT-USABLE analysis (verified in code), mock→real recipe |
| `guides/state-management.md` | **KEEP (REVISE one claim)** | Unique: TopicProgressContext caveat. **Correction needed:** persistence is a module-level in-memory `Map`, not sessionStorage (`TopicProgressContext.tsx:39`) |
| `guides/form-handling.md` | **KEEP** | Unique: controlled-draft + dialog upsert pattern |
| `guides/auth.md` | **KEEP** | Honest "0 guards exist" record; verified in code (no auth anywhere, `/admin/*` public) |
| `guides/testing.md` | **KEEP** | Correctly debunks Playwright claims; capability matrix accurate |
| `guides/a11y-ui-quality.md` | **REVISE** | Fix stale Inter footnote (:31-32); keep aria observation table + gap analysis |
| `guides/environment.md` | **KEEP** | Unique env/secrets inventory + 3-way MCP key conflict (D10) |
| `traceability/README.md` | **KEEP (watch scope)** | Unique single-writer/link-don't-copy model; most at risk of over-process for repo size — keep only if the folder is approved |
| `traceability/deviations.md` | **KEEP + EXTEND** | DEV-01…11 all verified in code (counts drifted, see §5). Append: stale Inter narrative, sessionStorage misstatement, and the NEW findings from §5 |

### `docs/features/topic/**` (living screen specs)

| Path | Disposition | Rationale |
|---|---|---|
| `learner/README.md` | **REVISE** | Broken partner link `docs/features/admin/01–04` (actual: `docs/features/topic/management/01–06`); flow note "sẽ sang Expressions" stale (05 exists, code navigates there — verified) |
| `learner/00-mock-api-status.md` | **KEEP + REVISE** | The single mock↔API matrix; annotate the Playwright claim as external/unverified |
| `learner/01–05` | **KEEP + light REVISE** | Living specs, mostly accurate vs code. Fix: Playwright claims (03, 04), radius citation wording (D1), 04's persistence description (Map, not sessionStorage) |
| `management/README.md` | **KEEP + light REVISE** | Duplicate "Layout vỡ mobile" row in §7 debug map |
| `management/01–06` | **KEEP + light REVISE** | Living specs. 03 still references deleted `TopicItemSectionPlaceholderView` (verified absent in src). 06 embeds a user-supplied JSON quiz contract — needs a contract-ownership decision (OPEN) |

### `docs/handout/`

| Path | Disposition | Rationale |
|---|---|---|
| `stitch-admin-topic-handoff.md` | **ARCHIVE_OR_REMOVE** | Superseded by `docs/features/topic/management/**`; actively misleading (names `EngoAppLayout` which never existed; claims `{env:STITCH_API_KEY}` was the correct config — actual is `{file:.stitch-key}`) |
| `topic-item-context-url-note.md` | **ARCHIVE_OR_REMOVE** | URL decision long settled in learner docs; historical only |

---

## 3. Conflict & duplication register

| # | Conflict | Side A | Side B | Status |
|---|---|---|---|---|
| K1 | Font family narrative | `UI_CONSTITUTION.md:26` = "Hanken Grotesk only (not Inter)" | `AGENTS.md:42`, `project-structure.md:174`, `D12`, `a11y guide:31-32` all claim it "still says Inter" | **Resolved in content, stale in narrative** — 4 docs + 1 decision cite a line that no longer exists |
| K2 | Product identity | README = generic boilerplate, "React Router DOM (v7)" | AGENTS/project-structure = Engo Learn product; dep + imports = `react-router` | Live (DEV-10/D2) |
| K3 | Learning Card radius name | AGENTS + feature docs: `rounded-2xl` | `components.md`: "lg / 16px" (`tokens.yaml` lg = 1rem = 2xl — values equal, names differ) | Open decision D1 |
| K4 | Playwright verification | learner 00/03/04 claim Playwright-verified behaviors | `testing.md:31-36`: no Playwright in repo (verified: no dep/config) | Live; fix = annotate as external evidence |
| K5 | Authority circularity | engineering README (PROPOSED) labels project-structure/design-system "APPROVED" | those files don't self-label APPROVED | Governance gap; fix via explicit approval decision |
| K6 | Two docs-first formulations | AGENTS 4-step loop | C-11 + traceability chain (different granularity) | Not a hard contradiction; unify wording when approving engineering folder |
| K7 | UI_CONSTITUTION duplication | Restates tokens/principles/components nearly verbatim | design-system docs are the leaf authority | Fix by slimming UI_CONSTITUTION |
| K8 | frontend-design skill scope | Invites inventing palettes/fonts | AGENTS + frontend-ui forbid arbitrary styling for Engo Learn | Open D9; duplicated in `.opencode` + `.agents` |
| K9 | Stitch MCP key delivery | `opencode.json`: `{file:.stitch-key}` | stitch-health skill + handout: `{env:STITCH_API_KEY}`; `.env.example` documents env var | Open D10 |
| K10 | Backend contract existence | engineering docs: contracts UNKNOWN, no frozen contract anywhere | `management/06` embeds full quiz JSON contract; `learner/04` embeds TopicItemPart JSON | **Ownership OPEN** — contracts exist but have no sanctioned home |
| K11 | Topic feature maturity | AGENTS.md:18 "empty placeholder" | ~130-file feature, fully built | Live (DEV-10) |
| K12 | Admin partner docs path | `learner/README.md:4` → `docs/features/admin/01–04` | actual: `docs/features/topic/management/01–06` | Broken link |
| K13 | Vocab end-of-list navigation | learner README + 03: "tạm về /topics (sẽ sang Expressions)" | code navigates to expressions (`TopicVocabView.tsx:140-147`); 05 exists | Doc-doc drift; code is correct |
| K14 | Placeholder editor view | `management/03` says `TopicItemSectionPlaceholderView` catches 3 tabs | `management/06` says deleted; code: symbol not found | 03 stale |
| K15 | "Reuse Select/Input/Form" | C-07 / UI_CONSTITUTION / frontend-ui say reuse them | `src/core/components/shadcn/` contains only `button.tsx` + `dialog.tsx` | Instruction references nonexistent primitives; constraints admit gap, AGENTS wording is unconditional |
| K16 | Token vocabulary | components.md/UI_CONSTITUTION/feature docs cite `on-surface`, `outline-variant`, `surface-container-lowest`, `label-lg`, `text-error`, `*-fixed` | `tokens.yaml` defines none of these | Design-system SoT incomplete vs its consumers |
| K17 | Engineering folder status vs usage | Folder = PROPOSED, none of C-xx/Dn accepted | Constraints written as imperative MUSTs; AGENTS never links the folder | Governance gap (see §1.1) |
| K18 | Dual feature-doc formats | `feature-design/_template.md` (13 sections) | `docs/features/topic/**` (8 sections, actually in use) | No rule which wins; UNDECIDED |

**Duplication hotspots (restatement to trim):** `technical-design.md` §1–§4 ≈
project-structure §3/§4/§7/§8; constraints C-01…C-06 rationale ≈ AGENTS +
project-structure; UI_CONSTITUTION ≈ design-system docs; frontend-ui skill ≈ AGENTS
Engo Learn section; engineering README precedence ≈ AGENTS/project-structure
self-declared wins.

---

## 4. Intended architecture summary

What the documentation **establishes** (all VERIFIED present and mutually consistent):

- **Stack:** React 19 + Vite 6 + TS ~5.8 + React Router v7 (`react-router` package) +
  Tailwind v4 + shadcn (new-york/stone). Matches `package.json`, `vite.config.ts`,
  `tsconfig.app.json`.
- **Structure authority:** `docs/architecture/project-structure.md` — feature-based by
  business domain (never by role); canonical feature shape `components/ hooks/ types/
  views/ routes.ts`; surface split (`shared|learning|management`) only inside
  `components/`+`views/`; promotion rule (feature → shared on 2nd reuse → core for
  app-shell); boundary rules (no cross-feature imports; shared never imports features;
  core never imports features/shared — with one registered exception DEV-02).
- **Routing:** per-feature `routes.ts` exporting `<Domain>Routes`; `router.tsx`
  aggregates only; guards wrap routes (none exist yet — DEV-06).
- **Data:** `useFetch((signal) => Promise<T>)` from `@shared/hooks`; services layer in
  `shared/services` (HttpService dead — DEV-07); mock data currently embedded in
  feature hooks (mock↔API matrix is the wiring plan).
- **Visuals:** `docs/design-system/*` = authority (primary `#006565`, Hanken Grotesk,
  radius/spacing scales, 4 page patterns); token discipline C-08.
- **Workflow:** AGENTS.md 4-step docs-first loop; same-change doc updates; tie-break
  "assume the doc is wrong" on drift.
- **Known debt:** DEV-01…11 register; open decisions D1–D12.

What the documentation **cannot establish** (OPEN):

- Whether `docs/engineering/` is binding (PROPOSED, unlinked from AGENTS.md).
- Which feature-doc format is canonical (template vs in-use package format).
- Sanctioned home for backend contracts (quiz JSON, TopicItemPart JSON).
- Whether Playwright verification happened externally.
- Resolution of D1–D12 (none accepted).

---

## 5. Implementation discrepancy matrix

Classification: **DocDef** = documentation defect · **ImplDef** = implementation
defect · **MissingRule** = missing engineering rule · **Decision** = architectural
decision required · **Exception** = intentional, registered · **Uncertain** = needs
clarification.

### 5.1 Registered deviations (DEV-01…11) — verification results

| ID | Area | Documented claim | Code evidence | Verdict | Class | Recommended action |
|---|---|---|---|---|---|---|
| DEV-01 | Token discipline | ~54 arbitrary Tailwind values | **~138** genuine arbitrary values in ~62 files (top: `size-[18px]` ×56, `w-[940px]` ×9); 0 arbitrary hex | CONFIRMED (count drifted) | ImplDef | Fix counts in deviations.md; batch-normalize to tokens in roadmap P2 |
| DEV-02 | Boundaries | core→features import exception | `core/layouts/TopicLearningLayout.tsx:3` imports `TopicProgressProvider` from `@features/topic` | CONFIRMED | Exception | Keep registered; revisit if provider moves to a route-level wrapper |
| DEV-03 | API constants | Placeholder URLs | `api.constants.ts`: JSONPlaceholder + FakeStore (third-party mocks, not example.com) | CONFIRMED (nature clarified) | ImplDef | Remove with boilerplate features (D2) |
| DEV-04 | Types | Dual `TopicProgress` types | `topic.types.ts:5-9` (`done/total/note`) vs `topic-progress.types.ts:11-17` (backend mirror) — disjoint shapes, same name | CONFIRMED | ImplDef | Rename UI one (e.g. `TopicProgressSummary`) when touching progress code |
| DEV-05 | Naming | `ProducsRoute` typo | `Product/routes.ts:4`, `router.tsx:4,11` | CONFIRMED | ImplDef | Trivial rename (P2) |
| DEV-06 | Auth | No guards; `/admin/*` public | 0 auth symbols in src | CONFIRMED | Exception (until backend) | Keep auth.md honesty record |
| DEV-07 | Dead code | HttpService unusable | baseUrl default `""` → `new URL(endpoint, "")` throws; 0 call sites | CONFIRMED | ImplDef | Delete or make usable when real API lands (D-decision) |
| DEV-08 | Deps | `path` npm dep unused | 0 imports in src; only Node builtin in `vite.config.ts:3` | CONFIRMED | ImplDef | `npm rm path` (P2) |
| DEV-09 | UI primitives | ~7 native selects | **9** `<select>` in 8 files | CONFIRMED (count drifted) | ImplDef | Add shadcn Select, migrate (P2/P3) |
| DEV-11 | Security | ContextBanner CSS URL | `ContextBanner.tsx:20` — `backgroundImage: url("${imageUrl}")` unvalidated | CONFIRMED | ImplDef | Validate/encode URL or use `<img>` (P2) |
| DEV-10 | Stale docs | AGENTS topic-placeholder, README router, index.html title | All confirmed; `index.html:13` "Feature based arthiceture react 19" | CONFIRMED | DocDef | P0 doc fixes |

### 5.2 Refuted / corrected doc claims

| ID | Documented claim | Actual evidence | Class | Action |
|---|---|---|---|---|
| R1 | AGENTS.md:18 topic = "empty placeholder" | ~130-file feature, full learner+management | DocDef | Fix AGENTS.md (P0) |
| R2 | 4 docs + D12: UI_CONSTITUTION "still says Inter" | File says Hanken-only at :26 | DocDef | Fix 4 docs + close D12 (P0) |
| R3 | state-management guide: progress persisted via sessionStorage | `TopicProgressContext.tsx:39` — module-level in-memory `Map` (lost on reload) | DocDef | Correct guide + learner/04 (P0) |
| R4 | learner 00/03/04: "verify Playwright" | No Playwright dep/config in repo | DocDef | Annotate as external/unverified (P0) |
| R5 | learner/README: partner docs at `docs/features/admin/01–04` | Path doesn't exist | DocDef | Fix link (P0) |
| R6 | management/03: placeholder view catches 3 tabs | Symbol absent from src (only `TopicPracticePlaceholderView` exists) | DocDef | Update 03 (P0) |
| R7 | AGENTS/C-07: "reuse Select/Input/Form" | Only `button.tsx` + `dialog.tsx` exist in shadcn dir | MissingRule | Add rule wording "when the primitive exists; otherwise follow DEV-09 plan" (P1) |
| R8 | deviations.md counts (54 / ~7 / ~100) | 138 / 9 / 123 | DocDef | Update register (P0) |

### 5.3 NEW findings (not in any register)

| ID | Area | Evidence | Severity | Class | Recommended action |
|---|---|---|---|---|---|
| N1 | Duplicate `CefrLevel` union, drifting variants | `grammar/types/grammar.types.ts:1` (`A1|A2|B1`) vs `topic/types/topic.types.ts:3` (`A1|A2|B1|B2`) | Medium — cross-feature collision when sharing is introduced | ImplDef + MissingRule | Decide: shared `@shared/types` CEFR scale vs per-domain; register in decisions |
| N2 | Dead nav links | `core/layouts/components/managementNav.ts` → `/admin`, `/admin/grammar`, `/admin/media`, `/admin/settings`; `learningNav.ts` → `/review`, `/profile` — none registered | Low (404 at runtime) | ImplDef | Point nav at existing routes or hide entries until built |
| N3 | Mock data embedded in hooks | `useTopicManagement.ts`, `useTopicDetail.ts`, `useTopicVocab.ts`, `useTopicExpressions.ts`, `TopicProgressContext.tsx` (`MOCK_PROGRESS` comment/data drift: claims EXERCISES reached vs "in progress" comment) | Medium — blocks clean mock→real swap | ImplDef | Extract mocks to `features/topic/mocks/` or services when wiring real API (ties to api-integration recipe) |
| N4 | Formatting bug | `useTopicVocab.ts:241` — two statements on one line | Low | ImplDef | Fix line; consider adding Prettier (P3 decision) |
| N5 | Boilerplate leftovers | `app.constants.ts:1` `APP_NAME = "Feature-Based React"` (rendered in Header); commented import in `main.tsx:4`; `WelcomeView` template content | Low | ImplDef | Clean with D2 (legacy features) |
| N6 | Dead export | `shared/hooks/useLoading.ts` — 0 consumers | Low | ImplDef | Remove or adopt |
| N7 | Duplicated progress-bar markup | 6 inline `width:%` bars across topic + grammar | Medium (drift risk) | ImplDef + MissingRule | Extract shared `ProgressBar` (promotion rule: 2nd reuse already exceeded) |
| N8 | Duplicated mock-audio logic | `simulateAudio` 900ms timer duplicated in `TopicVocabView.tsx:171-190` + `TopicExpressionsView.tsx:124-135` | Low | ImplDef | Extract `useMockAudio` hook |
| N9 | Mixed import styles in one file | `TopicItemContextEditorView.tsx:6-12` mixes `../../` and `@features/` for the same feature | Low | ImplDef | Normalize during next touch (C-04 cleanup) |
| N10 | Locked stage still navigable | `TopicVocabView.tsx:157-163` — sidebar practice nav works while stage shows locked ("Navigation itself is never blocked") | Uncertain — may be intentional UX | Uncertain | Confirm intended behavior with owner; document in learner/04 |
| N11 | No env-driven API base URL | 0 `import.meta.env` usages in src despite `.env` files | Info | MissingRule | Covered by environment.md + D10; resolve when real API lands |
| N12 | `console.info` debug leftover | `topic-progress.service.ts:18` | Low | ImplDef | Remove with mock→real swap |

**Positive conformance (verified):** zero cross-feature imports; zero raw `fetch` in
views/components (only the two documented `useFetch` callbacks + dead HttpService);
all `useFetch` consumers render Loading/EmptyState/error states; `useSearchParams`
count = 0 as documented; relative imports capped at 3 levels (123 total, warn-only);
layouts exist as documented; shared components/hooks exist as documented (+ unclaimed
`ThinScroll`).

---

## 6. Recommended engineering standards (minimum set)

Each standard: problem → rule → scope/exceptions → verification → authoritative home.

| # | Standard | Problem it solves | Rule | Scope / exceptions | Verification | Authoritative home |
|---|---|---|---|---|---|---|
| S1 | Structure & boundaries | Feature sprawl, cross-feature coupling | Feature-based by domain; canonical shape; boundary rules; promotion rule | Whole `src/`; DEV-02 registered exception | `tsc -b` + import lint + review | `docs/architecture/project-structure.md` (existing, KEEP) |
| S2 | Agent workflow | Inconsistent change process | 4-step docs-first loop; same-change doc updates; tie-break rule | All changes | Review checklist | `AGENTS.md` (existing, REVISE) |
| S3 | Visual token discipline | Arbitrary styling drift | No arbitrary colors/fonts/spacing/radius in **new** code; reuse primitives | Legacy code grandfathered (DEV-01); primitives limited to button/dialog until shadcn Select lands | Review + optional lint rule later | `docs/design-system/*` + C-07/C-08 |
| S4 | Normative constraints | Rules without IDs can't be cited in review | C-01…C-15 with normative strength + enforcement channel | All `src/` changes | Build/lint (automated subset) + review (rest) | `docs/engineering/implementation-constraints.md` — **requires approval decision to bind** |
| S5 | Change validation | "Compiles = done" trap | build + lint + contract-compat vs mock matrix + evidence PASS/FAIL/BLOCKED | Every change | Self-reported evidence table | `docs/engineering/code-validation.md` |
| S6 | Data-fetch pattern | Ad-hoc fetching | `useFetch` only; services layer; no raw fetch in views | Boilerplate features exempt until removed (D2) | Grep + review | project-structure §8 + `guides/api-integration.md` |
| S7 | State layering | Store-lib sprawl | Server=useFetch, URL=params, local=drafts, global=Context only when lifted; no store lib | C-12 | Review | `guides/state-management.md` |
| S8 | Honest status records | Silent rot | Deviations register (DEV-xx) + decisions register (Dn) + "NOT AVAILABLE/NOT IMPLEMENTED" markers | Engineering docs | Register review each change | `traceability/deviations.md` + `decisions/README.md` |
| S9 | Contract single-writer | Contracts scattered in feature docs | Backend contracts live in ONE sanctioned location; feature docs link, never embed | Blocked on OPEN question (contract home) | Review | To be decided (see §9) |
| S10 | Testing honesty | Phantom verification claims | Never claim test-runner verification; external evidence must be labeled external | Until a runner is adopted | Review | `guides/testing.md` |

**Deliberately NOT introduced** (no concrete need at this scale): separate
`architecture.md`/`system-design.md` (project-structure.md already owns this),
CI pipeline, test runner, pre-commit hooks, store library, form library — each is
already tracked as NOT AVAILABLE or an open decision; revisit only when a concrete
trigger appears (e.g. team growth, first real API integration).

---

## 7. Proposed documentation structure (target state)

```text
AGENTS.md                        # workflow authority (commands, docs-first loop, pointers) — REVISE
README.md                        # product intro + getting started + link to structure — REVISE
docs/
├── architecture/
│   └── project-structure.md     # STRUCTURE authority — KEEP (fix Inter footnote)
├── design-system/               # VISUAL authority — KEEP
│   ├── tokens.yaml              #   REVISE: expand or stop citing undefined tokens
│   ├── principles.md            #   KEEP
│   ├── components.md            #   REVISE: radius naming (D1), token refs
│   └── patterns.md              #   KEEP
├── engineering/                 # ENGINEERING authority — needs approval decision (§9 Q1)
│   ├── README.md                #   index + precedence rules — REVISE
│   ├── implementation-constraints.md  # normative C-01…C-15 — KEEP (trim restated prose)
│   ├── code-validation.md       #   KEEP
│   ├── decisions/README.md      #   KEEP (close D12; settle D1/D2/D9/D10)
│   ├── guides/                  #   api-integration (+absorb technical-design §5),
│   │                            #   state-management (fix persistence claim),
│   │                            #   form-handling, auth, testing, environment,
│   │                            #   a11y-ui-quality (fix Inter footnote)
│   ├── traceability/
│   │   ├── README.md            #   KEEP if folder approved
│   │   └── deviations.md        #   KEEP + extend (R1–R8, N1–N12)
│   ├── feature-design/_template.md  # UNDECIDED (§9 Q3)
│   └── docs-audit-2026-10.md    #   this report (supersede or archive after remediation)
├── features/topic/              # living screen specs — KEEP + light REVISE (P0 fixes)
│   ├── learner/  (00–05)
│   └── management/ (README, 01–06)
└── handout/                     # ARCHIVE_OR_REMOVE both files (superseded, misleading)
.opencode/
├── UI_CONSTITUTION.md           # slim to pointer + short rules (design-system wins)
├── opencode.json                # KEEP (D10 settles key mechanism)
└── skills/
    ├── frontend-ui/             # KEEP (slim overlap)
    ├── stitch-health/           # REVISE example to {file:.stitch-key}
    ├── frontend-design/         # UNDECIDED (D9) — keep ≤1 copy, scoped
    ├── component-patterns/      # REMOVE (empty)
    ├── design-system/           # REMOVE (empty)
    └── project-structure/       # REMOVE (empty)
.agents/skills/frontend-design/  # REMOVE if D9 keeps the .opencode copy
```

**Ownership summary (one authority per topic):** structure → project-structure.md ·
visuals → design-system/* · workflow → AGENTS.md · normative rules →
implementation-constraints.md · verification → code-validation.md · debt →
deviations.md · decisions → decisions/README.md · mock/API status →
learner/00-mock-api-status.md · per-screen specs → docs/features/topic/**.

**Rules better enforced by tooling than prose (later, P3):** upgrade
`no-restricted-imports` warn→error after the 123 relative imports are cleaned;
optional `no-restricted-syntax` for arbitrary Tailwind values in new files; Prettier
if adopted; boundary check via `eslint-plugin-import` rules if cross-feature imports
ever appear.

---

## 8. Refactoring roadmap (prioritized, pending approval)

**P0 — Documentation truth fixes (docs-only, no code)**
1. Fix stale claims: AGENTS.md:18 + :42; project-structure.md:174; a11y guide :31-32;
   close/rewrite D12 evidence line.
2. Fix learner package: admin partner link, Playwright annotations, 04 persistence
   description, 03 placeholder reference, README flow note.
3. Update deviations.md: corrected counts (138/9/123) + append R3, N1–N12.
4. Fix state-management guide persistence claim; management/README duplicate row.
5. Reframe README.md (product intro, `react-router`); fix `index.html` title typo
   *(title is code-adjacent — one-line change, flag for approval)*.

**Acceptance:** no document asserts a claim contradicted by code (spot-check list =
R1–R8 all resolved); every conflict in §3 marked resolved or has an open decision ID.

**P1 — Governance decisions (owner approvals, then small doc edits)**
1. Approve or archive `docs/engineering/` as a set; if approved, link it from
   AGENTS.md and flip statuses PROPOSED→ACCEPTED (constraints become binding).
2. Settle D1 (radius naming), D2 (legacy features fate), D9 (frontend-design skill),
   D10 (MCP key mechanism).
3. Decide contract home (§9 Q2) and feature-doc format (§9 Q3).
4. Execute dispositions: archive handouts, remove empty skills, slim
   UI_CONSTITUTION, fix stitch-health example.

**Acceptance:** AGENTS.md links every authority; zero UNDECIDED items left in §2;
D1/D2/D9/D10/D12 closed with recorded outcomes.

**P2 — Code debt aligned to approved standards (code changes, per-fix approval)**
1. Trivial: DEV-05 rename, DEV-08 `npm rm path`, N4 formatting, N6 remove
   `useLoading`, N12 console.info, N5 boilerplate leftovers (with D2).
2. DEV-11 ContextBanner URL handling; N2 dead nav links.
3. DEV-04 rename UI `TopicProgress`; N1 CefrLevel decision + consolidation.
4. DEV-01 batch token normalization (~138 values → tokens) — largest item, do
   per-surface.
5. DEV-09 shadcn Select + migrate 9 native selects; N7 shared ProgressBar; N8
   useMockAudio; N3 extract mocks (coordinate with real-API wiring order from
   learner/00 matrix).

**Acceptance:** `npm run build` + `npm run lint` clean after each item; deviations.md
rows closed with dates; no new arbitrary values in touched files.

**P3 — Tooling hardening (optional, needs owner trigger)**
1. `no-restricted-imports` warn→error once relative imports < ~20.
2. Prettier + pre-commit if team wants format enforcement.
3. Test runner adoption decision (only when a real API integration lands).

**Implementation order dependency:** P0 → P1 → P2 (P2 items touching progress/types
depend on P1 contract decisions; P2 token normalization depends on D1). P3
independent.

---

## 9. Open questions (require project-owner approval)

| # | Question | Why it blocks | Options |
|---|---|---|---|
| Q1 | Is `docs/engineering/` approved as the binding engineering standard set (linked from AGENTS.md), or archived as reference-only? | Determines whether C-01…C-15 bind agents and whether the folder is maintained | (a) Approve + link; (b) approve slimmed subset; (c) archive |
| Q2 | Where do backend contracts live? Quiz JSON (management/06) and TopicItemPart (learner/04) exist but have no sanctioned home; monorepo `docs/` may own them | S9 (contract single-writer) cannot be enforced without a home | (a) monorepo shared docs; (b) a `docs/contracts/` folder in FE; (c) keep in feature docs with explicit provenance notes |
| Q3 | Which feature-doc format is canonical: the 13-section `feature-design/_template.md` or the 8-section format in use under `docs/features/topic/**`? | Dual living-spec formats (K18) | (a) keep in-use format, archive template; (b) migrate to template |
| Q4 | Playwright verification claims in learner docs — external machine evidence (label as external) or abandoned claim (delete)? | Testing honesty (S10) | (a) label external; (b) remove claims |
| Q5 | D9: keep `.opencode/skills/frontend-design`, `.agents` copy, or both/neither, and is it allowed for Engo Learn UI? | Skill conflicts with design-system mandate | (a) keep one copy, non-EngoLearn only; (b) remove both |
| Q6 | D2: what happens to legacy `Post`/`Product`/`Welcome` features and their mock API constants? | Blocks DEV-03/N5 cleanup and README reframe | (a) delete now; (b) keep as reference examples |
| Q7 | N10: is navigating to a locked stage from the sidebar intentional UX? | Behavior ambiguity in learner flow | (a) intentional — document; (b) bug — fix |
| Q8 | Should `index.html` title typo (DEV-10) be fixed in the P0 docs pass (one-line code change) or deferred to P2? | Scope boundary of the docs-only pass | (a) fix now; (b) defer |

---

## 10. Verification appendix (evidence index)

- Doc inventory + conflict register: derived from full read of all files listed in §2
  (paths + line cites inline).
- Source validation: 24 documented claims checked (verdicts in §5.1–5.2), 12 new
  findings (§5.3), positive conformance list (§5.3 end).
- Key code evidence files: `src/router.tsx`, `src/features/Product/routes.ts`,
  `src/core/layouts/TopicLearningLayout.tsx`, `src/shared/services/http.service.ts`,
  `src/shared/constants/api.constants.ts`, `src/features/topic/types/topic*.types.ts`,
  `src/features/topic/hooks/TopicProgressContext.tsx`,
  `src/features/topic/views/learning/TopicVocabView.tsx`,
  `src/features/topic/components/learning/ContextBanner.tsx`,
  `src/core/layouts/components/{managementNav,learningNav}.ts`,
  `src/core/components/shadcn/` (button, dialog only), `index.html`, `package.json`.
