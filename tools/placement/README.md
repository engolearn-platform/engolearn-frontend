# Optional Placement deadline regression

Run from the frontend root after npm ci, with BE in dev,placement-local mode,
Docker Mongo and npm run dev on http://localhost:3000 already running.
Uses existing esbuild/React packages, a separate headless Chrome profile and
real FE proxy, BE and canonical data. Requires Windows Chrome and the sibling
engolearn-backend/.env APP_DB to explicitly name a local dev database.

```powershell
$env:PLACEMENT_DEADLINE_UI_ALLOW_WRITES='1'
node tools/placement/check-deadline-ui.mjs auto
node tools/placement/check-deadline-ui.mjs empty
node tools/placement/check-deadline-ui.mjs active
```

auto/empty shorten only newly created Guest test attempt deadlines to exercise
real server finalization. active sends an invalid option through the real API
and proves an unresolved save cannot submit a still-active attempt. Dedicated
test attempts are retained; no existing User/Guest attempt or paper is modified.
The checker creates and removes a random temporary public HTML page, kills only
its own Chrome process tree, closes its control listener and removes its own
temporary profile. The user's browser session is untouched. No mocked responses.

Optional overrides: PLACEMENT_MONGO_CONTAINER (default mongodb_srv),
PLACEMENT_CHROME_EXECUTABLE (default installed Chrome on Windows).
These checks are development tools, not dependencies of the normal app startup.
