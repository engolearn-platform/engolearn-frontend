# Integrate role authorization

Apply the [security authorization rules](../../architecture/security-authorization.md) to the routes and UI requirements approved by your feature owner. Use the auth public capability from `@features/auth/contract`.

## Protect nested routes

Put `ProtectedRoute` in your feature's `routes.ts` above protected pages and their layouts. Continue composing the exported feature route list through the application router. The example shows how the Topic feature could protect a workspace shared by Content Managers and Admins.

```ts
import { createElement } from "react";
import { ProtectedRoute } from "@features/auth/contract";
import TopicManagementListView from "@features/topic/views/management/TopicManagementListView";
import type { RouteObject } from "react-router";

export const exampleRoutes: RouteObject[] = [
  {
    element: createElement(ProtectedRoute, { allowedRoles: ["CONTENT_MANAGER"] }),
    children: [{ path: "/example/topic-management", Component: TopicManagementListView }],
  },
];
```

For an authenticated-only route, set `Component: ProtectedRoute` and provide the child routes as in the example.

The guard shows pending UI while the session loads and a retry action if bootstrap fails. Guests go to login with the local route, query, and fragment preserved for the existing return-to validation. An authenticated user without the listed role or an inherited role sees the 403 view. Authorized callers render the child route through the outlet.

## Share a screen across roles

```tsx
import { HasRole } from "@features/auth/contract";

export function TopicManagementActions() {
  return (
    <>
      <HasRole allowedRoles={["CONTENT_MANAGER"]} fallback={<span>Read-only</span>}>
        <button type="button">Edit Topic</button>
      </HasRole>
      <HasRole allowedRoles={["ADMIN"]}>
        <button type="button">Admin Settings</button>
      </HasRole>
    </>
  );
}
```

Content Managers and Admins see **Edit Topic**. Admins also see **Admin Settings**. On a page shared with learners, a USER sees **Read-only**. Omit `fallback` to render nothing when access is unconfirmed or denied. The fallback is also used during loading, bootstrap errors, and guest sessions. `HasRole` leaves navigation to the page.

## Verify the integration

1. Run `npm run test:auth` from the frontend repository. It runs the role matrix and route/component checks with Node 22.18+ and simulated HTTP responses.
2. Enter the protected URL directly as a guest. Sign in and confirm the return destination includes the original query and fragment. Reload the page and exercise the pending, retry, and forbidden states.
3. Compare the same page across the applicable roles. Confirm that a successful refresh reflecting a role change and a completed logout remove any controls or pages the caller can no longer access.
4. Verify the protected operation against the actual backend with the relevant roles. Run `npm run build` and `npm run lint`.
