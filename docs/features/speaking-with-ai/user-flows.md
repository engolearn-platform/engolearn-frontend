# Speaking V2 user flows

| Learner action | Frontend behavior |
| --- | --- |
| Open from a Topic or Item | Check availability for that exact scope; show an actionable reason when unavailable. |
| Start a session | Request microphone permission, stop probe tracks, create a session and open its standalone workspace. |
| Speak | Send `START_TURN`, capture only after `TURN_ACCEPTED`, and stream PCM16. Finalize on silence, learner action, or when transmitted PCM reaches the session's per-turn audio limit. |
| Review a reply | Show original transcript, reply, message-specific hint and correction; keep text available when providers/audio fail. |
| Reconnect | Stop capture, reconnect with a fresh ticket, sync REST state and deduplicate saved turns. |
| Finish while recording | Let the learner choose to finalize the turn or discard it before ending. |
| View a result | Poll pending assessment, show the four criteria with separate score scales, and preserve null/partial/unavailable states. |
| Review history | Browse the account's sessions or an exact scope, open read-only results, replay authorized audio, or soft-delete records. |

The browser workflow is covered at transport and validation boundaries by `npm run test:speaking`; protected-route role inheritance is covered by `npm run test:auth`. Live provider and microphone E2E remains outside the internal test suite.
