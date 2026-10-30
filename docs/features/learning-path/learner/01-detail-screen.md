# Learning Path detail

Route: `/learning-paths/:pathId`

## Design references

- Week in progress: Figma node `557:1416`.
- Closed week: Figma node `557:787`.
- Path summary: Figma node `483:900`.

The three references are content states of one detail screen. Its navigation has four tabs: Week 1, Week 2, Week 3, and Summary. The page reuses `LearningLayout` and the EngoLearn design tokens.

## Shared frame

- A back link returns to the Learning Path list.
- A collapsible overview shows creation date, status, level, micro-skill count, three-week workload, initial score per micro-skill, and answered/assigned progress.
- Closed weeks remain selectable. Future weeks and Summary are locked until available. Summary becomes available when the path is completed.
- The optional `week` query parameter selects an unlocked week when returning from that day's review; otherwise the usual current-week or Summary default applies.
- The confirmed micro-skill catalog in `AGENTS_learning_path.md` supplies names; outdated names in the Figma examples are replaced.

## Tab content

- **Open week:** date range, closing time, remaining days, answered/assigned progress, reminder about day order and closing time, and day cards. A day card shows status, progress, and the appropriate practice action.
- Days submitted with unanswered questions have status `SUBMITTED` and display “Đã nộp · Chưa hoàn thành”; they open the result screen and count as finished when waiting for the next week. Automatically closed days remain `CLOSED`.
- **Waiting between weeks:** when every day of open week 1 or 2 has been completed or closed, replace the remaining-days badge and ordinary deadline text with a message giving the next opening date at midnight in Vietnam time. The date comes from the last day closure and the week deadline; if closure times are unavailable, use a general midnight message. While this page remains open, it reloads server state around the expected closing time and retries every 30 seconds if the backend has not yet transitioned or is temporarily unavailable. The backend determines when the new week opens. This also covers days submitted with unanswered questions.
- **Closed week:** date range, six metrics (assigned, answered, correct, wrong, Completion Rate, Practice Score), results per micro-skill, and read-only day cards with result actions.
- Weekly metrics use the daily result color rules: wrong answers below 50% of answered are green, 50% or more are red, and no answered questions is neutral. Completion Rate and Practice Score are red below 50%, yellow from 50% to under 75%, green from 75%, or neutral when no data exists.
- Metric values without data use a smaller font so their text fits without increasing the height of the metric cards.
- **Summary:** path date range, overall Completion Rate, progress per week, and one result card per micro-skill showing Final Practice Score, initial score, answered count, and signed improvement.

## Data source and states

The screen loads `GET /api/learning-paths/:pathId?userId=…` through `useLearningPathDetail` and the Learning Path service. The `pathId` from the route selects the actual active or completed path; `VITE_LEARNING_PATH_USER_ID` supplies the local test user. Loading and request errors use the shared `Loading` and `EmptyState` components. The previous `preview=completed` detail switch is removed.

The response supplies path configuration and progress, baseline scores, week/day statuses, closed-week statistics, and the completed summary. Available backend Completion Rate, Practice Score, and improvement values are used directly and rounded for display; open progress is derived from answered/assigned counts. Date/time values are displayed in the Vietnam time zone. Locked weeks and the Summary tab stay unavailable until the backend status permits them.

Day cards open the practice or daily result screens described in `02-daily-practice-screen.md` and `03-daily-result-screen.md`. Practice loads questions, saves drafts and submits through the backend. The result screen reads the saved daily summary and question review from the backend.

The layout stacks cards on narrow screens, allows the tab row and weekly table to scroll horizontally, and uses the existing learner shell.
The detail content fills the learner workspace up to 1300px, with responsive side padding that balances card width and surrounding space.
