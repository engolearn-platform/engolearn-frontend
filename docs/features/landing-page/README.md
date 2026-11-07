# Guest landing page

## Visual reference

Follow the supplied EngoLearn landing screenshot: teal and mint palette, penguin study hero, compact benefits strip, feature cards, three-step learning journey, illustrated closing call to action, and footer. Use the shared horizontal EngoLearn logo (`/brand/engolearn-logo.webp`) for full brand placements and the square mark (`/brand/engolearn-mark.png`) where an icon is needed. Use shared Hanken Grotesk typography, color tokens, existing Button and Lucide icons. Hero and closing-banner artwork are decorative and use empty alt attributes. The hero artwork is `/landing/penguin-hero.webp`; keep its art free of overlaid UI labels. The closing banner places its illustration left, copy in the middle, and action at the right on wide screens, then stacks compactly on smaller screens. The landing page has no FAQ section or FAQ anchor links.

## Route ownership

- `src/router.tsx` is the sole composition owner for `/`. Its nested home route renders `LearnerHomeRoute`, which supplies the data readers for the signed-in dashboard.
- `src/features/landing-page/routes.ts` owns `/placement`.
- The root view reads `useAuth` to choose the guest landing page, a neutral session-loading state, the public landing page with retry after session errors, or the learner dashboard wrapped in `LearningLayout` for a signed-in user.
- `/placement` is a public placeholder with a clear Vietnamese explanation and a link home. Its path lives in `src/features/landing-page/paths.ts` and is intentionally isolated for replacement by the future placement team.
- Login links use `/login`. Topic and grammar links use their existing public routes. Do not change auth guards, post-login redirects, roles, learner navigation, `/assessment`, or assessment behavior.

## Components and state

- `GuestLandingView`: header and section navigation, hero, benefits, learning feature cards, three-step journey, illustrated final CTA and footer.
- `LandingEntryView`: root session routing and accessible pending/error states.
- `PlacementPlaceholderView`: replaceable public placeholder route.
- State is UI-only and derived from `useAuth`; retry calls `refetch`. No new API calls or auth mutations.

## Responsive and accessibility checklist

- [ ] Hero text and artwork stack on narrow viewports; feature cards and journey adapt without horizontal overflow.
- [ ] Closing-banner illustration is compact on mobile and sits left of the copy and action on wide screens; heading and action remain close together on small screens.
- [ ] Navigation, CTAs, cards, and retry are keyboard reachable with visible focus.
- [ ] Decorative artwork and icons are hidden from assistive technology; headings and landmarks are semantic.
- [ ] Pending state is announced; session retry is an actionable button.
- [ ] Contrast, Vietnamese line height, and spacing follow the EngoLearn design tokens.
