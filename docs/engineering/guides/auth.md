# Guide — Auth & guards

> **Purpose:** Record what auth exists today (nothing), and the PROPOSED approach for when it
> arrives — so no one documents or codes against protection that doesn't exist.
> **Scope:** Route guards, session/permission handling, and auth-related error mapping in the
> frontend. Backend auth endpoints/contracts are out of scope and **UNKNOWN**.
> **Owner:** Frontend engineering docs — must change in the same change as the first guard code (`C-11`).
> **Status:** §1–§2 EXISTING (verified status quo). §3 PROPOSED approach — not approved.
> **Relationships:** [../../architecture/project-structure.md](../../architecture/project-structure.md) §7 (guard placement — documented) ·
> [../implementation-constraints.md](../implementation-constraints.md) `C-09` ·
> [../technical-design.md](../technical-design.md) §5 · [../decisions/README.md](../decisions/README.md) `D6` ·
> [../code-validation.md](../code-validation.md) step 5 · [../traceability/deviations.md](../traceability/deviations.md) `DEV-06` ·
> [../../design-system/patterns.md](../../design-system/patterns.md) (page shapes for auth screens)

## 1. EXISTING — nothing is implemented

Verified status quo (searches over `src/`):

| Claim | Evidence |
|---|---|
| **0** guard/permission/auth components or hooks | no matches for guard/RequireAuth/session/token logic in `src/**/*.ts(x)` (only unrelated doc comments) |
| **0** login screen, session store, token handling | no such files under `src/` |
| `/admin/*` routes are public | `src/features/topic/routes.ts:83-104` renders `ManagementLayout` + views with no wrapper; same for `ROUTES.ADMIN_*` in `src/shared/constants/app.constants.ts` |
| Guards are *documented* only | [project-structure.md §7](../../architecture/project-structure.md): "Guards wrap the route element or layout" — documentation ≠ implementation |
| Registered deviation | [`DEV-06`](../traceability/deviations.md) — categorized immediate correctness/security; left in code intentionally by this docs task |

**Consequence (`C-09`):** anyone can open `/admin/topics/create/…` in a browser today. Frontend UI
must not claim, imply, or rely on protection ("admins only", hidden admin entry points as
"security"). Any doc touching these screens MUST state `guard: NOT IMPLEMENTED`.

## 2. EXISTING — auth contract with the backend

**UNKNOWN.** No login/session endpoint, token type, expiry, refresh, or 401/403 error envelope has
been supplied to the frontend. Nothing in `docs/engineering/` may specify them (never invent backend
contracts — [../README.md](../README.md) precedence: business/backend sources win).

## 3. PROPOSED — approach once auth exists

Not approved; recorded so future work has a consistent starting point. Decision `D6` (status
PROPOSED) owns the scope questions.

1. **Guards wrap routes/layouts, never folders.** Implement as a route-level wrapper component
   (or layout-level check) added in `features/<d>/routes.ts` — per
   [project-structure.md §7](../../architecture/project-structure.md). MUST NOT split or duplicate
   feature folders by permission (`features/admin/…` anti-pattern, §10 of the same doc);
   access is a route concern, folder layout is a domain concern (`C-03`, `C-09`).
2. **Single guard primitive.** One shared guard (app shell / `src/core/` or `src/shared/` by the
   placement rule `C-14`) reused by every protected route — not per-feature copies.
3. **Redirect behavior** (login target, return-to) and **session storage** (cookie vs token) are
   TBD with the backend contract — **UNKNOWN** until `D6` is settled with a real contract link.
4. **401 vs 403 handling** (re-authenticate vs forbidden) is **TBD with backend** — do not code
   guessed mappings; surface a generic error + log until the envelope is provided
   (see [api-integration.md](api-integration.md) §3.2–3.4).
5. **Defense in depth:** FE guards are UX only; real enforcement must be server-side. Docs and UI
   copy must reflect that even after guards ship.

## 4. Rules while auth is absent

- `C-09` (no auth-bypass assumptions) — review-enforced; automated checks **NOT AVAILABLE**.
- Validation step 5 asks explicitly: "does this change assume protection?" — answering "yes" is a
  FAIL ([code-validation.md](../code-validation.md)).
- When the first guard lands: same-change updates required to this file (§1→§3 status flip),
  `DEV-06` remediation entry, `D6` status, and affected feature docs.

## Topic viewer (chặng2, 2026-10-27)

TopicViewerLayout đọc GET /topic-learning/viewer và cung cấp kind/learnerId/level cho feature. Đây không phải login, session store hay auth guard. Quyền thao tác hiển thị theo BE; BE vẫn chịu trách nhiệm ownership/authorization. Chưa thêm user collection, token hoặc header giả. Guest không gọi mine/progress. Lỗi viewer là lỗi, không bị coi là guest. Đổi viewer/level remount phạm vi dữ liệu của catalog/detail.
