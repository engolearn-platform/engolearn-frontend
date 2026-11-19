# Placement management FE implementation plan

> Execute in the current authorized feature branch, directly in the D: repo. User approved the HTML and requested coding; do not ask for a second design approval. Use subagent-driven development for independent screen slices; no commit/push.

**Goal:** Complete all eight approved management screens without changing Guest/User or BE.
**Architecture:** Feature-owned types, preview adapter/service, provider/hooks, management views/components; shared management shell and real ADMIN guard. Production fails closed until an API contract is implemented.
**Tech stack:** Existing React19, TypeScript, react-router, Tailwind tokens, Button/Dialog; no new dependencies.
**Spec:** docs/features/placement/management/README.md; approved HTML in the parent workspace admin-ui-review; business docs placement F03/F04/F05.

## Constraints and review focus

Preserve the two pre-existing user edits to PlacementStartCta and PlacementReviewQuestionCard. Preserve every learner file byte for byte except routes.ts additive registration. Check main but never merge/push. Isolated preview records only; do not read or write BE Mongo. Real role USER/CONTENT_MANAGER cannot enter management. Storage corruption/quota produce errors rather than resetting silently. Plain text input, strict CSV parsing/escaping; published snapshots immutable; attempt details pinned to snapshot. No claimed admin API integration from sample data.

- [x] Foundation: types/constants, preview sample, validation/CSV, adapter and useFetch provider; meaningful validation checks against current packaged content.
- [x] Question slice: bank filters/pagination, form errors, statuses, text CSV preview/atomic import.
- [x] Set slice: list/create/version/archive/delete-draft confirmations, editor/picker/order/blueprint, read-only preview.
- [x] Attempt slice: read-only search/filter/list/detail, exact assigned snapshot and no fabricated finalized scores.
- [x] Integrate ADMIN guard/routes and shared sidebar group. Responsive feature subnav; shared shell remains unchanged.
- [x] Build/lint, preview UI checks, compare learner hashes and inspect diff. Real Admin sign-in remains to be verified when BE is running.
- [x] Review route, validation and result behavior. Record verification and limitations in the management docs. No commit/push.

Ruling: DEV preview repository is required for the FE-first approved design because management API does not exist; production is explicitly unavailable. Preview flags never bypass authentication. Ruling: use the existing feature branch and direct repo as the user requested; no alternate worktree/branch or repo copy.
