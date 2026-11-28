# Learner homepage

## Design reference

Use the approved single-column progress dashboard from this chat: four compact overview
cards, then Assessment, Learning Path, Topic, Grammar and Speaking sections in that order.
Section headings are outside their cards. Each main card uses a content/action header
and a separate progress/results area. Preserve LearningLayout, sidebar, top bar and companion.
Use existing design tokens, Card/Button and the Topic progress bar. No welcome hero,
feature-discovery grid or sample Grammar data remains on the signed-in page.

## Route, ownership and data

`/` still composes LandingEntryView -> LearnerHomeRoute -> TopicHomeView. Guest landing
and session restoration behavior are unchanged. Fetch only inside the authenticated
identity-keyed dashboard; identity change unmounts it and aborts all requests.

Each module owns a new home-summary client/type. Cross-feature readers are exported through their public contracts; Topic keeps its own reader private.
The dashboard consumes these contracts with the shared useFetch hook. Existing API
clients and routes remain unchanged. Profile and micro-skill catalog readers are reused.

| Request | Content |
| --- | --- |
| GET /api/v1/topics/home-summary | Topic statistics and current/next situation |
| GET /api/v1/grammar/home-summary | Grammar statistics, current topic/lesson, scoped scores |
| GET /api/learning-paths/home-summary | Path statistics, current path, availability and empty actions |
| GET /api/v1/assessment/home-summary | Latest valid result, frozen section totals, permitted weak skills |
| GET /api/v1/speaking/home-summary | Non-deleted V2 sessions, measured learner speech and optional criteria |
| GET /api/v1/profile/me | Profile level |
| GET /api/micro-skills | Vietnamese labels; canonical names remain the fallback |

Backend source of truth: `engolearn-backend/docs/technical/learner-home-summary.md` and
its owner-specific links. Return counts are current-state counts, not lifetime totals.
Profile level, test level and path level are independent. No default A1, fake scores,
calendar streak, time tracking or hardcoded Reading/Listening denominators.

## States and actions

Every source has independent skeleton/error/retry. Errors never become empty or zero;
overview tiles show an unavailable marker and share the source retry with their card.
Empty cards are compact, each with one explanation and an existing navigation destination.

- Assessment empty opens /assessment; populated opens its existing result screen.
  Preview shows only returned skills and explains limited analysis. Demo is marked.
- Path empty maps ASSESSMENT_REQUIRED to /assessment, RECOMMENDATION_AVAILABLE to
  the source Assessment result/recommendation, PAST_PATHS_ONLY to the path list,
  NO_WEAK_SKILLS/NO_ELIGIBLE_SKILLS to learning discovery. An active path opens its
  detail; canPractice=false uses viewing wording. No day is auto-started.
- Topic empty offers discovery, with completed-count-aware copy. The card opens
  Topic Detail with My Topics as return origin; normal current/eligible next items
  are labeled separately, never a guessed resume frontier.
- Grammar empty offers roadmap. Populated opens the returned lesson; scores belong
  only to that lesson, and missing scores stay absent. No roadmap call on homepage.
- Speaking empty offers Topic discovery to choose a scope (no global unscoped start
  API exists). With sessions show counts, actual speech time, latest title/status and
  criteria in their original 100/5 scales; pending/missing criteria have no score.
  Ended sessions open result, unfinished sessions open their existing session screen.
- New learners get a short optional orientation message; no mandatory onboarding order.

All homepage effects are GETs except the shared auth transport's existing cookie refresh.
Never start sessions/practice, request microphone, create paths or grant unlocks on mount.

## Responsive and verification

Content uses a centered max-w-6xl container and 20px mobile margins. Overview is two
columns on mobile and four on wide screens. Main modules always stack; card actions
move below the header on mobile. Long titles/chips wrap and no horizontal scrolling.
Use headings, text labels, accessible progress bars and 48px touch actions.

Verify build and lint plus real frontend proxy/backend reads and actual browser views
with available authenticated accounts. Do not use mocked HTTP/fixtures to verify this
integration. Report absent data, unavailable backend and unverified variants honestly.

### Live verification command

With the real backend and frontend proxy running, set ENGOLEARN_TEST_EMAIL and
ENGOLEARN_TEST_PASSWORD to an existing test account, then run `npm run test:home-live`.
Optional ENGOLEARN_TEST_ORIGIN defaults to http://localhost:3000 and must remain local.
This checks seven real responses, empty/available contracts, counters, no-store and
five anonymous 401s. It signs out only its own test session and never seeds progress.
Do not commit credentials or replace the backend with a fixture server.

Observed locally: build passes; lint has no errors; both public demo management
accounts return valid empty summaries through the proxy. The signed-in browser shows
all five empty sections and the first-step hint. Desktop 1440px and mobile 390px
layout bounds have no document overflow; no browser console errors were observed.
Populated cards, limited/full Assessment analysis, all Learning Path suggestion
variants and per-card network error/retry still need accounts/data exhibiting those
states for live visual acceptance. They are implemented from the backend contract,
not claimed as verified using mock responses. Existing sidebar/topbar files are unchanged.
