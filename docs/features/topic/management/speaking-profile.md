# Speaking Profile editor

Topic owns the management editor at `/admin/topics/:topicId/speaking-profile` and its Item-scoped variant. The view is `src/features/topic/views/management/TopicSpeakingProfileView.tsx`; profile requests stay in `topic-speaking-profile.service.ts`, while the stable DTOs are published by Speaking's contract.

## Initialization and persistence

The GET response initializes the form in this order: saved draft, saved published profile, read-only `initialProfile`, then an empty disabled profile. Defaults are displayed as editable field values and are never saved automatically. An initial draft save is available even if the defaults have not been edited. Incomplete enabled profiles can be saved with warnings; publication requires a saved, unchanged draft and an available released content scope. Publishing is an explicit profile-only action.

The selector uses saved working Item resources, including DRAFT. Reopening the editor loads the latest saved catalog. Selections whose occurrence IDs still match remain checked. A removed or replaced occurrence stays visible as an unavailable selection until the editor removes or reselects it. Enabled publication checks the selected IDs against the live content catalog.

The view uses a request generation guard for scope changes and retries. Save and publish errors retain edits, show structured server violations when present, and retry the same operation. Revision conflicts ask the editor to reload and confirm before replacing dirty edits. Dirty forms warn before a browser close/reload and before the editor's back link. A server acknowledgement is required before showing success.

## Resource selection

Topic profiles render independent Item accordions with tri-state native checkboxes. The bulk checkbox selects every currently eligible resource in its Item, including when the accordion is collapsed. Search narrows visible Item groups and initially opens matches without coupling later disclosure actions to selection. Item profiles retain a flat resource list. Selected references absent from the eligible catalog remain visible as stale and can be explicitly removed. Search and disclosure state are temporary UI state; only explicit resource references are saved. Pure selection/search rules are covered by `tests/speaking-resource-selection.test.mjs`, included in `npm run test:speaking`.

The editor surfaces local required-field checks and server `publishViolations`/`publishedViolations`. It does not add goals, turn minimums, grading controls, or resource count requirements.
