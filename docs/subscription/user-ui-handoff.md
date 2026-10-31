# Subscription learner UI handoff and implementation notes

Updated: 2026-10-29. Scope: M1 + M2 user screens with real API integration; M4 is backend contract testing only. This replaces the initial readiness survey. Payment runtime and actual Speaking/Proficiency UI/producer work remain deferred. M3 now has fact declarations only; M5 Admin implementation and evidence are tracked in [admin-ui-handoff.md](admin-ui-handoff.md).

## Sources of truth

1. Business rules in the sibling engolearn-business-docs-and-tools repository: Subscription module/F1/F2/F4 and Speaking/Proficiency rules. Images never establish prices, quotas, CEFR/resource access or promised features.
2. Backend docs/technical/subscription-quota/quota-api.openapi.yaml is the IMPLEMENTATION_CONTRACT for three reads and Trial POST. Technical design/ADR preserve ownership and accepted event-delivery limits.
3. FE docs/architecture/project-structure.md, docs/design-system/* and .opencode/skills/frontend-ui/SKILL.md define placement/reuse/tokens. No new library or feature-to-feature import was introduced.
4. Image references in D:/university/4/hk1/www/project/screen/subscription guide composition only. Retain the correction registry below for future redesign/Admin work.

## Implemented routes and code ownership

| Area | Existing implementation |
| --- | --- |
| /subscription | src/features/subscription/views/learning/SubscriptionPlansView.tsx: public offers, separate current-benefits summary, eligible Trial confirmation/action |
| /subscription/usage | src/features/subscription/views/learning/SubscriptionUsageView.tsx: dynamic current-user quota overview with per-card boundaries |
| Feature routes | src/features/subscription/routes.ts, src/router.tsx, shared/constants/app.constants.ts and learner navigation |
| Contract boundary | Feature types/subscription.types.ts and services/subscription.service.ts validate complete responses; malformed data is unavailable, never coerced zero |
| Loading/refetch | Feature hooks/useSubscription.ts uses shared abort-aware useFetch and stable callbacks |
| Shared UI | Feature components/SubscriptionUi.tsx plus existing LearningLayout, Button, Dialog and shared primitives; token-backed composition |
| Auth isolation | src/shared/hooks/useAuth.tsx uses abort/generation and dev storage-change invalidation; private subtree keyed by identity generation; old private data hidden on identity change |
| HTTP errors | src/shared/services/http.service.ts preserves ProblemDetail code; unrecognized server/network detail uses a friendly unavailable message |

Feature-relative paths above start at src/features/subscription/. AuthUser still represents identity, not subscription tier/eligibility. LearningLayout's existing hardcoded learner greeting/streak/level remains outside this change; it is not authoritative account data. Production sign-in/navigation is not implemented by the dev user switcher.

## State and action rules

| State | Current implementation / next action |
| --- | --- |
| Guest | Public plans remain readable; private state explains authentication requirement; no invented login URL or claimed Trial eligibility |
| Auth loading/error | Distinct states; no guessed Free/zero. Identity retry is available; old account results cannot restore private data |
| Free, eligible | Current Free benefits; explicit one-time seven-day Trial confirmation and real POST |
| Free, ineligible | No activation; explanation from confirmed eligibility/reason |
| Active Trial | Display server period dates/current snapshot benefits and used-Trial explanation; no second activation |
| Active Premium | Current period/benefits presentation; no repurchase or mid-period cycle-change action; live paid state not exercised |
| Expired/Refunded | Use effective tier with historical period reason; no client inference of content/resource access |
| Trial submission | Immediate duplicate-submit guard; UUID intent retained across ambiguous retry; no automatic action retries; successful result triggers read refresh |
| Accepted Trial with failed read refresh | Acceptance message remains separate from unavailable refreshed summary; never invent the new entitlement locally |
| Purchase/payment pending | Not implemented. No working-looking dead checkout or simulated success; later Payment contract is required |

Trial POST /api/v1/subscription/me/trial sends an empty object plus Idempotency-Key, never a user ID/client clock/policy. Backend confirmation controls success. Public offers describe the latest configuration; currentBenefits describes current immutable period rights. Raw policy snapshot IDs and implementation jargon are not rendered to learners.

## Quota semantics to preserve

- Render the applicable quota array, not a fixed two-item catalog or Free/Premium comparison. Current server values/units/periods are authoritative. No browser call can consume or record usage.
- Each quota uses its own UTC windowEndsAt displayed in Asia/Ho_Chi_Minh: next day/Monday/month at00:00, not a global23:59:59 or device timezone. Show allowanceStartAt when a policy reset differs from calendar start.
- Actual used may exceed limit. Keep the number, clamp remaining to zero and only bound graphical progress. Handle limit0 without division errors. Include textual/accessible status and exact usage.
- Loading, failed/malformed response and unavailable complete summary never become zero. A confirmed empty array is distinct from missing data. Refresh hides known-stale figures while pending/error.
- Tier changes/new periods apply current limits immediately while retaining current-window usage. Only eligible delivered Free policy changes reset; publishing a Premium/Trial version does not reset existing snapshots.
- Availability does not establish assessment cooldown eligibility or terminate an already granted attempt. Speaking per-turn accounting and Proficiency start atomicity belong to their callers/backend contracts, not FE arithmetic.

## Reference-design corrections and future-use registry

| Reference content | Current handling / future requirement |
| --- | --- |
| Learner shell, current summary, plan/usage cards and cross-links | Reused existing shell/tokens; adapt composition, no pixel-copy promise |
| Prototype warnings and state toggles | Not included in product screens; dev identity switcher is existing local auth infrastructure, not an entitlement scenario toggle |
| Premium active plus buy CTA / Free marked current | Correct current-state presentation; no mid-period purchase or false current-plan badge |
| Missing Trial action/states | Implemented confirmed eligibility, dialog, real activation, error/retry and refreshed Trial summary |
| Upgrade must wait for a later quota cycle | Corrected: current limit applies immediately and usage is retained |
| Global reset clock / device timezone | Replaced by per-card server boundaries in Vietnam time |
| Raw policy version/snapshot terminology | Removed from learner copy; keep IDs internal for contract/state correctness |
| 199000 VND,33% discount,30-day month,extended Premium Speaking | Not copied; actual values require approved configuration. Do not infer month end from client clock |
| Free A1-A2/Premium all CEFR content access | Unsupported by Subscription alone; requires Topic Learning resource rules and approved benefit metadata |
| IPA/waveform,flashcards,24/7 support | Not promised; require separately authorized feature/benefit scope |
| Automatic charge/cancel/grace/bonus/reset buttons | Not introduced; preserve MVP exclusions |
| Admin reference screens | Corrected in M5: reuse the management shell with actual Admin context; no invented metrics/Redis/PostgreSQL. Immediate rights updates and blanket no-reset rules still must not become requirements. See admin-ui-handoff.md |

## Contract dependencies and deferred work

Three real GETs are /api/v1/subscription/plans, /api/v1/subscription/me and /api/v1/quota/me/usage. Successful responses use data/timestamp; protected reads require server identity. Keep currentBenefits/trialIneligibilityReason and quota allowanceStartAt aligned with OpenAPI. Trial is PREMIUM tier plus TRIAL status.

No payment provider, purchase action, pending-intent read, reconciliation/refund action or real Speaking/Proficiency implementation was added. M5 Admin screens are documented separately. M4 mock-caller tests prove real Quota interfaces and transaction behavior, not real learning actions. Production sign-in and historical account migration remain separate readiness gates.

No Outbox/replay/reconciliation is promised. Missed early refund or Free reset may leave stale state under ADR-0001; FE cannot repair this by changing counters. Retained history does not imply resource-specific lifetime access.

## Verification and limits

- First final npm.cmd run build passed; npm.cmd run lint passed with0errors/72warnings (legacy imports and fast-refresh export warnings remain). Build has an application bundle-size warning.
- Live-found raw snapshot wording was corrected, followed by one additional build that passed. Lint was not repeated for text-only changes; no unrelated style cleanup.
- Real FE proxy reads: public plans200, confirmed Free summary200 and usage200; anonymous quota401. Backend was provisioned through its real operator manifest in a separate replica-set database, not through browser fixtures/direct counter inserts.
- Browser: real dev-user activation dialog and accepted Trial summary observed; exact seven-day dates and assessment limit2 after refresh. Dev user is a nonproduction identity, not proof of production sign-in.
- Real replay check exposed timestamp precision mismatch; backend normalized accepted timestamps and its new exact-replay regression passed. Final live replay retest passed with identical period/start/end and seven-day duration; guest hides private quota, identity changes replace period details, and inspected mobile390/desktop1024 layouts have no document horizontal overflow. Evidence is in the workspace execution-log.
- Backend full verify failed in existing Topic tests/context. Quota's eager initializer regression was fixed; the remaining offline smoke failure reaches unchanged TopicAttemptService. Do not report the whole project green.
- Unknown-commit network injection, real producer usage, paid Premium states, production auth and all possible assistive-technology/device combinations are not verified. No screenshot/scenario switcher is substituted for integration evidence.

Evidence and budgets live in workspace .artifacts/subscription-user-first/{execution-log,test-plan,agent-c}.md. Update this handoff and backend status in the same change as future routes/contracts/states; distinguish source implemented, tested with fake caller, live observed and still deferred.
