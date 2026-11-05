# Authentication

## Routes and behavior

- `/profile` is a public real-cookie auth test page. It derives profile identity from its own server requests. After login/register/logout it asks AuthProvider to recheck the cookie session so other routes have current identity. Guests can register or sign in; authenticated users see only server-provided ID, email and role, with session check, explicit refresh, full-page reload and logout actions. Profile links are available in learning/management top bars.
- The profile uses same-origin `fetch` requests with browser-managed cookies. It never reads or stores JWTs. Compare the same ID/email after reload and logout/login to check identity continuity; the page alone does not prove Mongo persistence. No profile editing or extra user fields are introduced. Layout uses existing design tokens/Button and stacks actions on mobile.
- Registration asks for a password of at least 8 characters and at most 72 UTF-8 bytes, matching the backend password constraints. Session bootstrap failures and unconfirmed logout offer retry actions.

- `/login` and `/register` are public routes owned by `src/features/auth/`.
- `/login` and `/register` show their forms only to guests. While AuthProvider restores the session, a gate shows a loading state; authenticated users are redirected to a validated captured local destination, or `/`, with history replacement. Session errors show a retry action rather than a guest form. The profile test page refreshes shared identity after login/register/logout so this gate sees cookie-auth changes made there.
- After successful authentication, the app returns to a safe local route captured by the guard, or `/`.
- Admin topic and subscription management routes wait for session bootstrap and redirect guests to login. Topic learning routes remain public.
- Learning and management top bars expose sign out. Local identity is cleared even when server revocation cannot be confirmed; the provider retains an error describing that outcome.

## State and requests

`AuthProvider` continues to own shared application auth. Separately, the `/profile` test page calls `/api/v1/auth/me`; if `/me` returns 401 it posts `/refresh` once and retries `/me` once. Login, register, refresh and logout use same-origin requests with browser-managed cookies. User and role come from the server response. Access and refresh cookies are browser managed; the frontend never reads them or stores them in web storage. A refresh 401 means guest; network and server failures remain visible with a retry action. Auth mutations use the browser Web Locks API when available to serialize across tabs.

The shared auth provider now uses only server-cookie identity. The profile test page keeps local identity state and asks the shared provider to reload after auth changes so login/register route gates respond to the current cookie identity.

## Profile verification checklist

1. Run the real backend plus frontend proxy.
2. Open `/profile` as guest and register or sign in. The page should show the server identity.
3. Record the displayed ID/email/role. Use “Kiểm tra phiên”, then “Tải lại trang”: expect the same identity without entering credentials again.
4. Sign out, open `/profile` again, then log in with the same account: expect the same ID/email/role. Compare against Mongo separately to prove persistence.
5. Test in a second browser profile to observe independent sessions.

On 2026-11-04, the real FE proxy + default-profile backend + isolated Mongo HTTP harness passed39/39 assertions, including persistence, expiry, rotation race and independent-device logout. See workspace Note/authentication/12-user-default-auth-verification.md. Browser rendering/interaction is still unverified because browser automation could not access the local page. HTTP evidence is not browser E2E. Build and lint passed (0 errors,72 warnings). No mocked session or fixture identity was used as integration evidence.

## Backend coordination

The frontend targets the MVP contract in `Note/authentication/02-fe-be-api-contract.md`: `/register`, `/login`, `/refresh`, `/me`, and `/logout`. Cross-tab refresh rotation behavior is backend dependent and is not verified by this client.

Assessment integration (2026-11-05): GuestOnlyGuard and AuthForm share `authReturnTo`; network-path/backslash/control-character and login/register-loop targets fall back to `/`. Authentication mutations use the form's busy state rather than tearing down the form through the global session-bootstrap loading gate. A rejected login is a form-owned error; only session bootstrap failures block the gate. Real-browser acceptance for the current change is recorded separately from historical auth harness results.
