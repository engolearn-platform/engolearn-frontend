# Guide — State management

> **Purpose:** Which state layer to use for what (server / URL / local / global), how the existing
> `TopicProgressContext` pattern works and its caveat, and what NOT to add.
> **Scope:** All React state in `src/`. No store-library comparison matrix — adding one is
> undecided (see §6).
> **Owner:** Frontend engineering docs — update when the state shape of a shared provider changes (`C-11`).
> **Status:** PROPOSED (guide); all cited code behavior is EXISTING.
> **Relationships:** [../architecture/project-structure.md](../../architecture/project-structure.md) §8 ·
> [../implementation-constraints.md](../implementation-constraints.md) `C-12` ·
> [api-integration.md](api-integration.md) ·
> [../../AGENTS.md](../../../AGENTS.md) (Boundaries) ·
> [../decisions/README.md](../decisions/README.md)

## 1. Server state — `useFetch` (EXISTING, mandated)

Any data that comes from (or will come from) a backend lives in a feature hook over
`useFetch((signal) => Promise<T>)` — returns `{ data, loading, error, refetch }`.

- Source of truth for read data: the hook's `data`; views derive UI from it.
- Mutations: call a feature service, then either update via `refetch()` or, where the pattern is
  established (progress PATCH), let the provider holding the state consume the service result
  (§4).
- Details/examples: [api-integration.md](api-integration.md).

## 2. URL state — `useParams` + `useNavigate` (EXISTING)

- Route identity (`:topicId`, `:vocabId`, `:itemId`, `:sectionKey`) is read with `useParams`
  (e.g. `TopicLearningLayout.tsx:12`); navigation is imperative `useNavigate()`
  (used across topic learning/management views, e.g. `TopicContextView.tsx:27`,
  `TopicManagementListView.tsx:36`).
- Constants for paths: `ROUTES` in `src/shared/constants/app.constants.ts` — prefer them over
  string literals (`C-02` context).
- **useSearchParams (topic catalog, D14 accepted 2026-10-27):** q/level/sort and mine tab live in URL. Search uses350ms debounce with replace; filters/tab use navigation entries. Detail keeps a validated internal from URL. Other legacy screens may still use component-local filters.

## 3. Local state — `useState` drafts (EXISTING)

- Form drafts, dialog open flags, `showErrors`/`submitted` toggles are component/hook-local
  `useState` (see [form-handling.md](form-handling.md)).
- Keep ephemeral UI (menus open, active tab) local unless two distant components need it.

**Lift when:** a second component beyond the owner needs the value, or the value must survive
route transitions inside one layout. Lift to the narrowest common ancestor; only then consider §4.

## 4. Global (feature-shared) state — context provider pattern (EXISTING)

Canonical example: `TopicProgressContext`
([`src/features/topic/hooks/TopicProgressContext.tsx`](../../../src/features/topic/hooks/TopicProgressContext.tsx))

- Mounted once by the layout, not by each view: pathless `TopicLearningLayout` wraps
  `LearningLayout` in `TopicProgressProvider` (`src/features/topic/routes.ts:28-34`,
  `TopicLearningLayout.tsx:11-17`) so provider state survives navigation between
  context/vocab/expressions/practice stages.
- Value shape: `{ progress, furthest, saving, currentStage, setCurrentStage, reportProgress }`;
  consumer hook throws outside the provider (`useTopicProgressContext`).
- Forward-only rule enforced in the domain layer: `isAhead()` + `PART_ORDER` in
  `src/features/topic/types/topic-progress.types.ts`; sidebar states derived by
  `deriveSidebarStates()` (same file/context module) with a loud `console.warn` on unknown stage ids.
- Mutation flow: `reportProgress` → advance local state → `updateTopicProgress` service (mock PATCH)
  → persist result.

**Caveat — `persistedFurthest` (EXISTING, known limitation):**
module-level `Map<string, FurthestReached>` (`TopicProgressContext.tsx:39`) keeps `furthest` across
provider remounts **within the same page session only** — it is lost on full reload, invisible to
other tabs, and is explicitly a stand-in until a real GET arrives (file comment `:34-38`). Do not
build new features that rely on it surviving reloads; replacing it with server-read initial state
belongs to the mock→real recipe (matrix `00`, row Progress).

## 5. What NOT to add (`C-12`)

- **No store library** (Redux / Zustand / Jotai / Recoil / MobX): none installed, none needed by
  any EXISTING flow; adding one is an architecture change requiring a registered, accepted decision
  (none exists — **UNKNOWN**/open in [../decisions/README.md](../decisions/README.md)).
- No duplicated server caches outside `useFetch` (no react-query/SWR installed either — same rule).
- No second provider for the same entity (`C-10` — one definition per entity; see `DEV-04`).
- No putting feature state in `src/core/` (placement rule `C-14`).

## 6. Decision status

| Question | Status |
|---|---|
| Keep "no store library" as a standing rule? | PROPOSED (to keep) — not accepted |
| Adopt `useSearchParams` for topic catalog state? | D14 accepted2026-10-27; q/level/sort/tab + safe return URL |
| Replace `persistedFurthest` with server initial state | blocked on backend contract (**UNKNOWN**) |
