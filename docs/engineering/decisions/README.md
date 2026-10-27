# Decisions — ADR format & open decision register

> **Purpose:** How architectural decisions for `engolearn-frontend` are recorded (ADR format), plus
> the current register of open decisions `D1`–`D12`.
> **Scope:** Frontend-level decisions only (structure, tooling, UI conventions). Business decisions
> live in business docs outside this folder — link, never restate.
> **Owner:** Whoever proposes the decision; the register itself is maintained with the change that
> settles the decision (docs-first loop, [AGENTS.md](../../../AGENTS.md)).
> **Status:** D1–D12 remain PROPOSED stubs. D13/D14 record accepted task-scoped tooling/URL-state choices (2026-10-27); the general ADR process remains proposed.
> **Relationships:** [../README.md](../README.md) (precedence) ·
> [../implementation-constraints.md](../implementation-constraints.md) (rules derived from decisions) ·
> [../technical-design.md](../technical-design.md) · [../traceability/deviations.md](../traceability/deviations.md) ·
> [AGENTS.md](../../../AGENTS.md) · [README.md](../../../README.md) ·
> [project-structure.md](../../architecture/project-structure.md) ·
> [components.md](../../design-system/components.md)

## How to record an ADR

One file per settled-or-open decision: `docs/engineering/decisions/d<N>-<slug>.md`
(this README holds the register until a decision grows beyond a stub). Required fields:

| Field | Content rule |
|---|---|
| **Context** | What triggered the question; evidence = file paths/lines or doc links (never hearsay). |
| **Constraints** | Hard limits (links to [implementation-constraints.md](../implementation-constraints.md), APPROVED authorities, tooling marked NOT AVAILABLE). |
| **Alternatives** | Real options considered, including "do nothing". No strawmen. |
| **Choice + rationale** | The pick and why. **Empty until status is `accepted`.** |
| **Consequences** | Positive/negative follow-ups, work created, rules to add/update (`C-xx`). |
| **Status** | exactly one of: `proposed` · `accepted` · `superseded` · `rejected` (+ date + superseding decision). |
| **Related** | Requirement refs (BR/UC — **UNKNOWN** unless a source supplies them), feature-design docs, deviations `DEV-xx`, constraint IDs, code paths. |

**Status discipline:** a decision becomes `accepted` only when someone records choice + rationale +
date. Until then every doc MUST keep it PROPOSED; guides/constraints may reference a stub as "open
decision `Dn`", never as "per decision Dn".

## Decision register

| ID | Title | Status | Context evidence (link) | Open question |
|---|---|---|---|---|
| **D1** | Learning-card radius: `rounded-2xl` vs `rounded-lg` | PROPOSED | [components.md](../../design-system/components.md) names `rounded-2xl` for Learning Card; [tokens.yaml](../../design-system/tokens.yaml) defines the radius scale; code uses both families (e.g. `rounded-xl` in `ContextBanner.tsx:15`) | Which single radius token is canonical, and how does the Tailwind class map onto the token scale? |
| **D2** | Retention of legacy `Post` / `Product` / `Welcome` features | PROPOSED | [project-structure.md §1, §5](../../architecture/project-structure.md) marks them legacy/reference; [README.md](../../../README.md) is built on them; they still register routes (`src/router.tsx:1-13`) | Keep as demos, migrate to lowercase domains, or delete (and what that does to README examples)? |
| **D3** | Remove unused `path` npm dependency | PROPOSED | `package.json:19` declares `"path": "^0.12.7"`; only `import path from "path"` is in `vite.config.ts:3` (Node/Vite config context — audit: shim unused) | Is the npm shim ever resolved instead of the Node builtin, and is removal safe? |
| **D4** | `core → features` import exception (`TopicLearningLayout`) | PROPOSED | [DEV-02](../traceability/deviations.md) — `src/core/layouts/TopicLearningLayout.tsx:3` imports `@features/topic/hooks/TopicProgressContext`, against [project-structure §6](../../architecture/project-structure.md) | Sanction as documented exception, or restructure (provider composition owned by the feature/route layer)? |
| **D5** | Intra-feature import style: alias vs relative | PROPOSED | Mixed EXISTING: `useTopicDetail.ts:3` uses `../types/…` while `VocabularyUpsertDialog.tsx:16-24` uses `@features/topic/…`; AGENTS.md mandates aliases for imports "outside the current directory" (ambiguity: same-feature deep imports) | For files deep inside one feature, is `@features/<d>/…` or feature-relative the standard? |
| **D6** | Auth scope: login / session / 401–403 handling | PROPOSED | Auth contract with backend is **UNKNOWN**; 0 guard/auth code EXISTING ([../guides/auth.md](../guides/auth.md), `DEV-06`) | What does the FE own (guard component, token storage, error mapping) once BE defines the contract? |
| **D7** | Form library: keep controlled drafts vs adopt one | PROPOSED | No form lib in `package.json`; controlled-draft pattern EXISTING across create/update (upsert) + editor flows ([../guides/form-handling.md](../guides/form-handling.md)); native `<select>` in 7 files (`DEV-09`) | Introduce a library (which one?) or codify the draft pattern as the standard? |
| **D8** | Toast/notification primitive | PROPOSED | No toast lib and no shadcn toast/sonner component installed (`src/core/components/shadcn/` has only `button.tsx`, `dialog.tsx`); `C-07` forbids ad-hoc primitives | Do we need toasts at all; if yes, which primitive and where it lives? |
| **D9** | Scope of the `frontend-design` skill | PROPOSED | `.opencode/skills/frontend-design/` and `.agents/skills/frontend-design/` both exist alongside `frontend-ui/`, which [AGENTS.md](../../../AGENTS.md) designates for Engo Learn UI work | What does `frontend-design` govern vs `frontend-ui` + [design-system/](../../design-system/tokens.yaml)? Overlap must be resolved, not guessed. |
| **D10** | MCP Stitch key delivery: file vs env vs literal | PROPOSED | `engolearn-frontend/.opencode/opencode.json` references `{file:.stitch-key}`; repo-root `.opencode/opencode.json` carries a literal header value (EXISTING — key material deliberately not reproduced here); `.env.example` declares `STITCH_API_KEY` ([../guides/environment.md](../guides/environment.md)) | Which mechanism is authoritative for the MCP `X-Goog-Api-Key` header? (**UNKNOWN** pending owner.) |
| **D11** | Permission for FE docs/agents to read repo business docs | PROPOSED | Business docs sit outside `engolearn-frontend` (repo-root `docs/`); frontend role currently codes against AGENTS.md/design-system/feature docs | Is reading repo-root business docs granted/required for the FE role? (**UNKNOWN** pending owner/orchestrator.) |
| **D12** | Confirm Hanken Grotesk as the typeface (and retire the `Inter` line) | PROPOSED | `index.html:9-12` loads Hanken Grotesk; [tokens.yaml](../../design-system/tokens.yaml) + [principles.md](../../design-system/principles.md) specify it; `.opencode/UI_CONSTITUTION.md` still says `Inter`; AGENTS.md/project-structure declare design-system wins | Formally accept the design-system choice and update the stale constitution entry? |
| **D13** | Native topic API tests and generated wire DTOs | accepted (2026-10-27) | [testing guide](../guides/testing.md), approved staged API work | Use existing Node runner/injected fetch and dependency-free generation; no new libraries or React/browser tooling. |
| **D14** | Topic catalog URL state | accepted (2026-10-27) | [state guide](../guides/state-management.md), user-approved back/filter preservation | Use router q/level/sort/tab and validate internal return URLs; no new store library. |

## Rules for this register

1. **No fabricated status.** `accepted` requires recorded choice + rationale + date; none exists yet.
2. **No invented requirement IDs.** BR/UC references stay **UNKNOWN** until a source doc provides them (`D11` context).
3. A settled decision updates, in the same change: this register → the derived constraint/guide →
   affected code ([AGENTS.md](../../../AGENTS.md) docs-first loop).
4. A superseded decision keeps its file, adds `superseded by Dn` — never silent rewrites.
