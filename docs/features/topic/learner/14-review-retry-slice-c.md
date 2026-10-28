# Slice C - review and retry consumer

Scope: read-only current-result review, item/topic retry confirmation, resume/restart and frozen next-item progression. Hide/unhide while a session is running is excluded by the user's scope decision; existing410 denial remains. No UI redesign or new global primitive.

## Implemented consumer behavior

- Review stays on the attempt route with `mode=review`; reuse lesson content and quiz presentation with answer inputs disabled. Select learned content or any completed quiz, display correct feedback and first-try label, never wrong submission history. GET review is read-only; separate access event changes recency only.
- Every new/restarted retry requires a confirmation. Capture the observed retrySessionId when opening the dialog so a refreshed detail cannot silently authorize replacement of a newer session. Cancel sends no request.
- Resume an active attempt directly. A topic session between items starts `nextTopicItemId` explicitly with its retrySessionId; GET never starts one. The frozen snapshot comes from BE.
- Running retry uses the lesson/quiz flow and authoritative AttemptDto mode/session. Results and detail keep the official previous score until each item completes; FE never calculates replacement scores.
- Replaced sessions and superseded result references clear the displayed learning/review state and lead back to refreshed topic actions. No automatic answer resend with a new key.

## Verification budget

Build PASS (existing bundle-size warning); lint --quiet PASS; type drift PASS53 schemas; diff check PASS. These were run once after consumer code stabilized. No fixtures or historical mocked suites were used.

Parent live acceptance: one focused56-request real clone scenario verified review GET read-only, TOPIC retry resume, old3/6 retained until item completion, lower new0/6 replacing it, aggregate24/30=80%, explicit next-item start and stable frozen manifest. Replacing stale R1 and advancing its old attempt both returned409 while R2 remained intact. Browser review selected the first solved quiz with every option disabled and firstTryCorrect=false; cancelling the retry dialog left session/attempt DTOs unchanged. No FE code change followed this acceptance. The parent owns the raw evidence and final backend package check.

Limits: no network fault injection, hide/unhide scenario or repeated full-topic run. Hide/unhide during an active session remains explicitly outside this change. This report does not claim a new UI redesign or full-repository test pass.

Review uses `useTopicReview` and `TopicReviewView`, retaining the attempt route and selecting content by stage/index or solved quiz by quizId. Optional local quick-check buttons are also disabled during review; audio remains optional and interactive. A RESULT_CHANGED access/read conflict removes the displayed review data and leaves a route back to current topic actions.

`useTopicLaunch` stores observedRetrySessionId in the dialog selection. New/restarted retry always confirms; resume navigates a current attempt or explicitly starts the BE next item. Main detail and results expose resume controls. Running retry validates a non-null session ID and shows a retry context label, while official scores remain server-owned. Replaced-session read failures clear invalid temporary answer/completion descriptors and reload the attempt without issuing a mutation.
