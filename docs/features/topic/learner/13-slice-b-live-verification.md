# Slice B - live verification (2026-10-28)

Scope: completion, results, next-item permissions and recovery of the already-answered Slice A attempt. C remains unimplemented. No fixture server, injected fetch, synthetic completion, database reset or replica-set conversion was used.

## Runtime and stored evidence

- Main FE3000 -> BE8080 -> existing `engolearn_db`, selected stored A2 learner `6ae04c82126ade188657302c`.
- Temporary FE3001 -> BE8099 -> existing `engolearn_quiz_verify` clone. The full-topic run used the copied existing learner and content; a separate stored local profile `6ae18c3eca622da8733b7556` was created through the real local-profile endpoint for the concurrency/final-feedback check.
- Ignored raw evidence: BE `.artifacts/topic-slice-b/live-report.json`, `main-after.json`, `main-replay-report.json`, `race-and-ui-preparation.json`. The HTTP runner read expected option IDs from the real clone; these were never served as FE fallback data.

## Observed results

1. Main browser opened the old stuck attempt `698a351bd05b76d98012c535` and offered **Hoan tat bai hoc** instead of endless answer replay. Clicking it changed revision18 ->19 and opened result3/6 =50%. Mongo inspection confirmed exactly12 submissions remained, all6 quiz histories retained, and embedded result counts3/6 were published with COMPLETED/null position. Reload retained the result.
2. The result next-item button opened attempt `99180494970bf2bcb5c0a2e2` at CONTEXT/0 for item `6a7200000000000000000012`. No further learning was performed on that main attempt.
3. The original final-answer receipt still replayed IN_PROGRESS/revision18/91%/completedAt:null, preserving its old rounding. The new completion receipt replayed COMPLETED/revision19/100% with identical data. Reusing the completion key with a different body returned409 IDEMPOTENCY_KEY_REUSED. Authoritative GET stayed revision19; replay did not undo completion.
4. Real clone HTTP run:184 requests across all5 cafe items/30 quizzes. Wrong -> GET/reload -> correct and same-key replay worked for both quiz types; stale new-key requests returned409. Each final answer immediately published COMPLETED/null position, timestamp,100% progress and item result; final replay matched the accepted response. Each next visible item was allowed, final next was null. Topic result summed27/30 =90%; My Topics contained the completed topic and Discover excluded it. All response DTOs were checked against the actual OpenAPI schemas.
5. Browser FE3001 displayed the clone topic result27/30 =90% and all five item fractions. This full-topic HTTP run preceded the legacy-rounding patch; targeted checks afterward verified original-receipt compatibility and a new final completion on the final build. The whole flow was not reset/repeated.
6. New clone learner: two concurrent correct requests with different keys for the same quiz/revision returned200 and409 STATE_CHANGED. The winner replay matched; revision advanced once. Normal API actions then reached the last SITUATIONAL_CHOICE. Browser answered that question, stayed on feedback with header100%, and only Continue navigated to result6/6 =100% (attempt `d6945d520a47a5f63193885a`).
7. Result layout checked at390x844: wrapped text/actions, no visible horizontal overflow. Temporary viewport override was reset.

## Checks and limits

- FE build PASS, lint --quiet PASS, generated type drift PASS52 schemas; existing bundle-size warning remains. BE clean/final package PASS; ArchitectureTest9/9 PASS. Latest receipt-flag change was packaged successfully after that architecture run.
- OpenSpec strict validation and diff checks PASS. Historical mocked suites/full Maven verify were not rerun, following the user's no-mock verification constraint; the previously documented baseline3 failures/47 errors remains unresolved. No claim of a fully green repository DoD.
- Actual response-loss/network fault injection and restoring a saved pending descriptor in the user's browser were not performed. Stable server replay was verified; browser recovery began without a saved pending descriptor. Media playback, hidden/retry combinations, legacy conflicting answer formats and the full C lifecycle remain unverified/out of scope.
- A final optional Docker recount timed out awaiting automatic permission review and did not execute. It is not counted as evidence. The earlier successful direct Mongo read already established the main attempt's12 preserved submissions.
