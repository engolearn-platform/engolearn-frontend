# Guide — API integration

> **Purpose:** How data enters the UI: the `useFetch` pattern, the services layer, why
> `HttpService` integration, and the recipe for swapping mock → real.
> **Scope:** All data fetching in `src/`. The Learning Path list and detail contracts are recorded in §6–7;
> other backend contracts remain **UNKNOWN** until supplied (never improvised:
> [../README.md](../README.md) precedence).
> **Owner:** Frontend engineering docs — update when a mock flips to real (`C-11`).
> **Status:** PROPOSED (guide). All code facts are EXISTING and cited.
> **Relationships:** [../architecture/project-structure.md](../../architecture/project-structure.md) §6, §8 ·
> [../../AGENTS.md](../../../AGENTS.md) (Boundaries) ·
> [../implementation-constraints.md](../implementation-constraints.md) `C-06` ·
> [../traceability/deviations.md](../traceability/deviations.md) (`DEV-03`, `DEV-07`) ·
> mock matrix: [../../features/topic/learner/00-mock-api-status.md](../../features/topic/learner/00-mock-api-status.md) ·
> [../code-validation.md](../code-validation.md) step 4 ·
> [../../design-system/components.md](../../design-system/components.md) (Loading/EmptyState frames)

## 1. The `useFetch(signal)` pattern (EXISTING)

`src/shared/hooks/useFetch.ts` takes `(signal: AbortSignal) => Promise<T>` and returns
`{ data, loading, error, refetch }` with abort-on-unmount, abort-error swallowing, and error
normalization to `{ message }`. Usage contract (`C-06`):

- Build the fetch callback **inside a feature hook** (`features/<d>/hooks/use*`), wrapped in
  `useCallback`, honoring `signal`.
- Views consume the hook — they never call `fetch`.

Grounded example — topic detail now calls the target API through a feature service (stage2):

```ts
export function useTopicDetail(topicId: string) {
  return useFetch(useCallback(
    (signal: AbortSignal) => topicCatalogService.detail(topicId, signal),
    [topicId],
  ));
}
```

Grounded example — real network inside the hook
([`src/features/Product/hooks/useProducts.ts`](../../../src/features/Product/hooks/useProducts.ts))
(legacy demo host from `API_URLS`, see §3):

```ts
const fetchProducts = useCallback(async (signal: AbortSignal): Promise<ProductModel[]> => {
  const response = await fetch(`${API_URLS.FAKE_STORE}/products`, { signal });
  return response.json();
}, []);
const { data: products, loading, error } = useFetch<ProductModel[]>(fetchProducts);
```

Notes:
- `loading` starts `true` when `immediate` (default) — keep the shared `Loading`/`EmptyState`
  frames when swapping data sources (matrix "Thứ tự đấu nối").
- Mocks that ignore `signal` still must not throw after abort — check `signal.aborted` like
  `useTopicDetail`, or the aborted request races state (useFetch ignores `AbortError`, but a
  stale-success write must be avoided by the callback itself).

## 2. Services layer (EXISTING shape)

Two legitimate homes for request logic:

| Layer | Location | Use for |
|---|---|---|
| Feature service | `src/features/<d>/services/*.service.ts` | domain verbs (e.g. `updateTopicProgress`) |
| Shared HTTP primitive | `src/shared/services/http.service.ts` | shared same-origin transport, request options and bounded auth refresh; see [http-service.md](http-service.md) |

EXISTING feature-service example (`src/features/topic/services/topic-progress.service.ts`):
`updateTopicProgress(topicItemId, payload, current)` — body currently `console.info` + local
advance; its own doc-comment says swap the body for `httpService.patch` **once the API contract
lands** (contract = **UNKNOWN** for now; do not invent URL/DTO).

`API_URLS` (`src/shared/constants/api.constants.ts`) holds only two third-party demo hosts used by
legacy `Post`/`Product` (DEVIATION `DEV-03` — no real backend base URL exists).

## 3. `HttpService` status: available for same-origin API integration

`httpService` is already used by shared auth and subscription services. It resolves `/api/...`
against the browser origin, sends browser-managed cookies, merges common and per-request headers,
accepts query params and `AbortSignal`, and performs one bounded refresh/retry on eligible 401s.
Auth tokens are HttpOnly cookies, not JavaScript header values. Its full interface, error shape and
feature-owner migration checklist are in [http-service.md](http-service.md).

Existing Learning Path, topic management, topic learning and the profile test page still have
feature-owned request implementations. They are **not** claimed to be migrated by this guide.
Feature owners must preserve their contract validation and domain error handling when integrating.

## 4. Mock → real recipe (from the learner matrix)

Reference table: [../../features/topic/learner/00-mock-api-status.md](../../features/topic/learner/00-mock-api-status.md)
(legend ✅ real / 🟡 mock / ⬜ missing screen).

1. **Locate the row** you are touching (screen doc + which column: content / audio / progress).
2. **Keep the frame**: views keep `Loading` / `EmptyState` branches; props of the hook stay stable —
   only the hook/service body changes.
3. **Swap the body**: replace the mock literal/log-call with the service call that carries
   `signal` (pattern §1/§2). The matrix's own suggested order: GET content screens first →
   GET/PATCH progress (`04` §6 recipe, "only 2 files, views unchanged") → audio handlers →
   new screens.
4. **Contract check**: field names/shapes must match the provided contract exactly; mismatch →
   stop and report (orchestrator), do not adapt the backend (rule in
   [../README.md](../README.md) scope).
5. **Update in the same change** (`C-11`): flip the relevant mock-status row 🟡→✅ **and** the
   screen doc. Then run [../code-validation.md](../code-validation.md).

## 6. Learning Path list API (REAL)

The learner list uses `GET /api/learning-paths?status=<status>` through the
Vite development proxy (`/api` → `http://localhost:8080`). `status` is `ACTIVE` by default;
`COMPLETED` and `CANCELLED` are requested when their collapsed sections open. Every response has
the backend envelope `{ data: { items, counts }, timestamp }`. The card DTO contains
`id`, `sourceAssessmentAttemptId: string|null`, `createdDate`, `level`, `k`, `microSkills: string[]`, `status`,
`currentWeekNo`, and `progress { assigned, answered }`.

The request callback lives in `features/learning-path/hooks/useLearningPaths.ts`, passes its
`AbortSignal` to `learningPathService`. Search uses `GET /api/learning-paths/search` with
`keyword`; it matches an exact creation date in `DD/MM/YYYY` format or a partial,
case-insensitive micro-skill name. Only active and completed paths are searched; cancelled paths
are excluded. Search requests are debounced in the view. Both calls use shared HTTP with
the authenticated cookie and bounded refresh; no `VITE_LEARNING_PATH_USER_ID` is needed.
The list view redirects guests to login and remounts state on identity changes. The native
Assessment ID replaces the former `sourceAttemptId` property: linked cards navigate to
`/assessment/attempts/:id/result`, while null links remain disabled. See the
[list screen](../../features/learning-path/learner/00-list-screen.md) for behavior.

## 7. Learning Path detail API (REAL)

The four-tab learner detail screen requests `GET /api/learning-paths/{pathId}` using shared
HTTP and the session cookie, with an authenticated view guard.
Its response uses the same `{ data, timestamp }` envelope as the list. The detail DTO
contains `config`, `microSkills`, `progress`, `weeks` with day states and closed-week
`stats`, plus `summary` when the path is completed. Locked weeks have no day details;
week statistics are available after closure. Cancelled paths cannot be opened.

`useLearningPathDetail` calls `learningPathService.detail` with an abort signal.
`learningPathDetail.mapper.ts` converts backend fields and timestamps into the view
model, using the Vietnam time zone for dates. Closed-week and summary tabs display
backend rates, scores, and improvements; open progress uses answered/assigned counts. The
daily practice and result routes remain UI-only until their backend APIs exist.

## Topic learning — target contract (2026-10-27)

[Target OpenAPI](../../handout/topic-learning/api.openapi.yaml) và [handoff](../../handout/topic-learning/backend-handoff.md) ghi contract cần BE bổ sung, không phải mô tả BE đã đáp ứng.
`createTopicApi` trong feature topic dùng `/api/v1` cùng origin và fetch được tiêm trong test, không qua shared `HttpService` cũ. Có xử lý envelope, ProblemDetail/status/code, AbortSignal và Idempotency-Key bắt buộc cho POST; không tự retry và không fallback mock.
Wire DTO được sinh bằng `npm run topic:types`, kiểm tra drift bằng `npm run topic:types:check`. Chặng1 chưa đổi các hook/view cũ.
Native API tests: `npm run test:topic-api`; phạm vi và giới hạn ở [testing.md](testing.md). Auth MVP dùng cookie HttpOnly; topic client hiện vẫn có transport riêng.

## 8. Anti-patterns

- `fetch` inside views/components (`C-06`).
- Duplicating auth refresh or manually attaching access/refresh token headers in feature services.
- Hardcoding guessed endpoints/DTOs before a contract exists (**UNKNOWN** → BLOCKED).
- New mock hooks that skip `signal` handling (abort safety, §1 notes).
- Leaving a 🟡 row 🟡 after wiring real data (doc-code drift, AGENTS.md tie-break).

## Chặng2: các hook đã chuyển

useTopicDetail/useTopicProgress và useTopicCatalog dùng topicCatalogService; viewer được nạp một lần ở TopicViewerLayout. shared useFetch giữ code/status bên cạnh message, không import domain error vào shared.
Default endpoint vẫn là /api/v1 qua proxy BE. Dữ liệu thiếu contract được báo lỗi; không có chuyển ngầm sang mock. Preview riêng và giới hạn: docs/handout/topic-learning/verification.md.
