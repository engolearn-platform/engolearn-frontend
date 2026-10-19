# Guide — Accessibility & UI quality

> **Purpose:** How to apply the design system while keeping UI accessible: token discipline,
> language hierarchy, spacing, primitive reuse, the aria patterns already in the codebase, and the
> known gaps (touch targets, URL-in-CSS caution).
> **Scope:** Visual/accessibility quality of all screens. Business content and layout decisions of
> individual screens live in feature docs.
> **Owner:** Frontend engineering docs — update with the design system it points to (`C-11`).
> **Status:** PROPOSED (guide). Design-system facts are APPROVED authority (linked); observations
> about code are EXISTING; unverifiable claims are UNKNOWN.
> **Relationships:** APPROVED visuals: [../../design-system/tokens.yaml](../../design-system/tokens.yaml) ·
> [../../design-system/principles.md](../../design-system/principles.md) ·
> [../../design-system/components.md](../../design-system/components.md) ·
> [../../design-system/patterns.md](../../design-system/patterns.md) ·
> [../implementation-constraints.md](../implementation-constraints.md) `C-07`, `C-08` ·
> [../decisions/README.md](../decisions/README.md) `D1`, `D12` ·
> [../traceability/deviations.md](../traceability/deviations.md) (`DEV-01`, `DEV-09`, `DEV-11`) ·
> [../../architecture/project-structure.md](../../architecture/project-structure.md) (component placement, boundaries) ·
> pointer [.opencode/UI_CONSTITUTION.md](../../../.opencode/UI_CONSTITUTION.md) (design-system wins — `D12`)

## 1. Token discipline — no arbitrary values in NEW code (`C-08`)

- Source of truth for colors/typography/radius/spacing: **[tokens.yaml](../../design-system/tokens.yaml)**
  (linked on purpose — token values are **not restated** in this file; read the file).
- Layout/behavior rules behind tokens: [principles.md](../../design-system/principles.md),
  [components.md](../../design-system/components.md), [patterns.md](../../design-system/patterns.md).
- Existing arbitrary values (`w-[…]`, `text-[…]`, `shadow-[…]` …) are a registered DEVIATION
  (`DEV-01`) and **grandfathered**: don't fix them opportunistically in unrelated changes, never
  spread them to new elements. Audit figure recorded: 54 hits (count varies by counting pattern —
  see `DEV-01`).
- Font: Hanken Grotesk is loaded by `index.html:9-12` and specified by the design system; the stale
  `Inter` line in `.opencode/UI_CONSTITUTION.md` is an open confirmation (`D12`, PROPOSED).

## 2. Language hierarchy & page frame (from principles — link, don't copy)

- **EN > VI hierarchy:** English is the primary learning content, Vietnamese the support layer —
  follow the sizing/weight relationship defined in
  [principles.md](../../design-system/principles.md); do not re-derive it per screen.
- **20px page margin:** the mobile-first page frame comes from [principles.md](../../design-system/principles.md);
  line-height for Vietnamese diacritics likewise — apply, don't re-specify.
- Page shapes (Admin/List/Form/Wizard): [patterns.md](../../design-system/patterns.md).

## 3. Reuse before creating (`C-07`)

- Primitives available today (EXISTING): shadcn `Button`, `Dialog`
  (`src/core/components/shadcn/`); shared `Card`, `Loading`, `EmptyState`, `ThinScroll`
  (`src/shared/components/`).
- Before any new input/select/picker: check the above; if none fits, that is a **decision first**
  (`D7` form lib, `D8` toast — both PROPOSED/undecided), not a local invention.
- Native `<select>` appears in 7 files (EXISTING, `DEV-09`) — grandfathered; new UI should not
  copy the pattern reflexively.

## 4. Aria patterns observed (EXISTING — reuse these conventions)

| Pattern | Where observed |
|---|---|
| `aria-hidden="true"` on decorative icons | pervasive, e.g. `LearningSidebar.tsx:32`, `TopicManagementStats` icons |
| `aria-label` on icon-only/nav controls | `LearningBottomNav.tsx:10` ("Điều hướng chính"), `TopicManagementPagination.tsx:43,66`, `VocabHeroCard.tsx:49,65` (audio: VN/UK pronunciation) |
| `aria-current="page"/"step"` for active nav/steps | `TopicStructureNav.tsx:34`, `VocabProgressHeader.tsx:52`, `TopicManagementPagination.tsx:53` |
| `aria-expanded` on menu triggers | `TopicManagementTable.tsx:163` |
| `aria-invalid` on invalid inputs | `TopicGeneralInfoCard.tsx:72,103,184,222` |
| `aria-pressed` toggle answer selection | `VocabQuickCheckCard.tsx:74` |
| `role="status"` for async result feedback | `VocabQuickCheckCard.tsx:103` |
| `role="img"` + `aria-label` for CSS-image | `ContextBanner.tsx:17-18` |

New screens should match this table rather than inventing new ARIA usage. Keyboard reachability of
dialogs/menus relies on the shadcn `Dialog` primitive (Radix) — another reason not to hand-roll
overlays (`C-07`).

## 5. Known gaps

- **Touch targets — UNKNOWN / likely fail.** [components.md](../../design-system/components.md)
  specifies a minimum icon-button touch target; the codebase widely uses `size-[18px]`/
  `size-[22px]` icon wrappers (e.g. `TopicManagementTable.tsx`, `VocabProgressHeader.tsx`) and the
  spec's 48×48 class of sizing is not systematically applied. **No measurement tooling exists
  (NOT AVAILABLE)** — so "fail" cannot be asserted as a test result; it is a review flag
  ([code-validation.md](../code-validation.md) step 5). Verify visually/with device emulation when in doubt.
- **`ContextBanner` background URL caution (`DEV-11`, immediate category).**
  `src/features/topic/components/learning/ContextBanner.tsx:20` interpolates `imageUrl` directly
  into `style={{ backgroundImage: \`url("${imageUrl}")\` }}`. Today values come from local mocks
  (EXISTING), so impact is latent — but once `imageUrl` can be backend- or user-provided content,
  a quote/parenthesis in the value breaks out of the CSS string (style injection risk). Handling
  must be decided (sanitize/allow-list/`<img>` element) before real content flows; blocked on the
  content contract (**UNKNOWN**).
- **No automated a11y audit** (axe/lighthouse) — **NOT AVAILABLE**; only manual spot-checks.
- **`Loading`/`EmptyState` color styling** uses gray literals not drawn from tokens.yaml naming
  (EXISTING `src/shared/components/Loading.tsx`, `EmptyState.tsx`) — noted for awareness; any change
  to them must follow `C-08` (read tokens for the correct values) rather than copy more literals.

## 6. Review checklist (manual)

1. New classes = tokens/scales only; no new arbitrary values (`C-08`).
2. EN/VI hierarchy + page margin per §2 links.
3. Primitives reused (`C-07`); no one-off overlays/inputs.
4. Icon-only controls labeled; decorative icons hidden; active states exposed (`aria-current`) — §4.
5. Invalid states expose `aria-invalid`; errors are not color-only (pair with text, `text-error` token).
6. Touch targets reviewed visually (§5 UNKNOWN flagged, not asserted).
7. No content URL interpolated into CSS without the §5 caution addressed.
8. Evidence recorded via [../code-validation.md](../code-validation.md).
