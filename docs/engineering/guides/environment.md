# Guide — Environment & secrets

> **Purpose:** What environment/config exists in `engolearn-frontend`, where secrets may live, and
> the open MCP key-delivery conflict.
> **Scope:** `.env*`, runtime env vars, gitignore'd secret files, MCP (Stitch) key config.
> **Owner:** Frontend engineering docs — update when env scheme changes (`C-11`).
> **Status:** PROPOSED (guide); all facts EXISTING and cited; §4 is UNKNOWN pending a decision.
> **Relationships:** [../implementation-constraints.md](../implementation-constraints.md) `C-15` ·
> [../decisions/README.md](../decisions/README.md) `D10` · [api-integration.md](api-integration.md) §3 ·
> [../traceability/deviations.md](../traceability/deviations.md) ·
> [../../architecture/project-structure.md](../../architecture/project-structure.md) (where config lives in `src/`)

## 1. EXISTING — what's configured

| Item | Fact | Evidence |
|---|---|---|
| `.env.example` | documents exactly one variable: `STITCH_API_KEY` (Stitch MCP key for `.opencode/opencode.json`) | repo-root `.env.example` (1 variable) |
| `.env` | same single variable; gitignored | `.gitignore:27` (`.env`) |
| `VITE_*` client env vars | **0 usages** — no `import.meta.env` / `VITE_` anywhere in `src/` | verified search, `src/**` |
| Secrets in `src/` | none found (no key material in source) | verified search; keep it that way (`C-15`) |
| Stitch key file | `.opencode/.stitch-key` exists and is gitignored | `.gitignore:28` |
| Base URL config | none — a key reason `HttpService` is NOT USABLE | [api-integration.md](api-integration.md) §3 |

## 2. Rules (`C-15`)

- **MUST NOT** put keys, tokens, or passwords in `src/`, tracked config, or any doc. Key material
  is never reproduced in `docs/engineering/` (including this file).
- Config that the client bundle reads must be Vite-prefixed (`VITE_*`) — **but no such scheme is
  adopted yet** (`D10` context; introducing one is a decision, not a default).
- New env vars: add to `.env.example` with a placeholder, gitignore real `.env`, and document here
  in the same change.

## 3. When a real API base URL arrives

Blocking chain for backend integration: base-URL mechanism (env scheme, undecided) → `HttpService`
wiring (`DEV-07`) → frozen contract (**UNKNOWN**). See
[api-integration.md](api-integration.md) §3 — nothing may be invented ahead of those inputs.

## 4. UNKNOWN — MCP header delivery: file vs env (pending `D10`)

Three EXISTING mechanisms coexist; **which is authoritative is UNKNOWN pending the owner decision
`D10`** (PROPOSED — not settled):

1. File reference: `engolearn-frontend/.opencode/opencode.json` → `headers["X-Goog-Api-Key"]:
   "{file:.stitch-key}"` (points at the gitignored `.opencode/.stitch-key`).
2. Literal value: repo-root `.opencode/opencode.json` carries the header inline (EXISTS — value
   deliberately not reproduced here).
3. Environment: `.env` / `.env.example` define `STITCH_API_KEY`, but **no consumer of
   `STITCH_API_KEY` was found in the frontend** (nothing reads it at build/runtime — linkage
   UNKNOWN).

Until `D10` is settled: do not add a fourth mechanism, do not copy key values between locations,
and do not document any of the three as "the way".
