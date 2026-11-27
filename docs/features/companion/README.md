# AI Companion

## Presentation

The companion uses one fixed, non-modal panel for Home, conversation history, and an active conversation. The compact panel is 440px wide and 720px high when the viewport allows, inset 20px with a 24px radius. Its header and composer stay fixed while the selected content scrolls. Switching subviews does not change the compact shell dimensions.

A1 V2.1 presentation: Home uses the replaceable `/landing/penguin-hero.webp` mascot, two draft-only starter prompts (disabled when a draft exists), and up to three recent conversations with a View All shortcut. The header identifies Engo and the current view, and exposes New Chat, Home, memory, settings, history, expansion, minimize and close.

The Full Workspace control is presentation-only local state in `QuickPanel`. It widens the same panel and adds a recent-conversation navigation column on wider viewports. It keeps the same provider, active conversation, mounted composer, and draft. At 601–760px, expanded mode uses up to 520px without a sidebar; at ≤600px the safe-area inset panel hides expansion and preserves narrow header identity. The sidebar shows plain recent rows, history and a bottom memory shortcut; compact Home shows a quiet memory shortcut. Settings remain in overflow. Home loading/error feedback remains visible in both layouts.

## Conversation

User messages use right-aligned mint bubbles. Engo messages are unboxed with a small brand avatar and visible Engo byline. Reading and composer share a centered column with a 760px maximum. Both roles have small icon-only copy controls. Existing safe Markdown rendering supports headings, lists, quotes, tables, and code with horizontal overflow where needed.

Streaming and processing status, Stop, incomplete output, interruption feedback, safe request errors, and eligible Retry remain connected to the existing provider state. Retry is offered only when reconciliation confirms that the failed turn can be retried.

Quota and message capacity are not shown as persistent dashboards. A single composer-area status appears only when known quota exhaustion or conversation capacity prevents another send. Capacity status offers the existing New Chat action; a known quota reset timestamp is shown when available.

## Composer and interaction

One textarea remains mounted across Home, history hiding, active conversation and workspace expansion/collapse while the panel is mounted. Dismiss/minimize unmounts the panel; draft remains provider-owned. A hidden text sizer measures wrapping at the compact one-row width, and a `ResizeObserver` recalculates that width when the available panel width changes. The visible composer uses a rounded-square up-arrow send affordance with a 44px target and a visible AI caution; Send or Stop sits beside a one-line input; multiline text moves the input above the right-aligned action. It collapses back to one row when the text fits again.

Enter submits, Shift+Enter inserts a newline, and IME composition does not submit. Drafts may be edited during inference but are not sent in parallel; Stop keeps the next draft. Existing confirmed history deletion, pagination, and conversation selection remain available.

## Responsive, focus, and motion

- The floating panel does not reflow or dim the page beneath it and has no backdrop or body lock.
- The header and composer remain fixed; only the current content and message list scroll. Home owns scrolling over its recent rows; full history and the workspace sidebar retain their independent scrolling.
- A settled, genuinely empty conversation shows a centered character and invitation within the transcript area; loading, partial/streaming, retry and error feedback retain their existing presentation.
- Narrow viewports include safe-area insets and hide the expanded navigation column when it cannot fit.
- Controls expose accessible names and visible keyboard focus. Copy feedback and stream status use semantic announcements.
- Reduced-motion preference disables nonessential panel and mascot transitions and smooth message scrolling.

A1 does not implement A2 mobile modal lifecycle, focus/scroll restoration or persistent workspace preference. Prior-view navigation, turn admission, draft transfer, consent and persistent visibility remain outside this slice. Existing browser verification below is historical, not A1 evidence.

## State and API boundaries

`CompanionProvider` owns authenticated identity fencing, conversation/message data, quota reads, the active stream, transient draft/retry payload, and request lifecycle. Presentation components use `useCompanion()` and do not call services directly. UI refinement does not change routes, provider state, API/REST/SSE contracts, server admission, or backend behavior.

## Persistent memory

The provider exposes memory management and Automatic Memory settings inside the same Companion panel and Full Workspace. Opening either view does not replace the conversation, composer, or draft. The header back action returns to Companion Home directly from either subview. The mascot setting remains independent from Automatic Memory.

The memory list uses `GET /api/v1/companion/memory?limit=20`, with optional `category` and opaque `before` cursor parameters. Records retain the API's category, source, version, and timestamps; inferred records are labeled as Engo's inference. Editing uses `PATCH /memory/{memoryId}` with `{content,expectedVersion}` and updates the visible record only after the API succeeds. Forget asks for confirmation, then uses `DELETE /memory/{memoryId}?expectedVersion={version}` and removes the record only after success. There is no add-memory control.

Automatic Memory reads `GET /api/v1/companion/memory/settings` and writes `PUT /api/v1/companion/memory/settings` with `{automaticMemoryEnabled}`. The initial setting is on when the backend returns its default. Turning it off blocks create/update classified as AUTOMATIC, regardless of EXPLICIT or INFERRED source. Direct remember, update, forget, and retrieval remain available. Chat create/update intent is model-classified, not independently confirmed consent.

The SSE parser accepts the additive `memory_operation` event (`operationId`, `action`, `memoryId`, `version`). The provider deduplicates receipts by operation ID for the authenticated panel session and shows a localized post-commit confirmation with a shortcut to the memory view. No success confirmation is produced from tool output or a pre-commit event. Existing terminal and status events are unchanged.

## Screen Awareness (M4)

Topic pages register their loaded screen context through the Companion public hook. Topic Detail exposes the published overview; Topic Lesson exposes the actual visible CONTEXT, VOCAB or EXPRESSIONS position, including a permitted earlier position. Unsupported pages and quiz/review stages register nothing. No route inference, DOM capture or automatic attachment.

The composer shows a direct + Ngữ cảnh action when a context is available and no context is attached. One explicit click attaches the available reference; the chip labels the attached snapshot and can be removed. Availability and attachment are separate. Moving between pages or learning positions changes availability, not an existing attachment. The attachment stays with the draft across minimize/expand; an accepted send clears only the submitted snapshot, and a rejected send retains it. Explicit conversation switches clear the attachment; retry uses the original turn reference. The current message remains plain text with optional screenContext metadata, not page content.

Browser verification (2026-11-26): default 3000/8080 exercised manual attach, navigation retention and outgoing reference but quota rejected the synthetic user before inference. Isolated 3001/8082 real Chrome/Gemini completed overview and vocabulary, returning all five lesson titles and the attached word after a position change; accepted sends cleared the chip and manual removal passed. Unsupported quiz context returned 400 before admission. Build and lint passed (0 errors, 74 existing warnings). The Topic suite ran 31/33; two existing failures (operation count 20 versus 17, and missing example entries) reproduced exactly from the pre-M4 commit 84f90b7. No new failure was observed in that suite. Broader stage/retry/responsive UI verification remains open.

### M3 browser verification (2026-11-26)

Actual Chrome with the local FE proxy to an isolated Gemini-backed demo verified synthetic registration, Automatic Memory OFF/ON persistence, post-commit create feedback, Memory shortcut and draft preservation, canonical versioned edit, canceled Forget and confirmed Forget. The edited vector version and eventual Qdrant deletion were confirmed separately against the isolated index. Build and lint passed (0 errors, 74 existing warnings). Browser retry/deduplication and wider responsive Memory layouts were not separately exercised in this run.
