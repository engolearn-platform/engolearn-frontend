# Learning Path list

Route: `/learning-paths`

The list content uses the same 1300px maximum width and responsive side padding
as the Learning Path detail screen.

- Loads active paths from `GET /api/learning-paths?userId=…&status=ACTIVE` on
  entry. The response counts populate all three status sections.
- Loads `COMPLETED` or `CANCELLED` paths only when the corresponding section is
  expanded. Search calls `GET /api/learning-paths/search?userId=…&keyword=…`
  and matches creation date (`DD/MM/YYYY`) or micro-skill across active and
  completed paths; cancelled paths are excluded. The completed section opens
  while search results are shown.
- Search requests are debounced by 300 ms and keep the same list response shape,
  including the unfiltered section counts. While searching, section badges show
  the number of matching items in each visible status section.
- The local Vite server proxies `/api` to the backend at `http://localhost:8080`.
  `VITE_LEARNING_PATH_USER_ID` supplies the current local test user's Mongo
  ObjectId until frontend authentication is connected.
- The periodic-test result action remains disabled until its result route is
  available. The list API now provides `sourceAttemptId`.
- Active and completed cards open `/learning-paths/:pathId`. The detail screen
  currently uses local preview data; completed cards pass `preview=completed`.
  Cancelled cards remain non-interactive.
