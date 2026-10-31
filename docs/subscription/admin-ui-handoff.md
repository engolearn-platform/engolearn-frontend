# Subscription management UI handoff

Status: source implemented under the approved subscription-payment-admin plan and test budget. TypeScript, final build/lint and the real browser core flow passed; explicit verification limits are below. Changes are not committed yet.

## Composition and routes

- References inform composition only. No Topic wizard, prices, metrics or infrastructure claims are copied.
- `/admin/subscription/plans` and `/admin/subscription/quotas` use the existing ManagementLayout.
- Page header, scope selector, current/scheduled version summaries, history and a local new-version form follow the design-system Admin/List/Form patterns.
- Shared Button, Dialog, Card, HTTP service and abort-aware useFetch are reused. No new library or global feature primitive.

## State and safety

- ADMIN is checked before protected requests. Identity-generation changes unmount all protected state and abort pending operations.
- Server authorization remains authoritative.
- Both screens publish a complete immutable bundle and preserve fields owned by the other screen, nullable plan descriptions and benefit displayValue.
- FREE/TRIAL have no billing options. TRIAL has no public card; its description/displayOrder are fixed null/0.
- Existing quota types cannot be removed. Known unit/period pairs are canonical and read-only.
- Local editing precedes preview and explicit publication. Pending and historical records cannot be overwritten.
- Conflicts retain form values and require explicit reload. Ambiguous publication retains the same exact body/key for an explicit retry. Accepted results remain visible when refreshed reads fail.
- Missing/malformed/unavailable data never becomes invented empty configuration, limits or prices.

## Responsive and accessibility checks

Inspected widths: 390px and 1024px. Observed document widths were375/1009px (vertical scrollbar) and at most1024px for the desktop editor; no document horizontal overflow. The plans editor, conflict state and pending configuration were inspected. Only the history table container may scroll horizontally. Preview and version detail use the existing Dialog. Keyboard/error associations beyond the observed core flow are not exhaustively verified.

## Evidence

- Frozen Java Admin request/response DTOs and controller match the FE interface. Response validation distinguishes business UTC millisecond-resolution instants from generic envelope RFC3339 timestamps.
- Single authorized focused compiler check: `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit`, exit 0, no output; completed before observed `2026-10-29T22:45:29.0655297+07:00`.
- `git diff --check` passed, with only the repository's LF/CRLF normalization advisory. Source text was independently reread after writing.
- No response mocks or database mutations were used by the FE implementer. Type checking does not verify server authorization or publication semantics.
- Root final build and lint each exited0. Build completed9.16s; lint reports72 warnings/0errors, matching the previous warning count. Bundle-size warning remains.
- Real FE proxy/browser core flow passed: User/ContentManager/Guest guard; actual Admin email/role; Free/Trial reads; preview, Trial v2 save and history; Free pending v2/detail and disabled editing; dirty Trial form preserved after REVISION_CONFLICT. API replay returned the original accepted result and a new stale request returned409.
- Complete existing learner summary remained identical after Trial publication. Canonical identifier ordering changes array order; all metadata, nullable description, displayValue, limits and explicit display orders were preserved. Live configuration remains approved Speaking3600 DAILY, assessment Free1/Trial2 MONTHLY, and no Premium price.
- Missing Premium showed an explicit empty state and blank form, with no invented price or quota. That local form and the conflict draft were discarded without publication. Original User identity/usage page and viewport were restored; the temporary browser tab was closed.
- Evidence and screenshots live in workspace `.artifacts/subscription-payment-admin/`. No real network-loss/ambiguous-retry/refetch-failure experiment or complete keyboard audit was performed. These paths have source safeguards; type/build success is not proof of those failure behaviors. M3 checkout/payment actions remain absent.

## Follow-up notes

- Replace technical copy such as "ảnh chụp quyền lợi" with user-facing wording about keeping the current period's benefits when revisiting copy. Configuration labels and CURRENT/SCHEDULED/HISTORICAL are currently explicit Admin concepts.
- The existing development identity selector can overlap the management header; it is a local test aid rather than production UI. No global shell/debug-tool redesign was included.
- Free v2 is scheduled for00:00 Vietnam on30October2026 in the isolated verification database. It preserves all approved values. No midnight wait or real changed-limit reset was exercised in the browser; consult the backend ledger for component coverage and remaining combined-path test.

## Operational flow and ownership

The new routes are owned by the subscription feature and use the existing shell through a guarded wrapper. The guard supplies real email/role context and remounts the subtree on identity generation. Optional shell context preserves Topic defaults for all existing callers.

The plans editor changes metadata, benefits and explicitly authored Premium billing options. The quota editor changes limits/type metadata. Disabled other-surface sections remain part of the complete publication body. Blank Premium requires explicit fields in both sections. Existing quota types cannot be removed; historical content missing current types requires explicit addition rather than silent copying.

Preview confirmation shows actual changed quota types, computed effective time and scope impact. The final save result is authoritative; Free's preview time may differ if accepted after midnight. Conflicts preserve local input and require cancel/reload. Ambiguous transport/server failure freezes editing and exposes explicit retry with the same exact body/key; it does not generate a replacement intent. Cancel is disabled while a publication is uncertain. Accepted results remain outside refresh state.

The shared HTTP service has one backward-compatible change: validated RFC7807 fieldErrors are retained for field association/focus. Existing status/code/detail handling is preserved. No HTTP parsing or feature imports were added to other features.
