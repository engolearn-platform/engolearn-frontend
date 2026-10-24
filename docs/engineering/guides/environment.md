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
| `VITE_LEARNING_PATH_USER_ID` | Read by the Learning Path list service as the current local test user's Mongo ObjectId; set it in ignored `.env.local` | `src/features/learning-path/services/learningPath.service.ts` |
| Secrets in `src/` | none found (no key material in source) | verified search; keep it that way (`C-15`) |
| Stitch key file | `.opencode/.stitch-key` exists and is gitignored | `.gitignore:28` |
| API routing | Vite dev proxy forwards `/api` to `http://localhost:8080`; production routing remains deployment-specific | `vite.config.ts`; [api-integration.md](api-integration.md) §6 |
| Shared HTTP base URL | none — a key reason `HttpService` is NOT USABLE | [api-integration.md](api-integration.md) §3 |

## 2. Rules (`C-15`)

- **MUST NOT** put keys, tokens, or passwords in `src/`, tracked config, or any doc. Key material
  is never reproduced in `docs/engineering/` (including this file).
- Config that the client bundle reads must be Vite-prefixed (`VITE_*`). `VITE_LEARNING_PATH_USER_ID`
  is a local integration setting, not a secret; set it in the ignored root `.env.local` file. Do
  not put credentials or tokens in a `VITE_*` variable because Vite exposes it to browser code.
- The repository's `.env.example` currently does not include `VITE_LEARNING_PATH_USER_ID`; its
  attempted update was rejected during this task. Add the variable there only after explicit
  authorization, then keep this guide synchronized.

## 3. When a real API base URL arrives

The Learning Path list currently relies on Vite's development proxy and a local test user ID.
Production API routing and a frontend authentication/session source still need to be supplied.
The shared `HttpService` remains unwired and other feature contracts remain **UNKNOWN**. See
[api-integration.md](api-integration.md) §3 and §6.

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
