# Daily Learning Path practice

Route: `/learning-paths/:pathId/weeks/:weekNo/days/:dayNo/practice`

Design references: Figma nodes `525:2` (page 2/4) and `525:325` (page 4/4).

The screen uses `LearningLayout` and a content container up to 1300px, matching the Learning Path list and detail screens. On wide screens, question cards occupy the main column and the question navigator sits in a 300px column. On narrow screens, the navigator follows the question cards.

- A back link returns to the Learning Path detail. The header identifies the day, source path, week, level, and day closing time.
- Ten questions are divided into pages of 3/3/3/1. A question may show an audio stimulus or a reading passage, followed by four choices.
- **Tiếp tục** moves to the next page even when questions on the current page are unanswered. The existing question groups in the navigator can be selected in any order. Chosen answers remain editable until **Nộp bài** on page 4 or the day closes at 00:00 GMT+7. Submitting with unanswered questions is allowed; they remain unanswered in the result.
- The navigator uses its existing blue selected state for every chosen answer, including answers on other pages. It does not show a separate saved indicator or lock pages before submission.
- This is still a UI-only preview. Choices and the current page are stored in this browser's `localStorage`, scoped by user, path, week, and day, so leaving and returning on the same browser resumes the draft. Submission is stored locally so the result survives refresh and practice cannot reopen. A timer closes the local practice at 00:00 GMT+7 while the page is open; an expired draft closes when it is reopened. There is no backend request, cross-device sync, or server-enforced deadline yet.
- Query `page=2` opens the partially selected middle-page example; `page=4` opens the final-page example when no local record exists. Audio controls are visual samples without an audio source.

Displayed dates, question text, answers, and scores are sample data. Micro-skill names follow the confirmed catalog in `AGENTS_learning_path.md` rather than older Figma labels.
