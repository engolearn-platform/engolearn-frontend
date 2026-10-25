# Learning Path list

Route: `/learning-paths`

- Loads active paths from `GET /api/learning-paths?userId=…&status=ACTIVE` on
  entry. The response counts populate all three status sections.
- Loads `COMPLETED` or `CANCELLED` paths only when the corresponding section is
  expanded. Search remains client-side and matches creation date or micro-skill
  for active/completed paths; cancelled paths are excluded.
- The local Vite server proxies `/api` to the backend at `http://localhost:8080`.
  `VITE_LEARNING_PATH_USER_ID` supplies the current local test user's Mongo
  ObjectId until frontend authentication is connected.
- The periodic-test result action remains disabled until its result route is
  available. The list API now provides `sourceAttemptId`.
