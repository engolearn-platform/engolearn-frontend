# Authentication

See the [required authorization rules](../../architecture/security-authorization.md) and [role integration guide](role-authorization.md) for protected routes and role-dependent UI.

## Routes and behavior

- `/profile` stays public. Guests retain the existing registration/sign-in card. Signed-in users see a responsive Profile dashboard with server-derived email and role and an optional editable display name. Only learner (`USER`) accounts see CEFR and current Subscription benefits; Admin and Content Manager see account information without learner cards, and the page does not request Subscription data for them. Profile links remain available in learning/management top bars.
- Auth/session operations retain same-origin cookie requests and ask AuthProvider to recheck the session after login/register/logout. Signed-in profile reads and name updates use `/api/v1/profile/me`; current plan/benefits use `/api/v1/subscription/me` through the Subscription contract. The page never reads or stores JWTs. Display name is optional (`null` clears it); email and role are read-only. Session check, explicit refresh and page reload remain in a collapsed technical section. The guest experience is unchanged.
- Registration asks for a password of at least 8 characters and at most 72 UTF-8 bytes, matching the backend password constraints. Session bootstrap failures and unconfirmed logout offer retry actions.

- `/login` and `/register` are public routes owned by `src/features/auth/`.
- `/` has one app-composition owner. It uses the shared session state to show the guest landing page, a neutral pending state, public landing information with retry on session errors, or the signed-in learner homepage inside `LearningLayout`.
- `/login` and `/register` show their forms only to guests. While AuthProvider restores the session, a gate shows a loading state or a retry action. With a confirmed identity, the gate replaces the history entry and redirects based on the server role.
- `ADMIN` and `CONTENT_MANAGER` land in `ManagementLayout` at `/admin/topics`. A valid captured URL within Topic management or Learning Path passage management (`/admin/learning-paths/passages`) retains its path, query, and fragment. `USER` returns to a validated local destination or `/`. The `/profile` diagnostic page keeps its own in-page flow.
- Admin topic and subscription management routes wait for session bootstrap and redirect guests to login. Topic learning routes remain public.
- Learning and management top bars expose sign out. Local identity is cleared even when server revocation cannot be confirmed; the provider retains an error describing that outcome.

## State and requests

`AuthProvider` continues to own shared application auth. Separately, `/profile` calls `/api/v1/auth/me`; if `/me` returns 401 it posts `/refresh` once and retries `/me` once. Login, register, refresh and logout use same-origin requests with browser-managed cookies. User and role come from the server response. Access and refresh cookies are browser managed; the frontend never reads them or stores them in web storage. A refresh 401 means guest; network and server failures remain visible with a retry action. Auth mutations use the browser Web Locks API when available to serialize across tabs. The dashboard fetches profile and subscription data only while the page has a signed-in identity; each card has its own loading/error/retry state.

The shared auth provider now uses only server-cookie identity. The profile test page keeps local identity state and asks the shared provider to reload after auth changes so login/register route gates respond to the current cookie identity.

The shared `HttpService` keeps cookie authentication and its single refresh/retry on eligible 401 responses. Its regular request headers include `ngrok-skip-browser-warning: 1` for the ngrok proxy; operation-specific headers can override defaults. The automatic refresh request retains its existing configuration.

Multipart callers may pass `FormData` through the same POST/PATCH methods. The
client sends that body directly and leaves Content-Type/boundary generation to
the browser, including after the existing refresh/retry. Ordinary bodies retain
JSON serialization. Passage client checks cover both paths.
HTTP errors also retain the original ProblemDetail body as optional `problem: unknown`.
Feature clients validate their own extensions before rendering them; the shared client
does not depend on Passage or other feature types. Publication uses this to display
updated readiness from a 422 without changing the existing refresh/retry policy.

## Profile verification checklist

1. Run the real backend plus frontend proxy.
2. Open `/profile` as guest and register or sign in. The guest form stays in place; the signed-in dashboard shows account, CEFR and current benefits without hardcoded plan data.
3. Edit, clear and reload display name; verify CEFR and plan are unchanged. Check missing-profile and subscription error/retry states, including a narrow viewport.
4. Open the technical section, record ID/email/role, use “Kiểm tra phiên”, then “Tải lại trang”: expect the same identity without entering credentials again.
5. Sign out, open `/profile` again, then log in with the same account: expect the same ID/email/role. Compare against Mongo separately to prove persistence.
6. Test in a second browser profile to observe independent sessions.

On 2026-11-04, the real FE proxy + default-profile backend + isolated Mongo HTTP harness passed39/39 assertions, including persistence, expiry, rotation race and independent-device logout. See workspace Note/authentication/12-user-default-auth-verification.md. Browser rendering/interaction is still unverified because browser automation could not access the local page. HTTP evidence is not browser E2E. Build and lint passed (0 errors,72 warnings). No mocked session or fixture identity was used as integration evidence.

## Backend coordination

The frontend targets the MVP contract in `Note/authentication/02-fe-be-api-contract.md`: `/register`, `/login`, `/refresh`, `/me`, and `/logout`. Cross-tab refresh rotation behavior is backend dependent and is not verified by this client.

Assessment/Placement merge integration (2026-11-08): GuestOnlyGuard alone uses `authReturnTo` and owns the post-authentication redirect; AuthForm retains a synchronous submission lock and preserves return-to state when switching between login/register. The legacy `getAuthReturnTo` export delegates to the same validator; network-path/backslash/control-character and login/register-loop targets fall back to `/`. Authentication mutations use the form's busy state rather than tearing down the form through the global session-bootstrap loading gate. A rejected login is a form-owned error; only session bootstrap failures block the gate. Real-browser acceptance for the current change is recorded separately from historical auth harness results.

## Shared Guest navigation — 2026-11-08

PublicNavigation now lives in shared/components (old landing path re-exports it for compatibility). Home, previews, Guest Placement start/submitted/result fallback and login/register use the same component. Auth navbar preserves the existing return-to state across login/register. The shared PUBLIC_PATHS constants retain the existing landing aliases; URLs do not change. Attempt and authenticated Placement layouts remain unchanged.
