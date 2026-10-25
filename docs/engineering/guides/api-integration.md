# Guide — API integration

> **Purpose:** How data enters the UI: the `useFetch` pattern, the services layer, why
> `HttpService` is not wired, and the recipe for swapping mock → real.
> **Scope:** All data fetching in `src/`. The Learning Path list contract is recorded in §6;
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

Grounded example — mock hook ([`src/features/topic/hooks/useTopicDetail.ts`](../../../src/features/topic/hooks/useTopicDetail.ts)):

```ts
export function useTopicDetail(topicId: string) {
  const fetchTopicDetail = useCallback(
    async (signal: AbortSignal): Promise<TopicDetail> => {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      return { ...MOCK_TOPIC_DETAIL, id: topicId };   // EXISTING mock body — no network
    },
    [topicId],
  );
  const { data, loading, error, refetch } = useFetch<TopicDetail>(fetchTopicDetail);
  return { data, loading, error, refetch };
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
| Shared HTTP primitive | `src/shared/services/http.service.ts` | generic verb wrappers — **NOT USABLE today, §3** |

EXISTING feature-service example (`src/features/topic/services/topic-progress.service.ts`):
`updateTopicProgress(topicItemId, payload, current)` — body currently `console.info` + local
advance; its own doc-comment says swap the body for `httpService.patch` **once the API contract
lands** (contract = **UNKNOWN** for now; do not invent URL/DTO).

`API_URLS` (`src/shared/constants/api.constants.ts`) holds only two third-party demo hosts used by
legacy `Post`/`Product` (DEVIATION `DEV-03` — no real backend base URL exists).

## 3. `HttpService` status: NOT USABLE

EXISTING FACTS (verified):

- `src/shared/services/http.service.ts:11` — `constructor(baseUrl: string = "")`;
  `:75` — `export const httpService = new HttpService();` (default `""`).
- **0 call sites**: nothing in `src/` invokes `httpService.get/post/…` (only a doc-comment mention
  in `topic-progress.service.ts:11`).
- With `baseUrl = ""`, `buildUrl` calls `new URL(endpoint, "")` (`:16`) — an empty base is invalid,
  so relative endpoints throw `TypeError`. It remains unused. The Learning Path list uses a
  feature service with a relative `/api` URL; Vite's development proxy forwards it to the backend.

**What a reusable shared HTTP layer still needs** (pending for future integrations):

1. A reusable base-URL/configuration strategy for production.
2. Frozen backend contracts for the other features.
3. Auth header/session handling — blocked on `D6` / [auth.md](auth.md) (**NOT IMPLEMENTED**).
4. A decision on whether to wire `HttpService` or keep feature-owned requests (`DEV-07`).

The Learning Path list has its own known endpoint and DTO; it does not make the shared
`HttpService` usable for other features.

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

The learner list uses `GET /api/learning-paths?userId=<ObjectId>&status=<status>` through the
Vite development proxy (`/api` → `http://localhost:8080`). `status` is `ACTIVE` by default;
`COMPLETED` and `CANCELLED` are requested when their collapsed sections open. Every response has
the backend envelope `{ data: { items, counts }, timestamp }`. The card DTO contains
`id`, `sourceAttemptId`, `createdDate`, `level`, `k`, `microSkills: string[]`, `status`,
`currentWeekNo`, and `progress { assigned, answered }`.

The request callback lives in `features/learning-path/hooks/useLearningPaths.ts`, passes its
`AbortSignal` to `learningPathService`. Search uses `GET /api/learning-paths/search` with
`userId` and `keyword`; it matches an exact creation date in `DD/MM/YYYY` format or a partial,
case-insensitive micro-skill name. Only active and completed paths are searched; cancelled paths
are excluded. Search requests are debounced in the view. A local `VITE_LEARNING_PATH_USER_ID`
supplies the test user's ObjectId until the frontend has an authentication/session source.

## 5. Anti-patterns

- `fetch` inside views/components (`C-06`).
- Claiming `httpService` is wired while `baseUrl` is `""` (`DEV-07`).
- Hardcoding guessed endpoints/DTOs before a contract exists (**UNKNOWN** → BLOCKED).
- New mock hooks that skip `signal` handling (abort safety, §1 notes).
- Leaving a 🟡 row 🟡 after wiring real data (doc-code drift, AGENTS.md tie-break).
