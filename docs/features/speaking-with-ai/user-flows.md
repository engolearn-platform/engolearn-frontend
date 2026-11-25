# Speaking V2 user flows

| Learner action | Frontend behavior |
| --- | --- |
| Open from a Topic or Item | Check availability for that exact scope; show an actionable reason when unavailable. |
| Start a session | Request microphone permission, stop probe tracks, create a session and open its standalone workspace. |
| Speak | Use the sticky workspace control bar to send `START_TURN`, capture only after `TURN_ACCEPTED`, and stream PCM16. Finalize on silence, learner action, or when transmitted PCM reaches the session's per-turn audio limit. |
| Review a reply | Read the two-sided conversation timeline. Expand hints on their AI reply and corrections on the original learner transcript. Replay persisted audio only when the matching availability flag is true. |
| Reconnect | Stop capture, reconnect with a fresh ticket, sync REST state and deduplicate saved turns. |
| Finish while recording | Let the learner choose to finalize the turn or discard it before ending. |
| View a result | Poll pending assessment, show four aligned criteria cards with separate score scales, localize unavailable states, and preserve null/partial/unavailable results. Review only feedback groups with actual content and the saved conversation timeline. |
| Review history | Browse the account's sessions or an exact scope, open read-only results, replay authorized audio, or soft-delete records. |

The workspace and result share the feature-owned `ConversationTimeline` presentation. The active workspace keeps its messages in an independent scroll area and pins session controls below it. The saved result timeline remains in normal page flow.

`npm run test:speaking` covers the protocol, client contracts, and mounted runtime and result behavior. The [Speaking browser checker](../../../tools/speaking/README.md) runs the real application in Chrome with deterministic session, microphone, and assessment fixtures. Live provider and physical microphone checks are outside this coverage.
