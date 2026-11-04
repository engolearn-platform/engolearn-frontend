# Learning Path list

Route: `/learning-paths`

The list content uses the same 1300px maximum width and responsive side padding
as the Learning Path detail screen.

- Loads active paths from `GET /api/learning-paths?userId=…&status=ACTIVE` on
  entry. The response counts populate all three status sections.
- Loads `COMPLETED` or `CANCELLED` paths only when the corresponding section is
  expanded. Search calls `GET /api/learning-paths/search?userId=…&keyword=…`
  and matches creation date (`DD/MM/YYYY`) or micro-skill across active and
  ended paths; cancelled paths are excluded. The “Lộ trình đã kết thúc” section opens
  while search results are shown.
- Search requests are debounced by 300 ms and keep the same list response shape,
  including the unfiltered section counts. While searching, section badges show
  the number of matching items in each visible status section.
- The local Vite server proxies `/api` to the backend at `http://localhost:8080`.
  `VITE_LEARNING_PATH_USER_ID` supplies the current local test user's Mongo
  ObjectId until frontend authentication is connected.
- The periodic-test result action remains disabled until its result route is
  available. The list API now provides `sourceAttemptId`.
- Active and ended cards open `/learning-paths/:pathId`. The detail screen
  fetches that path by ID through the backend detail API. Cancelled cards remain
  non-interactive.
- Card actions say “Bắt đầu luyện tập” for a path not started, “Tiếp tục luyện tập”
  for an in-progress path, and “Xem lộ trình” for an ended path. Progress stays
  beside the action at the bottom of active cards.
- A terminal `COMPLETED` path shows “Đã hoàn thành” in green only when its answered count equals its positive assigned count. Otherwise the card shows “Đã kết thúc” with a light blue `tertiary-fixed` background and navy `on-tertiary-fixed` text, distinct from the neutral gray cancelled badge. The section heading and icon refer to ended paths because it contains both cases; its API filter remains `COMPLETED`.
- Cards grow with their content instead of using a fixed height. Cards in the same
  grid row stretch equally, keeping their progress and action areas aligned.
- Status badges distinguish `IN_PROGRESS` with a light cyan color and
  `NOT_STARTED` with neutral gray; both retain their text labels.
