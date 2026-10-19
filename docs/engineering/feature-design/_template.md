# Feature design — `<screen or feature name>`

> **Purpose:** Reusable skeleton for a per-feature / per-screen design doc. Copy this file to
> `docs/engineering/feature-design/<domain>-<screen>.md` (or into a feature package when the
> feature's own doc set is the living spec — see [../traceability/README.md](../traceability/README.md)).
> **Scope:** One screen/flow only. Cross-cutting rules live in
> [../implementation-constraints.md](../implementation-constraints.md) — link, don't copy.
> **Owner:** The author of the design; updated in the same change as the implementation (`C-11`).
> **Status:** PROPOSED (this template). Per-use status goes in the Status box below.
> **Relationships:** [../../../AGENTS.md](../../../AGENTS.md) ·
> [../../architecture/project-structure.md](../../architecture/project-structure.md) ·
> [../../design-system/tokens.yaml](../../design-system/tokens.yaml),
> [../../design-system/patterns.md](../../design-system/patterns.md) ·
> [../decisions/README.md](../decisions/README.md) · [../code-validation.md](../code-validation.md) ·
> existing package example: [../../features/topic/learner/README.md](../../features/topic/learner/README.md)

---

## Status box

| Field | Value |
|---|---|
| Status | `proposed` / `approved` / `implemented` (exactly one; default `proposed`) |
| Date | `<YYYY-MM-DD>` |
| Related decisions | `Dn` … or "none" |
| Related constraints | `C-xx` … or "none" |
| Related deviations | `DEV-xx` … or "none" |
| Implementation paths | `src/features/<d>/…` (filled as code lands) |
| Validation evidence | link/pointer to [../code-validation.md](../code-validation.md) run, or `NOT AVAILABLE` |

> **Design vs implementation evidence — mandatory distinction:**
> everything in sections marked *Design* is intent (what SHOULD exist); sections marked
> **Implementation evidence** record what code actually does today, with file + symbol + line.
> Never let a design claim read as verified behavior: if it isn't in code yet, it stays
> `proposed`; if code and this doc disagree, the docs-first tie-break in
> [../../../AGENTS.md](../../../AGENTS.md) applies.

---

## 1. Requirement refs

- Business rules / use cases: **UNKNOWN** unless a source doc is named here
  (never invent BR/UC IDs; engineering docs do not own "what").
- Product/UX source (e.g. Stitch screen, feature doc package): `<link or UNKNOWN>`.
- Behavior notes from repo docs: `<links>`.

## 2. Scope & non-goals

- **In scope:** …
- **Non-goals:** … (explicitly: adjacent screens, future backend concerns, decisions not yet accepted)

## 3. Decisions affecting this design

| Decision | Status | Impact here |
|---|---|---|
| `Dn` | PROPOSED (unless settled) | what it blocks/allows in this design |

## 4. UI & routes

- Route(s): path constant from `src/shared/constants/app.constants.ts` (`ROUTES.*`) or new path +
  where it is registered (`features/<d>/routes.ts` → `src/router.tsx`, `C-02`).
- Layout/wrapper: which `core/layouts/*` (and any provider mounted by it).
- Page shape per [design-system patterns](../../design-system/patterns.md) (link; tokens from
  [tokens.yaml](../../design-system/tokens.yaml) — never restated here).
- Key screen anatomy: components + what each is responsible for (names only, no styling copy).

## 5. Component / module responsibilities

| Symbol | Path | Responsibility | Surface (`shared`/`learning`/`management`) |
|---|---|---|---|
| | `src/features/<d>/…` | | |

> For a `management` surface with multiple screens, record the slice in `Path`
> (e.g. `management/list`, `management/upsert`) — see
> [project-structure §4.1](../../architecture/project-structure.md).

Placement questions → [../implementation-constraints.md](../implementation-constraints.md)
(`C-03`, `C-07`, `C-14`) and [project-structure](../../architecture/project-structure.md) §3–§4.

## 6. Data & API

- Hook(s): `<useX>` via `useFetch((signal) => …)` (`C-06`) — pattern:
  [../guides/api-integration.md](../guides/api-integration.md).
- Service/endpoints: **name only**; concrete DTOs/endpoints = **UNKNOWN** unless a frozen contract
  is linked. Never paste assumed backend shapes.
- Mock status: row reference in
  [../../features/topic/learner/00-mock-api-status.md](../../features/topic/learner/00-mock-api-status.md)
  (or "no matrix yet").

## 7. Interactions & state transitions

- User actions → state/route changes (table or mermaid).
- State owner per piece: local draft / URL / context (see
  [../guides/state-management.md](../guides/state-management.md)).

## 8. Validation & error branches

- Per invalid condition: trigger, inline/error display, blocked action.
- Error surfaces for load/save failures (what the user sees; no invented backend error codes).

## 9. Loading / empty / success / failure

| State | Component/behavior | Notes |
|---|---|---|
| Loading | `Loading` (`src/shared/components/Loading.tsx`) or feature skeleton | keep frames when swapping mock→real |
| Empty | `EmptyState` (`src/shared/components/EmptyState.tsx`) | |
| Success | … | |
| Failure | … (message source = contract, else UNKNOWN) | |

## 10. Accessibility & responsive

- Landmarks/labels/aria states used (patterns: [../guides/a11y-ui-quality.md](../guides/a11y-ui-quality.md)).
- Breakpoints/touch targets: reference the design-system docs; unverified claims stay **UNKNOWN**.

## 11. Security / authz

- Guard status: **NOT IMPLEMENTED** repo-wide ([../guides/auth.md](../guides/auth.md), `C-09`,
  `DEV-06`) — state it; do not write "only X can see this" as if enforced.
- Input handling risks (URLs, HTML, permissions): … or "n/a".

## 12. Test strategy

- Current tooling: `npm run build` + `npm run lint` only — runner/CI **NOT AVAILABLE**
  ([../guides/testing.md](../guides/testing.md)).
- Planned checks (manual/scripted-in-future), evidence to attach: …

## 13. Traceability

| This design | Implemented by | Validated by | Deviations |
|---|---|---|---|
| section refs | `src/…` paths + symbols | [../code-validation.md](../code-validation.md) evidence / `NOT AVAILABLE` | `DEV-xx` |

Trace model: [../traceability/README.md](../traceability/README.md).
