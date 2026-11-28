# Periodic assessment — learner F01/F02

Current learner specification: 2026-11-06, rules version 2. Current main's cookie
authentication and shared HTTP refresh are reused; no Dev user selector or identity header.
Historical Stitch reference: https://stitch.withgoogle.com/projects/4463842687290353615
The approved Word changes and design-system tokens govern this implementation.

## Routes and components

| Route                                  | Behavior                                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| /assessment                            | Eligibility, quota/cooldown, audio check, rules confirmation and start  |
| /assessment/taking                     | Focused exam; in-memory document binding                                |
| /assessment/history                    | Paginated terminal attempts; one “Xem kết quả” action for valid results |
| /assessment/attempts/:attemptId/result | Shared summary; skills table and live Learning Path recommendation      |
| /assessment/attempts/:attemptId/review | Same summary; all fifty questions, filters and scroll navigator         |

`AssessmentLearningLayout` uses the shared LearningLayout, which supplies the desktop sidebar,
mobile navigation and account header. Result/review share `AssessmentResultSummary`.
The shared navigation enables “Đánh giá trình độ” and links to `/assessment` on desktop
and mobile; the item stays active for assessment subroutes.
Feature components/hooks/types/services remain assessment-owned. Common primitives reuse
existing Button/Card/Dialog and the Hanken Grotesk/primary/learning design tokens.

## Preparation feedback

The start button accepts clicks when preparation data is ready. It lists unmet conditions
near the button, including rules acknowledgement, sample playback and confirmation,
and ineligible account or exam states. Missing conditions prevent a start API request.
The server validates eligibility when a request is sent. The preparation page links to
Placement when the account has no qualifying result. A missing published Periodic
Assessment paper appears separately and offers a refresh action.

## Taking rules

| Stage             | Questions and interaction                                   | Time                                                  |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| Listening singles | 1–10, current only; Next saves/locks; no return             | 30s including 2s preparation and audio                |
| Listening group 1 | 11–15 shown together; any answer editable                   | One 5-minute timer including 2s preparation and audio |
| Listening group 2 | 16–20 shown together; any answer editable                   | One 5-minute timer including 2s preparation and audio |
| Reading           | Any question 21–50 selectable/editable; no Listening return | One 30-minute timer                                   |

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
`NO_WEAK_SKILLS` explains why the result has no recommendation when all measured skills
score at least 50%. `NO_ELIGIBLE_SKILLS` displays the backend message. `ALREADY_CREATED`
tells the learner a path already exists.
The “Tạo lộ trình học tập” button opens the existing confirmation Dialog for `AVAILABLE`.
Opening, cancelling, Escape or dismissing the dialog sends no creation request. Only its
“Xác nhận” action calls `POST /api/learning-paths/by-assessment`, sending the result's native
ID, complete skill-name list and `level` captured when the dialog opened. The dialog
explicitly shows that captured practice level, independently of later recommendation
refreshes or the Assessment's level. `useCreateLearningPath`
prevents repeated clicks, disables dialog actions during creation, aborts the client request
on unmount/identity change and ignores its late result. Request errors remain visible and
require another explicit confirmation to retry. A 409 reloads Recommendation and requires
review and confirmation again; it never silently resubmits a new skill list or level.
This includes the case where the skill names remain identical but the current user
level has changed. Backend validation remains authoritative; the submitted level
records the learner's confirmation and cannot override their current profile level.

Both newly created and already-existing success responses navigate using the returned
`pathId` to `/learning-paths/:pathId?week=1`. The detail page loads with the session cookie
and opens the unlocked Week 1 tab. `ALREADY_CREATED` also provides a link to that owned path.
Creation writes actual path/question snapshots; the Assessment result stays unchanged.

The backend reads native READY Assessment results through AssessmentResults; no legacy
Learning Path projection or background synchronization is required. Missing/foreign or
non-READY sources return 404; unsupported/inconsistent source data returns 409. The
frontend does not fabricate recommendations or convert native source IDs to ObjectIds.

Recommendation is available immediately when the required Learning Path pools are available.

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
staging/Windows acceptance.
The local handoff package includes dated verification results and Windows demo instructions.

### Learning Path level confirmation — 2026-11-26

The confirmation snapshot copies the recommendation and skill values together with
the native source ID. Both dialog text and the creation payload use its level;
later recommendation refreshes cannot replace that confirmed level. No level is
inferred from the page header or the source Assessment.

- `npm run build`: passed; the existing bundle-size warning remains.
- `npm run lint`: passed, zero errors and 73 existing warnings.
- `git diff --check`: passed. No mocked Assessment API was used for verification.
- Browser/real FE proxy integration has not been verified in this change. Manual
  checks: cancel sends no POST; confirm sends the displayed level; changing the
  profile level while the dialog is open produces 409 even with identical skills;
  the dialog closes, a refreshed recommendation must be explicitly confirmed,
  and no replacement POST is sent automatically. Validate with a real account
  and sufficient ACTIVE questions at both practice levels for the identical-skills case.

## Paper management (F03)

`/admin/assessment` opens the content management layout for ADMIN and CONTENT_MANAGER. The draft list supports pagination, creation by series, and opening a saved draft. A new draft of an existing series copies the latest version. The editor supports skills, units, questions, four options, an optional correct answer, passages and transcripts. Removing a unit containing questions requires confirmation. The editor submits the last saved revision, retains local input on conflict and offers an explicit reload. Existing audio references stay attached to copied units.

Content Managers and Admins enter `/admin/assessment` through the shared
`ProtectedRoute`. Editors upload validated WAV files through Assessment, save
the draft, open the validated preview, confirm review of that revision and
publish it. A successful save requires review of the new revision. Archive is
scoped to one published version and does not remove media needed by existing
attempts. Learner media responses can contain a temporary URL in prod or a WAV
payload for local development. Review playback can request a fresh URL after
a failed load. Taking preserves the current issue ID on a transport retry.


Danh sách kỹ năng của editor lấy từ API `/api/v1/assessment/admin/drafts/skill-catalog`.
ADMIN có mục Danh mục kỹ năng dùng API của catalog chung
`/api/management/micro-skills` để thêm định nghĩa, đổi tên tiếng Việt và ngừng sử dụng.
Thay đổi tên hoặc trạng thái dùng revision hiện hành của định nghĩa. Studio chỉ liệt
kê các mã PFC đã có mapping đang hoạt động. Kết quả, xem lại và đề xuất Lộ trình học
hiển thị tên tiếng Việt tương ứng từ catalog, giữ mã và tên chuẩn dùng trong nghiệp vụ.

Trong danh sách Studio, tải mẫu Excel, chọn workbook và 12 WAV của đề, rồi
chọn Kiểm tra và xem thử. Có thể kèm WAV âm thử riêng nếu ghi tên trong workbook.
Khi xác nhận tạo nháp, Studio lưu từng WAV qua Media và mở đúng bản nháp đã tạo.
Nếu lỗi giữa chừng, giữ tệp và thử lại từ màn xem thử. Mục Âm thử dùng chung
là thao tác riêng có xác nhận khi muốn đổi âm thử trước bài của học viên.
Trong xem thử, người soạn có thể chọn đáp án và mở lời giải; đáp án thử nằm trong bộ
nhớ của giao diện. Nút xác nhận mở khi đã xem qua cả 26 phần. Backend chỉ nhận xác
nhận từ tài khoản đã mở preview đúng revision. Lưu chỉnh sửa yêu cầu kiểm lại bản mới.

Khi xem lại và phải tải URL phát mới, player giữ vị trí nghe trước đó nếu còn trong tệp.

## Version 2 listening navigation

During the two-second preparation, Next on an unanswered single sends the current question
with a null choice. The server locks that single and opens the next unit. Choices become
editable when preparation ends. Inside a five-question group Next moves focus locally,
retaining the same audio, editable scope and deadline. Confirming the end of the current
group may close it during preparation. A confirmation crossing the audio-start boundary
remains valid for the same unit. Old-unit and duplicate commands cannot close a later group.
