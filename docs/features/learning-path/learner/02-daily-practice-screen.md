# Daily Learning Path practice

Route: `/learning-paths/:pathId/weeks/:weekNo/days/:dayNo/practice`

Design references: Figma nodes `525:2` (page 2/4) and `525:325` (page 4/4).

The screen uses `LearningLayout` and a content container up to 1300px, matching the Learning Path list and detail screens. On wide screens, question cards occupy the main column and the question navigator sits in a 300px column. On narrow screens, the navigator follows the question cards.

- A back link returns to the Learning Path detail. The header identifies the day, source path, week, level, and day closing time.
- Ten questions are divided into pages of 3/3/3/1. A question may show an audio stimulus or a reading passage, followed by four choices.
- **Tiếp tục** moves to the next page even when questions are unanswered. Question groups can be selected in any order. **Nộp bài** submits saved drafts, including when answers are blank. Submission waits for any pending save; failed saves must be retried before submission. While submission is pending, answer controls and the action button are disabled.
- The navigator uses its existing blue selected state for every chosen answer, including answers on other pages. It does not show a separate saved indicator or lock pages before submission.
- The page calls the backend start API and restores server-saved choices. Selecting an option saves that question through the draft API; choices are shown after the server confirms them, and an error prompts the learner to retry. Answer controls are disabled while a save is pending. The server-provided deadline disables editing when reached; the server remains authoritative for closure.
- Audio passages play their returned URL. Reading questions may have no passage. User ID comes from `VITE_LEARNING_PATH_USER_ID`, as on the list and detail screens.

Questions and saved choices come from the backend. The API does not expose correct answers or explanations during practice.
After a successful submit, the daily result route loads the server-calculated metrics and question review from the result API. An unsuccessful or uncertain submission keeps the learner on the practice screen with an error and guidance to check the path if it has closed.
Submitting with unanswered questions produces a terminal `SUBMITTED` day; submitting all answers produces `COMPLETED`.
