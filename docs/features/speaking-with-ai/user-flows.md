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
| Review history | Browse account-wide recent sessions and Topic groups, or open an exact Topic/Item history. Open read-only results, replay authorized audio, or soft-delete records. |

## Access and history extension

The protected account route `/speaking/history` stores the selected tab and every visible page in its query string. `Đang học` shows the account's recent sessions first, followed by current in-progress Topic cards and `Lịch sử khác` only when that group has results. `Hoàn thành` shows completed Topic cards and does not request or render the recent-session section. Tab badges use the full distinct Topic totals returned by the grouped history endpoint.

Topic card pages are independent: the default in-progress and Other sections use separate URL page values so one short group cannot move the other. Each Topic card opens a parent-union history for that Topic, including both Topic and Item sessions. The exact Topic or Item filter remains a separate `scopeType` intent. A plain `topicId` or a mixed parent/exact query is rejected locally without falling back to account-wide recent history.

Session links carry a validated same-origin `/speaking/history` URL in the result URL. After reload, the result can return to the same account tab/group/page, parent page, or exact history. Exact history returns to its validated same-scope Speaking entry path; direct exact URLs use the canonical Topic or Item Speaking entry. Parent history retains its originating account URL for a clear return action.

History rows distinguish the saved lifecycle state, assessment state, speech duration, and committed exchange count. Topic/Item labels and pinned titles remain available when current Topic access changes. History reads do not request microphone access or open a live socket. New-start denial reasons are localized; an existing explicitly resumable session remains available even when new admission is denied.

The shared extension wire contract and accepted fixture are in [`speaking-access-history.fixture.json`](../../../../docs/system-design/speaking-access-history.fixture.json); the H0 plan and acceptance map are in the [workspace H0 contract](../../../../docs/implementation/speaking-v2-evidence/access-history-h0-contract.md).

The workspace and result share the feature-owned `ConversationTimeline` presentation. The active workspace keeps its messages in an independent scroll area and pins session controls below it. The saved result timeline remains in normal page flow.

`npm run test:speaking` covers the protocol, client contracts, and mounted runtime and result behavior. The [Speaking browser checker](../../../tools/speaking/README.md) runs the real application in Chrome with deterministic session, microphone, and assessment fixtures. Live provider and physical microphone checks are outside this coverage.
