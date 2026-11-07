# Learner homepage

## Design reference

Use the supplied Phase 1 mockup for the hierarchy. Put a compact welcome banner above the next learning action. Use the EngoLearn palette and typography, with a small illustrated phrase card on wider screens. Keep secondary links visually quieter than the learning action.

## Route and components

- `/` is the learner homepage under `LearningLayout` and replaces the welcome demo.
- `TopicHomeView` owns the page within Topic Learning so it can reuse the Topic catalog client and UI. The authenticated card uses the first result from `GET /api/v1/topics/mine?status=IN_PROGRESS&limit=1`, ordered by latest access by the API.
- `Mở chủ đề` links to Topic Detail and uses My Topics as its return destination. Topic Detail owns start and resume eligibility.

## States

| State | Homepage action |
|---|---|
| Guest | Browse published topics or sign in |
| Authenticated with an in-progress Topic | Show its title, cover if available and completed/visible situations. Open its detail |
| Authenticated with no in-progress Topic | Browse topics. Link to My Topics if completed topics exist |
| Session or Topic request pending | Show the loading state and keep browse available |
| Session or Topic request fails | Offer retry and keep browse available |

The signed-in request is scoped to the current auth identity. A change of identity discards the previous learner's card.

## UI scope and responsive behavior

Use the existing Topic, auth and shell contracts. At narrow widths, stack the banner, next action and links in one column. Progress is shown only for the Topic returned by My Topics.

## Verification checklist

- Open Home directly and through learner navigation. Check the main action at desktop and mobile widths.
- Use the frontend proxy with the local backend to verify guest browsing and a signed-in Topic state where local test accounts are available.
- Run frontend build and lint once.
