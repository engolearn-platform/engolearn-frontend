# Learning Path list

Route: `/learning-paths`

The list content uses the same 1300px maximum width and responsive side padding
as the Learning Path detail screen.

- Loads active paths from `GET /api/learning-paths?status=ACTIVE` on
  entry. The response counts populate all three status sections.
- Loads `COMPLETED` or `CANCELLED` paths only when the corresponding section is
  expanded. Search calls `GET /api/learning-paths/search?keyword=…`
  and matches creation date (`DD/MM/YYYY`) or micro-skill across active and
  ended paths; cancelled paths are excluded. The “Lộ trình đã kết thúc” section opens
  while search results are shown.
- Search requests are debounced by 300 ms and keep the same list response shape,
  including the unfiltered section counts. While searching, section badges show
  the number of matching items in each visible status section.
- The local Vite server proxies `/api` to the backend at `http://localhost:8080`.
  List/search use the shared HTTP client with the session cookie and bounded refresh;
  neither reads `VITE_LEARNING_PATH_USER_ID` or sends a `userId` override. Guests return
  through login with their destination. Identity changes remount list/search state and
  abort pending loads, including previously expanded sections.
- List/search items contain `sourceAssessmentAttemptId: string|null`, replacing the old
  `sourceAttemptId` response property. A linked periodic-test result action opens
  `/assessment/attempts/:sourceAssessmentAttemptId/result` in the current tab, with an
  encoded ID. Assessment's existing page loads the result and enforces owner/access rules;
  the Learning Path feature imports no Assessment component or client.
- Missing links keep the action disabled with the explanation “Chưa có bài đánh giá liên kết”.
  The result action keeps its original compact padding and automatic height, without a
  48px minimum height, as requested for the card layout.
  The backend resolves links from owned completed periodic projections; frontend never
  guesses IDs or changes source data. Link availability does not promise the Assessment
  still exists: its page handles unavailable/foreign results normally.
- Active and ended cards open `/learning-paths/:pathId`. The detail screen
  fetches that path by ID through the backend detail API. Cancelled cards do not open
  path detail, but can still open their linked Assessment result.
- Card actions say “Bắt đầu luyện tập” for a path not started, “Tiếp tục luyện tập”
  for an in-progress path, and “Xem lộ trình” for an ended path. Progress stays
  beside the action at the bottom of active cards.
- A terminal `COMPLETED` path shows “Đã hoàn thành” in green only when its answered count equals its positive assigned count. Otherwise the card shows “Đã kết thúc” with a light blue `tertiary-fixed` background and navy `on-tertiary-fixed` text, distinct from the neutral gray cancelled badge. The section heading and icon refer to ended paths because it contains both cases; its API filter remains `COMPLETED`.
- Cards grow with their content instead of using a fixed height. Cards in the same
  grid row stretch equally, keeping their progress and action areas aligned.
- Status badges distinguish `IN_PROGRESS` with a light cyan color and
  `NOT_STARTED` with neutral gray; both retain their text labels.
