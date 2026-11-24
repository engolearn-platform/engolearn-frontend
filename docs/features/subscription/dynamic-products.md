# Dynamic subscription products

## Stitch → route

Keep the existing learner subscription page and legacy purchase history routes.
Add `/subscription/plans/:planCode` for direct offer links, including hidden
offers, and `/admin/subscription/products` for paid product lifecycle
management. The existing `/admin/subscription/plans` and `/quotas` routes keep
managing the fixed FREE, TRIAL and legacy PREMIUM configurations.

## Component

- Learners reuse the existing plan card, benefit list, purchase confirmation,
  account guard and immutable purchase detail surface.
- Product management reuses the current management layout, card, button,
  dialog and field primitives. The product list shows visibility, sale state,
  current version and draft state. Product detail edits a draft, previews the
  complete shared benefit/quota/price configuration, then publishes it.
  Historical versions open their immutable content from the version read API.
- Service grants use registered service codes in `benefits`; quota rules use
  the selected service's registered quota type. Registry names, units and
  periods remain server-authoritative. The editor handles metered and
  unmetered registry entries generically: null quota metadata means no limit
  fields for that service.

## State

- Product lifecycle: empty draft → edited draft → preview → publish; published
  versions remain immutable. After publish the next draft starts from the
  current configuration; publication confirmation uses the server's
  `publishedVersion`, not a possibly newer current version. Visibility and sale
  state are separate controls. The initial empty draft may have revision 0 and
  null content; editing starts with empty form values. Only a never-published
  draft can be deleted. Draft presence comes from `hasDraft`; `draftRevision` is
  a compare-and-set revision and remains meaningful after publication.
- Learner offer selection is identified by plan code, billing period and the
  displayed version. A stale version loads the latest offer and asks the
  learner to confirm again before creating an order with a new idempotency key.
- A pending order remains account-wide. Order detail renders the immutable
  server-returned plan name, version, amount, period and status; existing polling
  and history behavior continue.
- FREE/TRIAL activation and configuration, legacy PREMIUM reads and existing
  payment return behavior remain supported.

## UI-only

Use the subscription API service and existing `useFetch` boundary. Render
loading, empty, validation, conflict, unavailable, stale-version and mutation
states with actionable copy. Never submit a paid purchase without a version
that was displayed and explicitly confirmed.

## Responsive

Follow the existing subscription and management page spacing, Hanken Grotesk
type, Engo Learn colors and mobile-first form/list patterns. Keep actions
keyboard accessible with visible focus and minimum 48px touch targets.

## Checklist

- [ ] Product list, create, draft editing, preview, publish, visibility, sale,
      archive, version history and eligible draft deletion use the approved API.
- [ ] Learner list, direct hidden offer, stale refresh/reconfirmation and
      versioned order creation use the approved API.
- [ ] Orders retain immutable plan identity and existing pending/history flows.
- [ ] Existing FREE/TRIAL and legacy PREMIUM flows continue to work.
- [ ] Metered services and unmetered services with null quota metadata render
      correctly without service-code special cases.
- [ ] Build and lint pass.
