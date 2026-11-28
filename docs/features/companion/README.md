# AI Companion

## Presentation

The companion uses independently movable/resizable compact and expanded desktop panels and a full-viewport modal at 600px or below. The compact default is 440x720px at the lower right; expanded defaults to 1000x810px centered. The header and composer stay fixed while the selected content scrolls. Switching subviews does not change shell geometry.

A1 V2.1 presentation: Home uses the replaceable `/landing/penguin-hero.webp` mascot, two draft-only starter prompts (disabled when a draft exists), and up to three recent conversations with a View All shortcut. The header identifies Engo and the current view, and exposes New Chat, Home, memory, settings, history, expansion, minimize and close.

The Full Workspace control is an in-session presentation preference owned by the eligible host. It preserves the same provider, active conversation, composer and draft, including minimize/dismiss/reopen and eligible route changes. The expanded mode uses a sidebar only when its actual panel width is at least 750px; otherwise header history and Home shortcuts remain accessible. Desktop geometry is independent of the selected mode and the mascot. At 600px or below, the full-screen mobile view temporarily replaces desktop geometry, with explicit Xem bài / Trở lại chat retaining the draft, selection and transcript anchor. Identity/eligibility loss resets the in-session workspace preference, not device geometry.

## V19 spatial placement

The approved V19 mascot remains fixed to the viewport and can move freely in both axes. An 8px pointer threshold distinguishes activation from drag; the pointer offset and hitbox are preserved. A successful drop alone persists pointer placement; cancel, lost capture, viewport resize and unmount abandon the preview. Keyboard arrows move 20px (Shift: 80px), Home resets. The lifted WebP is predecoded and used only during active drag, independent of idle-motion preferences, with the seated reading fallback. No network or business actions are added.

Both desktop modes use a 5px drag threshold, a header/grip for movement, a lower-right resize handle, arrow-key movement/resize (Shift: 80px) and a grip menu with explicit reset. Geometry has readable minima of 350px compact / 560px expanded and 320px height when the viewport permits. No application space is reserved or business control avoided. The three separate device-local keys are engolearn.companion.geometry.v1.mascot, .compact and .expanded; only numeric rectangles are persisted. Fit-to-viewport does not overwrite preferred desktop geometry, and reset affects only the current mode. Storage failure retains the in-memory preference for the mounted shell. No conversation content, identity, visibility or business state is persisted by geometry. Mobile uses the existing modal/safe-area behavior and no desktop resize controls.

## Conversation

User messages use right-aligned mint bubbles. Engo messages are unboxed with a small brand avatar and visible Engo byline. Reading and composer share a centered column with a 760px maximum. Both roles have small icon-only copy controls. Existing safe Markdown rendering supports headings, lists, quotes, tables, and code with horizontal overflow where needed.

Turn presentation follows the V2.1 prototype: the submitted snapshot appears at the end of the scrollable transcript as a distinctly pending question until admission; the composer does not display it as an unsent draft. The provider retains the actual text/context until admission or confirmed rejection; the pending snapshot’s textarea is read-only until that outcome, then normal next-draft input resumes. Explicitly sending a new question scrolls to that turn once; subsequent streaming and layout transitions respect the reading anchor. Accepted user text appears once in a plain right-aligned bubble; the assistant byline and thinking/stream/Stop/retry feedback appear directly after the affected turn in the same scrolling transcript. Processing dots honor reduced motion; copy actions are outside user bubbles and hidden during pending/streaming. Stop uses the same primary square affordance as Send. Retry remains gated by reconciliation. Subsequent-turn SSE emits a processing event after preparation and before model work, so admission feedback does not wait for the first model token.

Quota and message capacity are not shown as persistent dashboards. A single composer-area status appears only when known quota exhaustion or conversation capacity prevents another send. Capacity status offers the existing New Chat action; a known quota reset timestamp is shown when available.

## Composer and interaction

One textarea remains mounted across Home, history hiding, active conversation and workspace expansion/collapse while the panel is mounted. Dismiss/minimize unmounts the panel; draft remains provider-owned. A hidden text sizer measures wrapping at the compact one-row width, and a `ResizeObserver` recalculates that width when the available panel width changes. The visible composer uses a rounded-square up-arrow send affordance with a 44px target and a visible AI caution; Send or Stop sits beside a one-line input; multiline text moves the input above the right-aligned action. It collapses back to one row when the text fits again.

Enter submits, Shift+Enter inserts a newline, and IME composition does not submit. Drafts may be edited during inference but are not sent in parallel; Stop keeps the next draft. Existing confirmed history deletion, pagination, and conversation selection remain available.

## Responsive, focus, and motion

- Desktop remains non-modal, with no backdrop or body lock. At 600px or below, the same view uses a full-viewport modal dialog, safe areas, focus trapping, background inertness and scroll lock. Focus and selection are restored when possible. Breakpoint replacement is deferred during IME composition, an in-progress memory edit or a nested history confirmation.
- The header and composer remain fixed; only the current content and message list scroll. Home owns scrolling over its recent rows; full history and the workspace sidebar retain their independent scrolling.
- A settled, genuinely empty conversation shows a centered character and invitation within the transcript area; loading, partial/streaming, retry and error feedback are inline in the transcript.
- Narrow viewports include safe-area insets and hide the expanded navigation column when it cannot fit.
- Controls expose accessible names and visible keyboard focus. Copy feedback and stream status use semantic announcements.
- Reduced-motion preference disables nonessential panel and mascot transitions and smooth message scrolling.

A2.1 retains workspace preference and prior-view Back. A2.2 adds the responsive dialog and focus lifecycle; A2.3 records a conversation-scoped visible-message anchor and near-bottom state in memory, preserves position through presentation changes and prepend, and provides Return to latest. A2.4 adds lazy first-turn admission. Consent and persistent visibility remain outside A2. Existing browser verification below is historical.

## State and API boundaries

`CompanionProvider` owns authenticated identity fencing, conversation/message data, quota reads, the active stream, transient draft/retry payload, and request lifecycle. Presentation components use `useCompanion()` and do not call services directly. Routes are unchanged. A2.4 requires the corresponding backend first-turn contract; an older backend must not be used for first-turn sends. New Chat is an unsaved local view until a first message is admitted. Home send starts an independent conversation. Switching away from an existing draft asks for confirmation; a Home send of a conversation-origin draft asks before transferring it. The first send uses a stable request UUID, a canonical admitted SSE event, and exact owner-scoped status lookup or cancellation; unknown admission blocks resubmission until reconciled. Known rejection preserves the draft. The backend persists the trimmed first-message title (maximum 65 Unicode code points). Subsequent turns use the existing endpoint. No conversation or request payload browser persistence is added.

## Persistent memory

The provider exposes memory management and Automatic Memory settings inside the same Companion panel and Full Workspace. Opening either view does not replace the conversation, composer, or draft. Header Back from history, memory or settings returns to the last observed Home or the same still-active conversation (otherwise Home); Back from conversation goes Home. Back does not reopen a conversation or fetch its transcript. The existing Home refresh still applies when returning Home. The mascot setting remains independent from Automatic Memory.

The memory list uses `GET /api/v1/companion/memory?limit=20`, with optional `category` and opaque `before` cursor parameters. Records retain the API's category, source, version, and timestamps; inferred records are labeled as Engo's inference. Editing uses `PATCH /memory/{memoryId}` with `{content,expectedVersion}` and updates the visible record only after the API succeeds. Forget asks for confirmation, then uses `DELETE /memory/{memoryId}?expectedVersion={version}` and removes the record only after success. There is no add-memory control.

Automatic Memory reads `GET /api/v1/companion/memory/settings` and writes `PUT /api/v1/companion/memory/settings` with `{automaticMemoryEnabled}`. The initial setting is on when the backend returns its default. Turning it off blocks create/update classified as AUTOMATIC, regardless of EXPLICIT or INFERRED source. Direct remember, update, forget, and retrieval remain available. Chat create/update intent is model-classified, not independently confirmed consent.

The SSE parser accepts the additive `memory_operation` event (`operationId`, `action`, `memoryId`, `version`). The provider deduplicates receipts by operation ID for the authenticated panel session and shows a localized post-commit confirmation with a shortcut to the memory view. No success confirmation is produced from tool output or a pre-commit event. Existing terminal and status events are unchanged.

## Screen Awareness (M4)

Topic pages register their loaded screen context through the Companion public hook. Topic Detail exposes the published overview; Topic Lesson exposes the actual visible CONTEXT, VOCAB or EXPRESSIONS position, including a permitted earlier position. Unsupported pages and quiz/review stages register nothing. No route inference, DOM capture or automatic attachment.

The composer shows a direct + Ngữ cảnh action when a context is available and no context is attached. One explicit click attaches the available reference; the chip labels the attached snapshot and can be removed. Availability and attachment are separate. Moving between pages or learning positions changes availability, not an existing attachment. The attachment stays with the draft across minimize/expand; an accepted send clears only the submitted snapshot, and a rejected send retains it. Explicit conversation switches require discard confirmation when a draft or attachment exists; retry uses the original turn reference. The current message remains plain text with optional screenContext metadata, not page content.

Browser verification (2026-11-26): default 3000/8080 exercised manual attach, navigation retention and outgoing reference but quota rejected the synthetic user before inference. Isolated 3001/8082 real Chrome/Gemini completed overview and vocabulary, returning all five lesson titles and the attached word after a position change; accepted sends cleared the chip and manual removal passed. Unsupported quiz context returned 400 before admission. Build and lint passed (0 errors, 74 existing warnings). The Topic suite ran 31/33; two existing failures (operation count 20 versus 17, and missing example entries) reproduced exactly from the pre-M4 commit 84f90b7. No new failure was observed in that suite. Broader stage/retry/responsive UI verification remains open.

### M3 browser verification (2026-11-26)

Actual Chrome with the local FE proxy to an isolated Gemini-backed demo verified synthetic registration, Automatic Memory OFF/ON persistence, post-commit create feedback, Memory shortcut and draft preservation, canonical versioned edit, canceled Forget and confirmed Forget. The edited vector version and eventual Qdrant deletion were confirmed separately against the isolated index. Build and lint passed (0 errors, 74 existing warnings). Browser retry/deduplication and wider responsive Memory layouts were not separately exercised in this run.

## Living Engo character (V2.4 raster)

Approved source: `13-prototype-v2.1-animated-pet-review.html` (final idle/motion preference revision) and `asset-preview-v2.4-raster`. Runtime files in `public/assets/engo` are byte-identical to their approved manifest. Reading master is the loading/failure fallback; decoded reading frames 0–5 drive the 100px desktop / 84px mobile transparent launcher. Avatar is stable in header and assistant messages, welcome illustration in Home and empty conversation. Unused wave/thinking assets are not loaded: the final prototype uses the reading frames for attention and actual processing.

Idle begins after 500ms on readiness, then plays the approved blink/page-turn sequence and rests 3500–4399ms between bursts. Fine-pointer hover and intentional keyboard focus use the approved attention frames after 130ms. Processing uses frame 5 while the provider reports a genuine active send; text status remains available. Opening removes the launcher and clears its timers; closing restores reading with automatic focus return suppressed as an attention trigger. Hidden tabs, preference changes, route changes and unmount cancel timers; no network/business actions are initiated by animation. No full-image breathing/scale animation.

Companion overflow → Cài đặt Engo includes a separate device-local movement choice (Theo hệ thống / Bật chuyển động Engo / Tắt chuyển động Engo) with explicit Save/Cancel. Default system follows live `prefers-reduced-motion`; explicit opt-in only permits mascot frames, not application/panel animation overrides. Preference persists at `engolearn.companion.motion.v1` and syncs across tabs. Storage failure is reported, not silently treated as saved. Existing memory settings and chat state are independent. This is not account-level visibility persistence.
