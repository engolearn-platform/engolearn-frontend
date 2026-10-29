# Slice B - completion and results

Current UX delta (2026-10-29): item results expose exclusive resume/new retry and no restart/replacement; whole-topic results expose confirmed generation-based reset rather than creating TOPIC retries. Old owned result/review links return to refreshed detail on TOPIC_RESET. Next-item mutations carry topic/generation journal metadata. Learning retains the final quiz feedback until Continue and uses a stable footer. The remaining verification section below is historical slice-B evidence; current change evidence is recorded separately in verification.md and the task report.

Implementation and live acceptance date: 2026-10-28. The parent integration run supplied the observed BE/browser outcomes below. Review and retry lifecycle implementation remain Slice C.

## Routes and presentation

- Item result: `/topics/:topicId/attempts/:attemptId/result`.
- Topic result: `/topics/:topicId/result`.
- Both routes precede the parameterized topic/attempt entries in the topic route array. Existing attempt/review routes stay unchanged.
- `TopicResultScore` displays server `firstTryCorrectCount/totalQuizCount` and `accuracyPercent`, with completion status. It never calculates a local score or averages item percentages.
- Item result loads `getItemResult` plus fresh topic detail because ItemResultDto has no item action object. Current completedAttemptId/actions govern review/retry buttons. Superseded result references fail with RESULT_CHANGED.
- Next item comes exclusively from `nextTopicItemId/nextItemAvailability`. The explicit button starts/resumes that item with a journaled POST; no index+1, no attempt creation by GET.
- Topic result uses server aggregate counts and per-item results. Review/retry actions reuse the existing launch entry only when both result and current detail allow them; no Slice C view/session implementation is added.
- A topic-result link appears in detail and item result only when the server detail marks the topic COMPLETED.
- Use existing Button/Dialog/TopicState, Hanken Grotesk, theme tokens and fluid cards. Actions wrap on mobile and have 48px minimum height; no XP, timer, fake audio or invented media.

## Lesson completion and recovery

- Final correct response already contains COMPLETED and position:null. Keep feedback until Continue, then open item result; opening/reloading a completed attempt redirects directly to item result and does not request normal content or advance.
- A legacy running attempt can already have all answers stored while GET quiz returns quiz:null. This displays an explicit Complete lesson action, not a fabricated completion or result.
- `POST /topic-attempts/{attemptId}/completion` sends `{revision}` and Idempotency-Key, returning authoritative AttemptDto. The request is journaled separately from the old pending answer and restored across reload. An uncertain response keeps the same body/key; 409 refreshes state and waits for user action, 410 returns to detail.
- Read authoritative quiz state even if an old answer request is pending. If GET or completion confirms COMPLETED, clear old pending-answer/completion descriptors and route to the result. Do not resend the final answer or replay its old IN_PROGRESS receipt forever.
- CONTRACT_MISMATCH/INVALID_RESPONSE preserve the uncertain action identity but display a state/response mismatch with a progress reload action, rather than calling it a network failure. Genuine network uncertainty keeps the exact answer retry action.
- No GET repairs state, no local first-try score, no reset, and no completion from `quiz:null` alone.

## Refresh and boundaries

Result reads fetch current detail/action references. Detail/progress and My Topics have no durable result cache: navigation remounts their existing useFetch hooks and reads BE again, so list membership/counts remain server-owned. Result refresh and conflict handling refetch their resources without repeating mutations.

Parent owns the OpenAPI/generated DTO and completion service method. This consumer uses CompleteAttemptRequestDto and the existing ItemResultDto/TopicResultDto. The new completion contract is synchronized before consumer commit.

## Verification

Parent evidence and precise limits: [13-slice-b-live-verification.md](13-slice-b-live-verification.md).

- `npm run build`: PASS; existing bundle-size warning remains. No code change was needed after the parent browser acceptance; the completion CTA already suppresses the quiz-loading placeholder when no question remains.
- `npm run lint -- --quiet`: PASS (0 errors). `npm run topic:types:check`: PASS (52 schemas). `git diff --check`: PASS. The parent completed the final integration review before consumer commit.
- No historical mocked suites, fixture server or injected fetch is used as verification.
- Existing learner browser: explicit legacy recovery opened item result with 3/6 = 50%; reload retained the result, and the next-item button opened the next attempt at CONTEXT/0. DB inspection preserved 12 submissions while revision advanced from18 to19. The browser run began without a saved pending-answer descriptor, so it is not proof of restoring that descriptor under a network fault.
- DB clone: real HTTP completed five items/30 quizzes with aggregate 27/30 = 90%; the topic-result UI displayed that server result. Wrong/reload/replay were exercised for both quiz types; this was not inferred from one item or seeded completion.
- Fresh clone learner browser: final correct answer kept feedback at 100% until Continue; Continue opened item result with 6/6 = 100%. At mobile viewport390x844 the result actions wrapped without horizontal overflow.
- Real concurrent requests with different keys and the same quiz revision returned [200,409]; the winner replay remained stable. Parent records the precise HTTP/DB requests and final receipt compatibility/rounding checks in the integration evidence.
- Uncertain-network response loss/fault injection remains untested. The persisted exact-request implementation is not reported as a live network-recovery pass. Slice C review/retry acceptance is outside this change.
