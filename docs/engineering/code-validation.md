# Code validation — how to verify a change

> **Purpose:** The minimum verification every change in `engolearn-frontend` must pass, the exact
> commands, and how evidence is recorded (PASS / FAIL / BLOCKED).
> **Scope:** All code changes under `src/` + their paired doc changes. Doc-only changes skip steps
> marked "(code)" but still run build+lint (docs never break them, the run proves hygiene).
> **Owner:** The author of the change (frontend-coder) — evidence reported to the orchestrator.
> **Status:** PROPOSED (procedure). Command facts are EXISTING from [../../AGENTS.md](../../AGENTS.md).
> **Relationships:** [../../AGENTS.md](../../AGENTS.md) (docs-first loop) ·
> [implementation-constraints.md](implementation-constraints.md) (what to check) ·
> [../features/topic/learner/00-mock-api-status.md](../features/topic/learner/00-mock-api-status.md) ·
> [traceability/README.md](traceability/README.md) · [traceability/deviations.md](traceability/deviations.md)

**Tooling status:** test runner **NOT AVAILABLE** · CI **NOT AVAILABLE** · pre-commit **NOT AVAILABLE** ·
automated auth/security checks **NOT AVAILABLE** · a11y linter **NOT AVAILABLE**.
Validation = the steps below, nothing else (EXISTING rule in AGENTS.md: verify with build + lint).

## Step 1 — Traceability check (docs-first)

- Name the change: touched routes? props? state shape? mock↔real status? rules?
- Confirm the governing docs were read BEFORE coding:
  structure → [../architecture/project-structure.md](../architecture/project-structure.md);
  visuals → [../design-system/](../design-system/tokens.yaml); feature package → `../features/<domain>/`;
  constraints → [implementation-constraints.md](implementation-constraints.md).
- Identify downstream trace links to update ([traceability/README.md](traceability/README.md)):
  feature doc rows, `00-mock-api-status.md` rows, deviations, decisions if the change settles one.
- **Fail condition:** a route/prop/state change with no doc identified → BLOCKED until docs located
  (AGENTS.md step 1-2).

## Step 2 — Type check + build (code)

```bash
npm run build        # = tsc -b && vite build
```

- Type errors fail the build (EXISTING, `package.json:8`); fix before anything else.
- Also proves `import type` / no-enum / no-unused rules (`C-05`) and that `react-router-dom`
  is not referenced (`C-01`).

## Step 3 — Lint (code)

```bash
npm run lint         # = eslint .
```

- Must be **clean of errors**. `no-restricted-imports` (`C-04`) is **warn**-level: existing
  grandfathered warnings do not fail the command, but **new** warnings introduced by the change
  count as FAIL for this procedure (count before/after or diff the output).

## Step 4 — API contract compatibility (code, if touching data)

- Compare every touched data hook/service against the mock↔API matrix:
  [../features/topic/learner/00-mock-api-status.md](../features/topic/learner/00-mock-api-status.md).
- Rules:
  - Field names/shapes must match the frozen contract **when one is provided**; no contract on hand
    → status stays 🟡 mock and the gap is reported (**UNKNOWN**, never improvised).
  - Flipping a row 🟡→✅ requires updating that row **and** the screen doc in the same change (`C-11`).
  - Loading/Empty/error frames stay intact when swapping mock→real (matrix "Thứ tự đấu nối").
- `HttpService` is **NOT USABLE** today (see [guides/api-integration.md](guides/api-integration.md)) —
  claiming a real integration through it without wiring a base URL is a FAIL.

## Step 5 — Security & a11y spot-checks (manual; automated NOT AVAILABLE)

Manual checklist (evidence = checklist answers, not a tool report):

- **Security:** no secrets/new keys in code or docs (`C-15`); no assumption of auth on any route
  (`C-09` — guards **NOT IMPLEMENTED**, [guides/auth.md](guides/auth.md)); no unsanitized
  URL/CSS interpolation of data that can become user- or backend-controlled (known case: `DEV-11`
  `ContextBanner` `bg-url`).
- **A11y:** icon-only controls carry `aria-label`; decorative icons `aria-hidden`;
  invalid fields expose `aria-invalid`; `aria-current` on active nav/steps
  (patterns observed — see [guides/a11y-ui-quality.md](guides/a11y-ui-quality.md)).
  Touch-target size: **UNKNOWN / likely fail** — spec exists
  ([../design-system/components.md](../design-system/components.md)) but no measurement tool is
  available (**NOT AVAILABLE**); flag visually suspicious cases for review.
- Keyboard-only pass through touched flows (manual, desktop browser via `npm run dev`).

## Step 6 — Regression notes (manual)

- `npm run dev` (port 3000) → exercise the touched routes: loading → empty → success → failure
  branches, plus navigation entered/exited from neighbouring screens.
- Note explicitly: flows NOT re-exercised (no automated regression suite exists — **NOT AVAILABLE**).

## Step 7 — Docs-sync obligation (same change)

Per [../../AGENTS.md](../../AGENTS.md) 4-step loop: update the doc that matches the edited code
(prop/route/state/mock-row), plus any summary table. For structural changes also update
[../architecture/project-structure.md](../architecture/project-structure.md) (it owns structure) and,
if a rule shifts, [implementation-constraints.md](implementation-constraints.md) / decisions.

## Evidence to record

| Field | Content |
|---|---|
| Change scope | files touched (src + docs) |
| Commands | verbatim `npm run build` + `npm run lint` outcome (error/warning counts) |
| Traceability | docs read, docs updated (paths + section/row) |
| Contract | mock-matrix rows affected (file + row), or "none" |
| Spot-checks | security/a11y/regression checklist answers + what was skipped |
| UNKNOWNs | anything unverifiable (e.g. backend contract, touch-target measurement) |

## Outcomes

| Outcome | Meaning |
|---|---|
| **PASS** | Steps 1–7 done; build+lint green; no new lint warnings; docs updated; UNKNOWNs listed. |
| **FAIL** | Build or lint errors, new lint warnings, contract mismatch, missing same-change doc update. Fix and re-run all steps. |
| **BLOCKED** | A needed input does not exist: frozen API contract, decision (`D1`–`D12` all PROPOSED), guard implementation, or tooling marked NOT AVAILABLE. Report to the orchestrator with the missing input named — do not improvise. |

> No test-suite outcome may ever be claimed: a test runner, CI pipeline, and Playwright config are
> **NOT AVAILABLE / UNKNOWN** in this repo (see [guides/testing.md](guides/testing.md)).
