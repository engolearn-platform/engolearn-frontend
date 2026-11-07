# Periodic assessment — learner F01/F02

Current learner specification: 2026-11-06, rules version 2. Current main's cookie
authentication and shared HTTP refresh are reused; no Dev user selector or identity header.
Historical Stitch reference: https://stitch.withgoogle.com/projects/4463842687290353615
The approved Word changes and design-system tokens govern this implementation.

## Routes and components

| Route | Behavior |
| --- | --- |
| /assessment | Eligibility, quota/cooldown, audio check, rules confirmation and start |
| /assessment/taking | Focused exam; in-memory document binding |
| /assessment/history | Paginated terminal attempts; one “Xem kết quả” action for valid results |
| /assessment/attempts/:attemptId/result | Shared summary; skills table and live Learning Path recommendation |
| /assessment/attempts/:attemptId/review | Same summary; all fifty questions, filters and scroll navigator |

`AssessmentLearningLayout` composes the shared LearningLayout with the standard fixed desktop sidebar,
server-provided identity and no invented learner name/level/streak. Optional layout props
preserve other features' existing defaults. Result/review share `AssessmentResultSummary`.
Feature components/hooks/types/services remain assessment-owned. Common primitives reuse
existing Button/Card/Dialog and the Hanken Grotesk/primary/learning design tokens.

## Preparation feedback

The start button accepts clicks when preparation data is ready. It lists unmet conditions
near the button, including rules acknowledgement, sample playback and confirmation,
and ineligible account or exam states. Missing conditions prevent a start API request.
The server validates eligibility when a request is sent.

## Taking rules

| Stage | Questions and interaction | Time |
| --- | --- | --- |
| Listening singles | 1–10, current only; Next saves/locks; no return | 30s including 2s preparation and audio |
| Listening group 1 | 11–15 shown together; any answer editable | One 5-minute timer including 2s preparation and audio |
| Listening group 2 | 16–20 shown together; any answer editable | One 5-minute timer including 2s preparation and audio |
| Reading | Any question 21–50 selectable/editable; no Listening return | One 30-minute timer |

The countdown runs during the two-second preparation and keeps the same server deadline
when audio starts. Group finish opens confirmation and locks the group when accepted. Unused time never
carries. Reading has no preview/per-passage timer; question 50 does not submit. A separate
confirmed Submit ends the whole attempt, or the server auto-settles saved answers at
expiry. Early submission remains available from any stage. Normal audio has no seeking,
replay or speed control and starts no earlier than server `audioStartsAt`; blocked autoplay
shows an activation button and does not pause time. Moving to a new unit stops old audio.
Review playback may replay. No silent audio fallback or timing/refund extension is invented.

`AssessmentTakingV2` handles version 2; the original taking renderer handles active legacy
snapshots. Legacy numbering, 01/11 preview skipping, immediate group/final-Next behavior
and review answers remain supported. New BE starts require a version-2 published paper.
Correctness and section grading come from snapshot metadata, not question-number assumptions.

`useLiveAssessment` serializes autosave/Next/finish/submit mutations and rejects older
state revisions. Draft choices remain visible on save failure, with a reselect-to-retry
action. A failed answer in the current editable scope blocks advancing/submitting until
saved; a failure from an expired scope is disclosed and cannot block all later stages.
The server decides deadlines and editable scope. A late selection is not represented as a
saved answer. A retry-stable audio issue ID permits transport retry without an extra play.

The binding, taking answers and audio are memory-only. Reload/new documents cannot resume.
SPA departure/pagehide attempts cookie-authenticated keepalive abandon; visibility changes
do not abandon. Network/poll/save errors remain visible. Abrupt closure without delivery
keeps server deadlines running. NO_RESULT is distinct from a valid zero score.

## Results, review and responsive behavior

Result and review share the same responsive content width, padding and title placement.
History uses consistent “Lịch sử đánh giá” wording and one result action. The result summary
contains “Xem chi tiết”. Skills take one desktop half; the other half displays the
cookie-authenticated Learning Path recommendation. Columns stack on mobile.

`useLearningPathRecommendation` requests
`GET /api/learning-paths/recommendation/by-assessment?assessmentAttemptId=<result.id>` only
after a valid result loads, through shared HTTP with cancellation and assessment identity
guards. No ID mapping, identity override, or cross-feature import is kept in the frontend.
Loading, errors and retry stay within the recommendation card and leave the result visible.
`AVAILABLE` shows returned skills, scores, level, weeks, days/week and questions/day; the
total question count is their product. Canonical micro-skill names remain unchanged.
`NO_WEAK_SKILLS` hides the card and expands the skill column; `NO_ELIGIBLE_SKILLS` displays
the backend message; `ALREADY_CREATED` tells the learner a path already exists.
The “Tạo lộ trình học tập” button opens the existing confirmation Dialog for `AVAILABLE`.
Opening, cancelling, Escape or dismissing the dialog sends no creation request. Only its
“Xác nhận” action calls `POST /api/learning-paths/by-assessment`, sending the result's native
ID and the complete skill-name list captured when the dialog opened. `useCreateLearningPath`
prevents repeated clicks, disables dialog actions during creation, aborts the client request
on unmount/identity change and ignores its late result. Request errors remain visible and
require another explicit confirmation to retry. A 409 reloads Recommendation and requires
review and confirmation again; it never silently resubmits a new list.

Both newly created and already-existing success responses navigate using the returned
`pathId` to `/learning-paths/:pathId?week=1`. The detail page loads with the session cookie
and opens the unlocked Week 1 tab. `ALREADY_CREATED` also provides a link to that owned path.
Creation writes actual path/question snapshots; the Assessment result stays unchanged.

The backend adapter currently requires imported Learning Path projections, keyed by
`assessment_source_attempt_id`. Newly submitted assessments without a projection return
404 with retry feedback. Automatic projection delivery remains separate work; the frontend
does not fabricate missing recommendations or use native IDs as ObjectIds.

Review defaults to all fifty original questions with selected wrong/correct/blank text,
correct option, explanation and available transcript/audio. Filters are buttons: Đọc/Nghe
and Đúng/Sai/Chưa chọn. Section and outcome combine; clicking an active filter clears it.
The fifty-cell navigator disables filtered-out questions and scrolls/focuses a visible
question. The review question navigator can collapse and content expands. Desktop columns
stack on small screens; navigation/actions use 48px targets and text/icon status labels.
The server sends two or five skill rows according to retained access; FE never computes
hidden analysis or hardcodes quota count.

## Auth integration

Guests are redirected to /login with their local destination. GuestOnlyGuard and AuthForm
share one validated return-path function so session changes do not redirect the learner to
/ before the form can return to /assessment. Invalid credentials remain a form error and do
not replace the form with the session-bootstrap error screen. No token enters web storage.
See [authentication](../auth/README.md) and [shared HTTP](../../engineering/guides/http-service.md).

## Validation and remaining boundaries

Required commands: `npm run build`, `npm run lint`; integration uses real FE proxy + real BE,
never a mocked assessment API. Review keyboard navigation, mobile overflow, audio timing,
failed-save/deadline transitions, owner/binding checks and historical snapshots.
Build/lint and API/real-browser results have separate meanings. The release still requires
real Placement/baseline, exact refund-to-analysis delivery, approved content/media and
staging/Windows acceptance. Automatic Learning Path projection delivery remains open.
The local handoff package includes dated verification results and Windows demo instructions.
