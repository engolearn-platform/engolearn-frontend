# AI Companion

## Presentation

The companion uses one fixed, non-modal panel for Home, conversation history, and an active conversation. The compact panel is 440px wide and 720px high when the viewport allows, inset 20px with a 24px radius. Its header and composer stay fixed while the selected content scrolls. Switching subviews does not change the compact shell dimensions.

Home uses the replaceable `/landing/penguin-hero.webp` mascot, a single full-width New Chat action, and up to three recent conversations with a View All shortcut. The header identifies Engo and provides history, workspace expansion, minimize, and close actions.

The Full Workspace control is presentation-only local state in `QuickPanel`. It widens the same panel and adds a recent-conversation navigation column on wider viewports. It keeps the same provider, active conversation, mounted composer, and draft. Narrow viewports use the compact width while retaining the workspace control.

## Conversation

User messages use right-aligned mint bubbles. Engo messages use neutral bordered bubbles, a small outside brand avatar, and the available text width. Role names are available to assistive technology and are not repeated visually. Both roles have small icon-only copy controls. Existing safe Markdown rendering supports headings, lists, quotes, tables, and code with horizontal overflow where needed.

Streaming and processing status, Stop, incomplete output, interruption feedback, safe request errors, and eligible Retry remain connected to the existing provider state. Retry is offered only when reconciliation confirms that the failed turn can be retried.

Quota and message capacity are not shown as persistent dashboards. A single composer-area status appears only when known quota exhaustion or conversation capacity prevents another send. Capacity status offers the existing New Chat action; a known quota reset timestamp is shown when available.

## Composer and interaction

One textarea remains mounted across Home, history hiding, active conversation, panel minimize/restore, and workspace expansion/collapse. Its draft stays provider-owned. A hidden text sizer measures wrapping at the compact one-row width, and a `ResizeObserver` recalculates that width when the available panel width changes. The visible composer places its circular Send or Stop beside a one-line input; multiline text moves the input above the right-aligned action. It collapses back to one row when the text fits again.

Enter submits, Shift+Enter inserts a newline, and IME composition does not submit. Drafts may be edited during inference but are not sent in parallel; Stop keeps the next draft. Existing confirmed history deletion, pagination, and conversation selection remain available.

## Responsive, focus, and motion

- The floating panel does not reflow or dim the page beneath it and has no backdrop or body lock.
- The header and composer remain fixed; only the current content and message list scroll.
- Narrow viewports include safe-area insets and hide the expanded navigation column when it cannot fit.
- Controls expose accessible names and visible keyboard focus. Copy feedback and stream status use semantic announcements.
- Reduced-motion preference disables nonessential panel and mascot transitions and smooth message scrolling.

## State and API boundaries

`CompanionProvider` owns authenticated identity fencing, conversation/message data, quota reads, the active stream, transient draft/retry payload, and request lifecycle. Presentation components use `useCompanion()` and do not call services directly. UI refinement does not change routes, provider state, API/REST/SSE contracts, server admission, or backend behavior.

Persistent memory management, canonical inline memory feedback, and manual context attachment remain unavailable until their required backend and page-context contracts exist. No inactive controls are shown for those capabilities.
