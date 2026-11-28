# Management Dashboard

## UI flow

The protected `/admin` route renders the existing `ManagementLayout` and a dashboard overview. `ProtectedRoute` requires `CONTENT_MANAGER`; inherited `ADMIN` access comes from the shared auth policy.

## Data and state

The view calls `GET /api/management/dashboard/summary` through the shared `httpService` and `useFetch` boundary. Counts come only from the API and are checked as nonnegative integers; zero is displayed as a valid count. Content managers retain only the content section in client state. Administration statistics and workspaces render only for ADMIN, and an ADMIN response without administration data is shown as an error state. Workspace cards remain available with generic descriptions while counts load or if the request fails.

The dashboard subtree is keyed by authenticated identity generation, account ID, and role so an identity or authority transition unmounts the previous request state and aborts its fetch.

## Workspaces and responsive behavior

Workspace cards are full-card links to existing management routes, with visible keyboard focus. Each four-card workspace group uses one column on mobile and two columns from tablet through desktop. Desktop acceptance is reviewed at 1280px and 1440px. No dashboard mock data is used.

## Acceptance checklist

- [x] ADMIN sees content and administration statistics and workspaces.
- [x] CONTENT_MANAGER sees only content statistics and workspaces.
- [x] USER and guests cannot enter `/admin`.
- [x] API loading, retry, zero counts, and failure states work.
- [x] Workspace navigation remains available when summary loading fails.
- [x] Dashboard layout is usable at desktop widths of 1280px and 1440px.
