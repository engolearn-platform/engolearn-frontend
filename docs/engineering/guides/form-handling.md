# Guide — Form handling

> **Purpose:** The controlled-draft form pattern used in this codebase (`draft` / `patch` /
> `isValid` / `showErrors`), the dialog add/edit flow, inline error display, and the standing
> position on form libraries.
> **Scope:** Inputs, validation display, and dialogs under `src/features/**`. No form library is
> installed or proposed for immediate adoption.
> **Owner:** Frontend engineering docs — update when the pattern changes with code (`C-11`).
> **Status:** PROPOSED (guide); all cited code behavior is EXISTING.
> **Relationships:** [../implementation-constraints.md](../implementation-constraints.md) `C-07`, `C-13` ·
> [../../design-system/patterns.md](../../design-system/patterns.md) (Form Pattern — link, not copied) ·
> [../../design-system/components.md](../../design-system/components.md) (Button/Dialog specs) ·
> [../decisions/README.md](../decisions/README.md) `D7` · [form state layers: state-management.md](state-management.md) ·
> [../../architecture/project-structure.md](../../architecture/project-structure.md) (feature component placement)

## 1. Controlled-draft pattern (EXISTING, mandated by `C-13` for new forms)

Shape (hook owns the draft; view owns when to show errors):

| Piece | Where | Role |
|---|---|---|
| `draft` | `useState<...Draft>` in a feature hook | full form value, single source of truth |
| `patch(partial)` | hook helper | partial update: `setDraft(prev => ({...prev, ...patch}))` |
| `isValid` | hook, derived from `draft` | boolean gate for submit; **computed, never stored** |
| `showErrors` | `useState(false)` in the **view** | flipped on failed submit; passed down as a prop |

Grounded example — hook
([`src/features/topic/hooks/useTopicBasicInfoForm.ts`](../../../src/features/topic/hooks/useTopicBasicInfoForm.ts)):

```ts
const [draft, setDraft] = useState<TopicBasicInfoDraft>(() => ({ ...TOPIC_CREATE_DEFAULT_DRAFT, ...initial }));
const patch = (patchValue: Partial<TopicBasicInfoDraft>) =>
  setDraft((prev) => ({ ...prev, ...patchValue }));
const isValid = draft.titleEn.trim().length > 0 && /* …required fields… */;
return { draft, patch, setCefr, addTag, removeTag, descriptionCount, isValid };
```

Grounded example — view owns `showErrors`
([`src/features/topic/views/management/TopicUpsertBasicInfoView.tsx:27`](../../../src/features/topic/views/management/TopicUpsertBasicInfoView.tsx)):

```ts
const [showErrors, setShowErrors] = useState(false);
// on submit attempt: setShowErrors(true); if (isValid) …
// passed into the form card: <TopicGeneralInfoCard showErrors={showErrors} … />
```

Field-level display (EXISTING pattern in `TopicGeneralInfoCard.tsx:39-42`):
`const titleEnError = showErrors && draft.titleEn.trim().length === 0;` — errors are **derived per
render**, not stored, and the input exposes them via `aria-invalid` (e.g. `:72`).

## 2. Dialog add/edit flow (EXISTING)

Upsert dialogs (`ExpressionUpsertDialog`, `QuestionUpsertDialog`, `VocabularyUpsertDialog` under
`features/topic/components/management/upsert/editor/**`) follow one shape:

```ts
interface …DialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Item;          // edit only
  onClose: () => void;
  onSubmit: (draft: …) => void;   // parent applies the change; dialog never owns the list
}
```

Flow:

1. **Open** — parent sets `open` (+ `initial` for edit; computed `nextIndex` for add).
2. **Initialize** — local state seeds from `initial` (or empty defaults) in an effect keyed on
   open; **reset the submit flag** (`setSubmitted(false)` — e.g.
   `VocabularyUpsertDialog.tsx:89,105`) so a previously failed attempt doesn't show errors
   immediately on reopen.
3. **Edit while typed** — `submitted` flag gates errors exactly like `showErrors`
   (`VocabularyUpsertDialog.tsx:108-111`, `QuestionUpsertDialog.tsx:133+`, `ExpressionUpsertDialog.tsx:116+`).
4. **Submit attempt** — `setSubmitted(true)`; if all derived error flags are clear, call
   `onSubmit(draft)`; parent updates its data and closes.
5. **Cancel/close** — `onClose()`; parent toggles `open`. Dirty-check/discarding is **not**
   standardized (UNKNOWN whether wanted — register a decision if needed).

Dialogs reuse the shadcn `Dialog` primitive (`@/core/components/shadcn/dialog`, `C-07`).

## 3. Inline errors (EXISTING conventions)

- Required marker: `*` rendered with `aria-hidden` + `text-error` token class
  (`TopicGeneralInfoCard.tsx:25`, `VocabularyUpsertDialog.RequiredMark`).
- Field errors render next to the field (message text comes from the view/hook — UI copy, not a
  backend contract; real backend validation messages are **UNKNOWN** until a contract exists).
- Submit-blocking summary: editor views render `{showErrors && !isValid && (…)}`
  (e.g. `TopicItemVocabularyEditorView.tsx:151`, `TopicItemQuizEditorView.tsx:178`,
  `TopicItemExpressionsEditorView.tsx:194`) — same-file pattern, keep it when adding screens.
- Native `<select>` is used in 7 files today (EXISTING, `DEV-09`) — grandfathered; new forms should
  first check whether a primitive exists (`C-07`) and any outcome of decision `D7`.

## 4. Form library — standing position (`C-13`)

- **No form library installed** (EXISTING: `package.json` has no react-hook-form/final-form/zod).
- The controlled-draft pattern is **PROPOSED as the default**; adopting a library is open decision
  `D7` (status PROPOSED — undecided). Until `D7` is accepted with choice + rationale, new forms use
  §1–§3; do not mix a library into one feature "as a trial".

## 5. Checklist for a new form

1. Draft hook (`draft`/`patch`/`isValid`) in `features/<d>/hooks/`, types in `types/` (`import type`).
2. `showErrors`/`submitted` owned by the view/dialog, derived field errors per render.
3. Reuse shadcn `Button`/`Dialog` (+ any existing field primitives); no arbitrary styles (`C-08`).
4. `aria-invalid` on inputs, `*` marker convention, submit-block summary.
5. Loading/empty/failure branches if the submit hits a service (service itself follows
   [api-integration.md](api-integration.md)).
6. Doc update in the same change (`C-11`) + [../code-validation.md](../code-validation.md) run.
