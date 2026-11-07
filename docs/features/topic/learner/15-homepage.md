# Learner homepage

## Design reference

Use the supplied Phase 2 dashboard and discovery reference for signed-in learners. After the welcome banner, the page renders Progress Overview, Continue Learning, and Feature Discovery in that order.

## Route and components

- `/` is the learner homepage under `LearningLayout` and replaces the welcome demo.
- `LearnerHomeRoute` supplies the Learning Path and Assessment readers through the app router. `TopicHomeView` keeps the guest entry and signed-in dashboard separate. The signed-in dashboard and its three sections live under Topic Learning.
- The My Topics request (`GET /api/v1/topics/mine?status=IN_PROGRESS&limit=1`) supplies both the overview counts and the most recent unfinished Topic. Topic Viewer supplies the current profile learning level.
- `Mở chủ đề` links to Topic Detail and uses My Topics as its return destination. Topic Detail owns start and resume eligibility.
- Learning Path uses the cookie-authenticated active list and the most recently created path's detail. An open week shows its returned day states. The card links to path detail or the list and leaves day-start eligibility to the owning screen.
- Assessment counts valid (`READY`) results for the current calendar month in Vietnam time. It reads the existing history in descending completion order until it reaches the previous month or the end of history. The card links to Assessment History.
- Grammar continuation uses explicitly labeled sample data from `home-dashboard.mock.ts`. Its action opens the existing Grammar preview. Feature Discovery has Topic, Grammar preview, Assessment and Dictionary tiles. The Dictionary tile communicates unavailability and has no link.

## States

| State | Homepage action |
|---|---|
| Guest | Browse published topics or sign in |
| Authenticated with an in-progress Topic | Show its title, cover if available and completed/visible situations. Open its detail |
| Authenticated with no in-progress Topic | Continue Learning keeps its Topic and Grammar slots. The Topic slot offers browsing |
| Session or Topic request pending | Show the loading state and keep browse available |
| Session or Topic request fails | Offer retry and keep browse available |

The signed-in request is scoped to the current auth identity. A change of identity discards the previous learner's card.

## UI scope and responsive behavior

Use the existing auth and shell contracts. Overview and continuation cards stack on mobile and use two columns on larger screens. Discovery uses two columns on mobile and four on wide screens. Overview displays actual values, empty states, or a localized error and retry for each data source.

## Verification checklist

- Check overview, continuation and discovery layout plus Topic and Assessment links. Verify the Grammar sample label and the unavailable Dictionary tile.
- Use the frontend proxy with the local backend for signed-in reads when a local account is available.
- Run frontend build and lint once.
