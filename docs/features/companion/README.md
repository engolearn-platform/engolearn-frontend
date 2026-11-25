# AI Companion Quick Panel

## Stitch and interaction reference

This is the approved first Quick Panel implementation. It is a fixed, non-modal floating surface with a replaceable mascot placeholder. It does not add a route, backdrop, drag/resize behavior, workspace, persistent memory, or context attachment.

## Route and visibility

The host is placed at the authenticated app shell and is gated through the public auth contract for learners (`USER`). It is not rendered on assessment-taking or nonlearner/auth/admin routes. Existing routes and route authorization remain owned by their features.

## Component boundaries

- `src/features/companion/components/CompanionHost.tsx` gates the floating entry point with `HasRole` and the learner route allowlist. It excludes `/assessment/taking` and management paths.
- `MascotButton.tsx` opens/minimizes the panel and uses the existing EngoLearn brand mark without creating a conversation.
- `QuickPanel.tsx` presents Home, history, and active conversation views in one fixed, non-modal panel.
- `CompanionHome.tsx` presents explicit New Chat, the server's three recent conversations, quota summary, and home composer.
- `ConversationHistory.tsx` renders cursor-paginated history, opens an active conversation, and confirms before deletion.
- `ConversationView.tsx`, `MessageList.tsx`, and `MessageItem.tsx` render active chat, older message pages, stop/retry feedback, and safe rich text.
- `AdaptiveComposer.tsx` retains the in-session draft across view changes, stop, and failures.
- `QuotaSummary.tsx` displays server-derived remaining percentage/reset and active conversation capacity.
- `companion.css` scopes floating panel, responsive, focus, and reduced-motion styles to this feature.

## State and API

`CompanionProvider` owns authenticated identity fencing, conversation/message data, the active stream, transient draft/retry payload, and request lifecycle. Components use its published `useCompanion()` interface and do not make duplicate service requests. Opening the panel does not create a conversation; New Chat is explicit, and Home send creates only as part of sending.

## UI-only behavior

The stream maps `delta` to the in-memory answer, `completed` to the persisted assistant message and server capacity values, `error` to safe inline copy, and only `status.code === ASSESSMENT_LOOKUP` to “Đang xem kết quả học tập…”. Unknown status codes remain generic “Engo đang xử lý…” feedback. Client-only `STOPPED` and `INTERRUPTED` notices appear only after successful reconciliation; status stays out of persisted message history and announcements never include the full transcript.

Stop is best-effort and keeps any next draft. A completed turn clears only the submitted text; the next draft is never sent automatically. Retry is offered only after reconciliation confirms the latest unanswered user turn and server eligibility; it reuses the same turn ID and exact text, at most once per failure. No stream resumes after reload.

Home covers initial loading, recent conversations, empty state, quota unavailable/loading, and safe request errors. History covers its initial loading/empty states, cursor-based “Tải thêm”, selection, and confirmed deletion. Conversation covers newest/older message pages, connecting/streaming/reconciling states, safe errors, capacity, incomplete partial output, copy feedback, and eligible retry.

## Responsive, focus, and motion

- Floating panel is fixed and does not reflow the page; narrow/mobile sizing includes safe-area insets.
- Opening focuses the panel; closing/minimizing restores focus to the mascot trigger.
- Controls have accessible labels and visible keyboard focus; delete uses the shared confirmation dialog.
- Enter submits, Shift+Enter inserts a newline, and IME composition does not submit.
- One composer remains mounted between Home and active chat; its textarea grows with wrapping/newlines and scrolls internally at its bound.
- Reduced-motion preference disables nonessential transitions and hover movement.
- Visible and semantic status messages remain separate from transcript content during streaming.
