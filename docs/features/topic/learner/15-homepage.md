# Learner homepage

## Design reference

Use the supplied Phase 1 mockup for the hierarchy. Put a compact welcome banner above the next learning action. Use the EngoLearn palette and typography, with a small illustrated phrase card on wider screens. Keep secondary links visually quieter than the learning action.

## Route and components

- `/` is composed once by `src/router.tsx`. Guests see the public EngoLearn landing page; after session restoration, signed-in users see this existing learner homepage under `LearningLayout`.
- `TopicHomeView` owns the page within Topic Learning so it can reuse the Topic catalog client and UI. The authenticated card uses the first result from `GET /api/v1/topics/mine?status=IN_PROGRESS&limit=1`, ordered by latest access by the API.
- `Mở chủ đề` links to Topic Detail and uses My Topics as its return destination. Topic Detail owns start and resume eligibility.

## States

| State | Homepage action |
|---|---|
| Guest | See the public landing page with topic, grammar, sign-in, and placement links |
| Authenticated with an in-progress Topic | Show its title, cover if available and completed/visible situations. Open its detail |
| Authenticated with no in-progress Topic | Browse topics. Link to My Topics if completed topics exist |
| Session restoration pending | Show a neutral accessible state before choosing the public or learner homepage |
| Session restoration fails | Keep the public landing page visible and offer retry |
| Topic request pending or fails | On the signed-in homepage, show the existing loading/error state and keep browse available |

The signed-in request is scoped to the current auth identity. A change of identity discards the previous learner's card.

## UI scope and responsive behavior

Use the existing Topic, auth and shell contracts. The guest landing is owned by `src/features/landing-page/`; its `/placement` link is a public placeholder until that route is supplied. No auth guards, roles, redirects, or assessment routes are changed. At narrow widths, stack the banner, next action and links in one column. Progress is shown only for the Topic returned by My Topics.

## Verification checklist

- Open Home directly and through learner navigation. Check the main action at desktop and mobile widths.
- Use the frontend proxy with the local backend to verify guest browsing and a signed-in Topic state where local test accounts are available.
- Run frontend build and lint once.
