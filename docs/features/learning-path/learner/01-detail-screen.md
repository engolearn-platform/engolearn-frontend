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
- The confirmed micro-skill catalog in `AGENTS_learning_path.md` supplies names; outdated names in the Figma examples are replaced.

## Tab content

- **Open week:** date range, closing time, remaining days, answered/assigned progress, reminder about day order and closing time, and day cards. A day card shows status, progress, and the appropriate practice action.
- **Closed week:** date range, six metrics (assigned, answered, correct, wrong, Completion Rate, Practice Score), results per micro-skill, and read-only day cards with result actions.
- **Summary:** path date range, overall Completion Rate, progress per week, and one result card per micro-skill showing Final Practice Score, initial score, answered count, and signed improvement.

## UI-only state

This screen currently uses typed local sample data. The `preview=completed` query parameter selects the completed sample; other URLs show the in-progress sample. Existing active and completed list cards link to the corresponding preview. The page does not request detail data or submit practice answers. Practice and day-result actions are displayed but disabled until their screens exist.

Sample dates, scores, counts, and names are illustration data. All derived progress labels and bars use the same counts. The layout stacks cards on narrow screens, allows the tab row and weekly table to scroll horizontally, and uses the existing learner shell.
The detail content fills the learner workspace up to 1300px, with responsive side padding that balances card width and surrounding space.
