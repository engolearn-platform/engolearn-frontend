# Quản lý người dùng

The ADMIN workspace at `/admin/users` uses the existing management shell and design-system list pattern. Its shared header, filter controls, responsive roster and pagination lead to a keyboard-accessible account dialog. Search, role, status, sort, page and size live in the URL. Closing a dialog returns to the same list and restores focus. A removed last page selects the last available page.

The workspace reads `/api/v1/admin/users` via the shared HTTP client. Account detail supplies the revision for each edit, status change, role change or deletion. ADMIN targets are read-only. Create accepts an initial password, which the form clears when submitted. Edit accepts only the displayed name. Status, role and deletion require an explicit decision naming the account and effect. A conflict refreshes the detail and requests a new decision. Caller authorization failures revalidate the session independently and discard the open form. Closing detail restores focus to the row opener, or the roster heading when the opener is unavailable.

Verify list states, search and pagination, both assignable roles, accessible dialogs, cancellation, write outcomes, and guest and non-ADMIN direct entry on mobile and desktop. The [backend contract](../../../../engolearn-backend/docs/technical/security/f05-user-management.md) defines the endpoints and problem codes.
