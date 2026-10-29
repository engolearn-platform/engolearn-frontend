# Attempt learning

Current UX contract, 2026-10-29. Supersedes the original stage-3 checkpoint.

The route `/topics/:topicId/attempts/:attemptId` contains both lesson content and exercises. Desktop uses content left (8 columns), navigation right (4); mobile stacks navigation and content. The feature reuses existing Button, content/audio, quiz, semantic surfaces, Hanken Grotesk and spacing tokens. Context, vocabulary, expressions and practice have distinct token-backed section accents.

`stage/index` selects a viewed unit, independently of server progress. Content ordering is context, vocabulary sorted by orderIndex/ID, then flattened expression purposes. Individual questions follow the pinned server quiz-navigation order. Future rows stay visible and locked, with no prompt/options/feedback. Reached solved questions are selectable and read-only. Invalid/future URLs fall back to the authoritative frontier. Viewing and Back never send advance.

Continue remains mounted in the bottom footer, with an adjacent disabled explanation. Only frontier CONTEXT/VOCAB/EXPRESSIONS require the bottom sentinel to enter the visible window above the measured footer. Short visible content unlocks immediately. Learner/attempt/version/position changes reset readiness; content/media/viewport resize revalidates it. Old content and exercises have no scroll condition. Optional audio and quick checks never advance progress or block Continue.

Frontier content Continue sends revision/source with its exact journaled key. Old content Continue moves to the next reached unit. Exercise Continue requires authoritative correct feedback, then moves to the next frontier or item result; it never becomes a topic-detail button. Solved-question Continue is read-only navigation. A single return-to-frontier action appears only while viewing elsewhere.

Identity/version/revision assertions remain mandatory. Conflicts refresh progress and await user action. TOPIC_RESET clears stale attempt actions and returns to fresh detail. Scores and positions remain server-owned. See [quiz lifecycle](11-quiz-slice-a.md), [review/reset](14-review-retry-slice-c.md) and [verification](../../../handout/topic-learning/verification.md).

Browser/live acceptance for this change is tracked separately from historical stage evidence. No fixture/mock verification is integration proof.
