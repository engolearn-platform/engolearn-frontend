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
| `.env.example` | documents `STITCH_API_KEY` for tooling and optional `VITE_API_PROXY_TARGET` for the development API proxy | repo-root `.env.example`; `vite.config.ts` |
| `.env` / `.env.local` | local configuration is gitignored; its presence and contents are machine-specific | `.gitignore` |
| Learning Path identity | All requests use the authenticated cookie through shared HTTP; `VITE_LEARNING_PATH_USER_ID` is obsolete and can be removed from existing local files | `src/features/learning-path/services/learningPath.service.ts` |
| Secrets in `src/` | none found (no key material in source) | verified search; keep it that way (`C-15`) |
| Stitch key file | `.opencode/.stitch-key` exists and is gitignored | `.gitignore:28` |
| API routing | Vite dev proxy forwards `/api` to `VITE_API_PROXY_TARGET`, defaulting to `http://localhost:8080`; production routing remains deployment-specific | `vite.config.ts`; [api-integration.md](api-integration.md) §6 |
| Shared HTTP base URL | Same browser origin; session cookies and bounded refresh are handled by the shared client | [http-service.md](http-service.md) |

## 2. Rules (`C-15`)

- **MUST NOT** put keys, tokens, or passwords in `src/`, tracked config, or any doc. Key material
  is never reproduced in `docs/engineering/` (including this file).
- Config that the client bundle reads must be Vite-prefixed (`VITE_*`). Do not put credentials
  or tokens in a `VITE_*` variable because Vite exposes it to browser code. A configured user
  ID does not establish an authenticated identity; Learning Path uses the signed-in session.

## 3. API routing and authentication

Learning Path list, search, detail, practice and result requests use same-origin `/api` URLs
through shared HTTP. Development uses the Vite proxy; sign in with a real backend account.
No Learning Path user-ID environment setting is required. Backend ownership and session
checks remain authoritative. See [api-integration.md](api-integration.md) §3 and §6–7 and
[HTTP authentication](http-service.md). Production must route `/api` to the backend; a
cross-origin deployment requires an explicit cookie/CORS design.

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
