# Engineering docs — index

> **Purpose:** Index of the `docs/engineering/` system: what each doc is responsible for,
> which authority it defers to, and the precedence rules used to settle conflicts.
> **Scope:** Documentation only (this task creates docs; it changes no `src/` code, no docs
> outside `docs/engineering/`, no configs, no dependencies).
> **Owner:** Frontend engineering docs — must be kept in sync with code in the same change
> (docs-first loop, see [../../AGENTS.md](../../AGENTS.md)).
> **Status:** PROPOSED — every standard in this folder is a proposal. The only APPROVED
> authorities are the pre-existing docs linked below (they declare themselves sources of truth).
> **Relationships:** [../architecture/project-structure.md](../architecture/project-structure.md) ·
> [../design-system/tokens.yaml](../design-system/tokens.yaml) ·
> [../design-system/principles.md](../design-system/principles.md) ·
> [../design-system/components.md](../design-system/components.md) ·
> [../design-system/patterns.md](../design-system/patterns.md) ·
> [../../AGENTS.md](../../AGENTS.md) ·
> [../features/topic/learner/00-mock-api-status.md](../features/topic/learner/00-mock-api-status.md)

## Classification labels

Every statement in this folder carries one label. Labels are not interchangeable:

| Label | Meaning |
|---|---|
| **EXISTING** | Verified present in the repo today (code, config, or an existing doc). Cite file + symbol/line. |
| **PROPOSED** | A new standard/process introduced by this docs task. Not approved until a decision says so. |
| **APPROVED** | Pre-existing authority that already declares itself source of truth (project-structure, design-system). Linked, never copied. |
| **DEVIATION** | Existing code/docs that knowingly break a rule; registered in [traceability/deviations.md](traceability/deviations.md). |
| **UNKNOWN** | Cannot be determined from available evidence/tooling. Never guessed. |

Tooling that does not exist in this repo is marked **NOT AVAILABLE** (e.g. test runner, CI,
pre-commit, automated boundary/a11y lint) — see [guides/testing.md](guides/testing.md).

## Doc index — responsibility & authority

| Doc | Responsibility | Authority status |
|---|---|---|
| [technical-design.md](technical-design.md) | Overall FE architecture: layer boundaries, feature organization, routing/data-flow, backend-integration status | PROPOSED (summarizes; defers to APPROVED architecture doc) |
| [implementation-constraints.md](implementation-constraints.md) | Enforceable rules `C-01`…`C-15` with normative strength + enforcement channel | PROPOSED |
| [code-validation.md](code-validation.md) | How to verify a change: build/lint, contract compat, spot-checks, evidence, PASS/FAIL/BLOCKED | PROPOSED |
| [decisions/README.md](decisions/README.md) | ADR format + register of open decisions `D1`–`D12` | PROPOSED (all stubs `PROPOSED`, none accepted) |
| [feature-design/_template.md](feature-design/_template.md) | Reusable per-feature/per-screen design doc skeleton | PROPOSED |
| [guides/api-integration.md](guides/api-integration.md) | `useFetch` usage, services layer, HttpService status, mock→real recipe | PROPOSED (grounded in EXISTING code) |
| [guides/state-management.md](guides/state-management.md) | Server / URL / local / global state choices; what not to add | PROPOSED (grounded in EXISTING code) |
| [guides/form-handling.md](guides/form-handling.md) | Controlled-draft pattern, dialog add/edit flow, inline errors | PROPOSED (grounded in EXISTING code) |
| [guides/auth.md](guides/auth.md) | Auth status (EXISTING: none) + proposed guard approach | Status quo EXISTING; approach PROPOSED |
| [guides/testing.md](guides/testing.md) | Validation that exists today + proposed strategy | PROPOSED (current tooling EXISTING) |
| [guides/a11y-ui-quality.md](guides/a11y-ui-quality.md) | Applying design-system tokens, hierarchy, aria patterns, known gaps | PROPOSED (observations EXISTING) |
| [guides/environment.md](guides/environment.md) | Env files, secrets, VITE_ vars, MCP key config conflict | PROPOSED (facts EXISTING; conflict UNKNOWN) |
| [traceability/README.md](traceability/README.md) | Link model: business req → decisions → design → impl → validation → deviations | PROPOSED |
| [traceability/deviations.md](traceability/deviations.md) | Register `DEV-01`…`DEV-11` of known departures, all intentionally left in code | EXISTING findings, PROPOSED register format |

## Precedence rules (tie-break order)

1. **Structure** — [../architecture/project-structure.md](../architecture/project-structure.md) beats
   [AGENTS.md](../../AGENTS.md) and [README.md](../../README.md) (both state this themselves).
2. **Visuals** — [../design-system/*](../design-system/tokens.yaml) beats
   [.opencode/UI_CONSTITUTION.md](../../.opencode/UI_CONSTITUTION.md) (e.g. font family conflict:
   design-system wins; recorded as decision `D12`).
3. **"What" (business)** — business/product docs outside this repo area beat engineering docs:
   engineering docs never invent business rules, BR/UC IDs, or backend contracts — they mark them
   **UNKNOWN**.
4. **Constraints beat guides** — [implementation-constraints.md](implementation-constraints.md)
   (normative `MUST`/`MUST NOT`) beats the narrative guides when wording differs.
5. **Within `docs/engineering/`** — this index + constraints beat any individual guide.
6. **Docs vs code** — living-spec rule in [AGENTS.md](../../AGENTS.md): on drift, fix code back to
   the doc or update the doc immediately; never leave "fix later".

## Map: existing docs → target engineering doc

| Existing doc (authority) | Relationship to `docs/engineering/` |
|---|---|
| [../architecture/project-structure.md](../architecture/project-structure.md) | APPROVED authority for structure; technical-design/constraints **link** to it, never restate its content |
| [../design-system/*](../design-system/tokens.yaml) | APPROVED authority for visuals; a11y guide **links**, never restates token values |
| [AGENTS.md](../../AGENTS.md) | Workflow (commands, docs-first loop, import notes) — referenced by validation + constraints |
| [README.md](../../README.md) | Boilerplate overview/examples; legacy (`Post`/`Product`) — see decision `D2` |
| [../features/topic/learner/00-mock-api-status.md](../features/topic/learner/00-mock-api-status.md) | Mock↔API truth for topic learner; the only API-compat table used by validation |
| `../features/topic/**` (01–05 + management 01–06) | Per-screen design+state docs — the "impl" side of traceability; feature-design docs point here |
| `../handout/` (`stitch-admin-topic-handoff.md`, `topic-item-context-url-note.md`) | Historical handouts (EXISTING, stale-prone — see `DEV-10`); not an authority |

## What this task does NOT cover

- **No application code changes** (`src/` untouched), no config/dependency changes, no edits to
  docs outside `docs/engineering/`, no `.opencode/` changes.
- **No refactoring** of the registered deviations (`DEV-01`…`DEV-11` stay in code by design).
- **No approval** of any decision: `D1`–`D12` are PROPOSED stubs only.
- **No backend contracts/BR/UC IDs/test results invented** — anything unverifiable is UNKNOWN.
- **No tooling added**: test runner, CI, pre-commit are **NOT AVAILABLE** and stay that way.
