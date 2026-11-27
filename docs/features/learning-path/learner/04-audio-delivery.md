# Learning Path learner audio delivery

Subsequent data rollout: all 30 ACTIVE B1-V2 passages now reference protected
Cloudinary Media. The 300 legacy Listening snapshots also use their original
recordings via Media; see the [legacy migration](../../../../../engolearn-backend/docs/technical/learningpath/learning-path-legacy-audio-migration-2026-11-27.md) and the
[migration record](../../../../../engolearn-backend/docs/technical/learningpath/learning-path-media-migration-2026-11-27.md).
Earlier step 4/5 scope notes below describe the state when those steps were verified.

Uses the existing DailyAudioPlayer, daily question cards and Narrative design tokens;
no new Figma screen, shared UI primitive or provider integration is introduced.
Applies to practice and result routes described in [practice](02-daily-practice-screen.md)
and [review](03-daily-result-screen.md). Backend contract:
[snapshot audio and renewal](../../../../../engolearn-backend/docs/technical/learningpath/learning-path-day-practice-api.md#snapshot-audio-and-delivery-renewal).

## Data and requests

Practice/result mapping retains the server questionId and audio expiresAt/contentType.
Legacy payloads without expiry remain playable. The existing feature service calls
GET `/api/learning-paths/{pathId}/weeks/{weekNo}/days/{dayNo}/questions/{questionId}/audio`
via shared HTTP/cookie/refresh, no-store and AbortSignal. Validate returned delivery
metadata, safe HTTP(S)/local relative URLs and non-expired expiry before using it.
Do not log, persist or display signed URLs or provider identifiers.

## Player behavior

The native audio player keeps playback/seeking controls. On media error or expired
delivery detected when playing/seeking, pause and show a clear inline message with
an explicit “Tải lại audio” action. Renewal is manual: one request per click, no
background polling or automatic retry loop. The action is also available before
an error. Disable duplicate requests while pending.

Only the player delivery changes on success. Restore the previous playback position
within the loaded duration, playback rate and volume/mute settings. If the player
was playing when renewal/error interrupted it, attempt to resume; if the browser
blocks playback, prompt the learner to press Play. A paused player stays paused.
If seeking cannot be restored, show guidance instead of claiming success.

Audio renewal never calls start, result reload, draft or submit, and does not alter
question page, answer choices, deadline, result metrics or progress. Auth identity
or route/question changes unmount the player and abort renewal; ignore late data.
Pause/abort when practice closes or submits. Access errors (400/401/403/404/409)
stop playback and require returning to the path/signing in as appropriate; temporary
network/storage errors allow another explicit click. No fallback to pool audio or
a different recording. A missing Listening stimulus shows unavailable audio rather
than fabricated sound or demo duration.

## Layout and scope

Use the existing card and Button with mobile wrapping, a labelled native player,
pending/error status text and a 48px retry action. Preserve transcript visibility
only in review. Refresh does not expose answer or transcript data during practice.

Step 5 was authorized and executed on 2026-11-27 using this frontend's real proxy,
an isolated backend/MongoDB and one actual passage audio uploaded to Cloudinary.
The backend temporary learner-delivery publication blocker is removed after the
playback/renewal checks below. Existing local audio migration remains separate work.

## Step 4 verification (2026-11-27)

- `npm run build`: TypeScript and production build succeeded; the existing large
  chunk warning remains.
- `npm run lint`: 0 errors, 73 pre-existing repository warnings; the audio files
  introduce no new warnings. `git diff --check` succeeded.
- No mocked/fixture tests or real Cloudinary/browser integration checks were run
  for this step. The user will review step 4 before authorizing step 5. The actual
  playback, seek restoration, expiry and autoplay behavior still need that review.
- Run the backend implementation on `fix/learning-path-media-with-cloudinary`
  (restart its process to load the new renewal endpoint) with this frontend branch.
  On an accessible existing practice/review day, use “Tải lại audio” and confirm
  the request is GET audio only, answers/page/deadline remain unchanged, paused
  playback stays paused and playing audio restores position when the browser allows it.
- Existing local audio files and unrelated edits in the practice-screen document
  were preserved. No backend publication blocker, live DB, Cloudinary upload or
  local-to-Media migration was changed by this frontend task.

## Step 5 live verification (2026-11-27)

Actual UI at `http://127.0.0.1:13000` proxied to backend `:18080` with an isolated
MongoDB on `127.0.0.1:27019`; no intercepted or fabricated API responses. Demo
content-manager account owned an isolated copy of an existing READY assessment;
its isolated profile was B1. Actual existing B1 questions/passages were copied for
the test. Only the matching source passage used the real uploaded Media asset.

- Created the path through POST by-assessment, opened its detail and started day 1
  through the UI. Question 10 used the actual Number 42 Bus Route recording.
- Native audio reached readyState 4, duration 46.581333 seconds and advancing
  currentTime with no media error. Seeking moved playback to about 23 seconds.
- Manual renewal while paused restored 29.245011 seconds and stayed paused.
  Renewal while playing restored playback and resumed (observed about 39.88 seconds).
- After actual URL expiry, Play paused with the explicit expired-link message;
  manual renewal cleared it and played again. The selected B answer stayed selected.
- Submitted the day through the UI, acknowledged nine unanswered questions;
  review showed 1 answered/1 correct/9 unanswered, the selected B answer,
  transcript and explanation. Review playback and renewal both worked; advancing
  playback was observed after renewal.

Provider and backend authorization evidence, the retained DRAFT/Media IDs and
remaining rollout work are in the owning backend
[verification record](../../../../../engolearn-backend/docs/technical/learningpath/learning-path-media-verification.md).
These technical checks do not attest a human editorial/audio-quality review for
the retained draft and do not migrate existing production snapshots or local audio.
