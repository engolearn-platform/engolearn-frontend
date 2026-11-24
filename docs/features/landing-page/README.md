# Guest landing page

## Visual reference

Follow the supplied EngoLearn landing screenshot: teal and mint palette, penguin study hero, compact benefits strip, feature cards, three-step learning journey, illustrated closing call to action, and footer. Use the shared horizontal EngoLearn logo (`/brand/engolearn-logo.webp`) for full brand placements and the square mark (`/brand/engolearn-mark.png`) where an icon is needed. Use shared Hanken Grotesk typography, color tokens, existing Button and Lucide icons. Hero and closing-banner artwork are decorative and use empty alt attributes. The hero artwork is `/landing/penguin-hero.webp`; keep its art free of overlaid UI labels. The closing banner places its illustration left, copy in the middle, and action at the right on wide screens, then stacks compactly on smaller screens. The landing page has no FAQ section or FAQ anchor links.

## Route ownership

- `src/router.tsx` is the sole composition owner for `/`. Its nested home route renders `LearnerHomeRoute`, which supplies the data readers for the signed-in dashboard.
- `src/features/placement/routes.ts` exclusively owns `/placement` and its attempt/submitted/result/review routes. Placement stays outside the shared learner layout and selects its own Guest/User shell.
- The root view reads `useAuth` to choose the guest landing page, a neutral session-loading state, the public landing page with retry after session errors, or the learner dashboard wrapped in `LearningLayout` for a signed-in user.
- Landing CTAs use `/placement` from `src/features/landing-page/paths.ts` and open the real Placement start page. No placeholder route is registered; the landing feature does not import another feature.
- Login links use `/login`. Topic and grammar links use their existing public routes. Do not change auth guards, post-login redirects, roles, learner navigation, `/assessment`, or assessment behavior.

## Public resource previews

- Landing and public resource previews share `PublicNavigation`. It keeps the existing top-level navigation and adds a **Tính năng** disclosure for Topic, Grammar, and the Learning Path preview. The feature overview and learning journey still link to their landing sections.
- Guests visiting `/topics`, `/topics/:topicId`, or `/grammar` see the public header and the selected resource. Signed-in learners keep the existing catalog shell or standalone Topic Detail layout. The app router composes these layouts around the feature-owned routes.
- Topic preview uses the existing published catalog and read-only detail. The detail sign-in link returns to the same local URL, including filters and origin information carried in the query string.
- Grammar preview uses the existing sample roadmap's lesson titles and descriptions. It displays a sample label and omits personal progress, goals, and lesson-start actions.
- `/preview/learning-path` shows an illustrative week and a sign-in entry to the learner's path list. Its content is static. The preview does not load a learner's path, assessment, or practice data.
- Desktop supports pointer hover and click for the disclosure. Mobile supports touch. Keyboard users can tab through the links and close with Escape.

## Components and state

- `GuestLandingView`: header and section navigation, hero, benefits, learning feature cards, three-step journey, illustrated final CTA and footer.
- `LandingEntryView`: root session routing and accessible pending/error states.
- State is UI-only and derived from `useAuth`; retry calls `refetch`. No new API calls or auth mutations.

## Responsive and accessibility checklist

- [ ] Hero text and artwork stack on narrow viewports; feature cards and journey adapt without horizontal overflow.
- [ ] Closing-banner illustration is compact on mobile and sits left of the copy and action on wide screens; heading and action remain close together on small screens.
- [ ] Navigation, CTAs, cards, and retry are keyboard reachable with visible focus.
- [ ] Decorative artwork and icons are hidden from assistive technology; headings and landmarks are semantic.
- [ ] Pending state is announced; session retry is an actionable button.
- [ ] Contrast, Vietnamese line height, and spacing follow the EngoLearn design tokens.

Integration refresh: keep main's public resource layouts, Topic detail/My Topics split and Learning Path preview. PlacementRoutes exclusively owns /placement; the placeholder is not registered. Auth return-to and Placement shells are preserved.

## Shared Guest navigation — 2026-11-08

PublicNavigation now lives in shared/components (old landing path re-exports it for compatibility). Home, previews, Guest Placement start/submitted/result fallback and login/register use the same component. Auth navbar preserves the existing return-to state across login/register. The shared PUBLIC_PATHS constants retain the existing landing aliases; URLs do not change. Attempt and authenticated Placement layouts remain unchanged.
