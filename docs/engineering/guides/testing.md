# Guide — Testing & validation strategy

> **Purpose:** What verification actually exists today, the PROPOSED strategy layered on top of it,
> and what evidence a change must attach.
> **Scope:** All verification for `engolearn-frontend`. Nothing here may claim tooling the repo
> doesn't have.
> **Owner:** Frontend engineering docs — update the moment a runner/CI is introduced (`C-11`).
> **Status:** §1 EXISTING (verified). §2–§4 PROPOSED — not approved; nothing accepted.
> **Relationships:** [code-validation.md](../code-validation.md) (the executable procedure) ·
> [AGENTS.md](../../../AGENTS.md) (Commands) · [implementation-constraints.md](../implementation-constraints.md) ·
> [00-mock-api-status.md](../../features/topic/learner/00-mock-api-status.md) ·
> [../traceability/README.md](../traceability/README.md)

## 1. EXISTING — what is available today

| Capability | Status | Exact command / evidence |
|---|---|---|
| Type check + bundle | AVAILABLE | `npm run build` (= `tsc -b && vite build`, `package.json:8`) |
| Lint | AVAILABLE | `npm run lint` (= `eslint .`, ignores `dist` only) |
| Dev server (manual checks) | AVAILABLE | `npm run dev` (port 3000, `vite.config.ts:9-11`) |
| Unit/integration test runner | **NOT AVAILABLE** | no test script, no runner dependency in `package.json` |
| CI pipeline | **NOT AVAILABLE** | no `.github/workflows` or equivalent configured |
| Pre-commit hooks | **NOT AVAILABLE** | no husky/lint-staged/commitlint configured |
| Coverage tooling | **NOT AVAILABLE** | — |
| Automated auth/permission checks | **NOT AVAILABLE** | guards themselves are NOT IMPLEMENTED ([auth.md](auth.md)) |
| a11y/lighthouse automated audit | **NOT AVAILABLE** | manual spot-check only ([a11y-ui-quality.md](a11y-ui-quality.md)) |

The EXISTING project rule stands: **verify with build + lint** ([AGENTS.md](../../../AGENTS.md)
Commands; [project-structure.md §11.7](../../architecture/project-structure.md)).

### Playwright claim — UNKNOWN / unverified

`docs/features/topic/learner/00-mock-api-status.md` (row Progress) contains the phrase
"Forward-only đã verify Playwright". **No Playwright dependency, config, or test file exists in
this repo** (verified against `package.json` and repo files) — the claim is **UNKNOWN / unverified**
here. Do not repeat it as a fact; treat any Playwright evidence as external until a config lands.

## 2. PROPOSED — strategy (layered, cheapest first)

1. **Type + lint gate (existing, mandatory):** `npm run build` && `npm run lint`, zero errors and
   no **new** warnings (see `C-04` warn-policy in [code-validation.md](../code-validation.md) step 3).
2. **Manual scripted checks (existing practice, now made explicit):** the loading/empty/success/
   failure + navigation regression checklist in [code-validation.md](../code-validation.md) steps 5–6,
   executed in `npm run dev`.
3. **Future automated tests (PROPOSED direction, runner UNKNOWN):** when a runner is introduced it
   should cover, in priority order: (a) domain logic pure functions
   (`topic-progress.types.ts` `isAhead`/`deriveSidebarStates`, form `isValid` derivations),
   (b) hook behavior (`useFetch` abort/normalize), (c) critical flows end-to-end.
   **Choosing/adding a runner is not yet a registered decision** — record one in
   [../decisions/README.md](../decisions/README.md) before installing anything (`C-13`-style rule;
   no dependency sneaks in as "just a devDep" without a decision).

## 3. What validation evidence to attach

For every change (from [code-validation.md](../code-validation.md) "Evidence to record"):

- Verbatim outcome of `npm run build` and `npm run lint` (pass/fail + counts).
- Docs updated (paths + rows/sections) proving the docs-first loop.
- Mock-matrix rows affected, or "none".
- Manual checklist answers (security/a11y/regression) + explicitly what was NOT checked and why.
- Any **UNKNOWN** encountered (backend contract, touch-target measurement, Playwright claim…).

Evidence format: included in the change report to the orchestrator. There is **no automated place
to store evidence** (CI/test reports **NOT AVAILABLE**) — the report is the record.

## 4. Reporting outcomes

Use the three outcomes defined in [../code-validation.md](../code-validation.md): **PASS** /
**FAIL** / **BLOCKED**. BLOCKED inputs are typically: missing frozen API contract, unsettled
decision (`D1`–`D12`), or tooling marked **NOT AVAILABLE** — never claim PASS by substituting an
unavailable check with an assumed one.
