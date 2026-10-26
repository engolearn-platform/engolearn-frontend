# Daily Learning Path practice

Route: `/learning-paths/:pathId/weeks/:weekNo/days/:dayNo/practice`

Design references: Figma nodes `525:2` (page 2/4) and `525:325` (page 4/4).

The screen uses `LearningLayout` and a content container up to 1300px, matching the Learning Path list and detail screens. On wide screens, question cards occupy the main column and the question navigator sits in a 300px column. On narrow screens, the navigator follows the question cards.

- A back link returns to the Learning Path detail. The header identifies the day, source path, week, level, and day closing time.
- Ten questions are divided into pages of 3/3/3/1. A question may show an audio stimulus or a reading passage, followed by four choices.
- Choices on the current page can be changed until the learner selects every answer and presses **Tiếp tục**. Earlier pages are marked saved and locked. The last page uses **Nộp bài**.
- The navigator groups questions by page and distinguishes saved, selected, unanswered, and unopened questions. It does not permit skipping an unanswered question.
- The UI uses local preview state only. Query `page=2` opens the partially selected middle-page example; `page=4` opens the final-page example. Audio controls are visual samples without an audio source. No backend request or answer submission is performed.

Displayed dates, question text, answers, and scores are sample data. Micro-skill names follow the confirmed catalog in `AGENTS_learning_path.md` rather than older Figma labels.
