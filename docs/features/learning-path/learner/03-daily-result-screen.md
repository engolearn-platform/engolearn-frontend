# Daily Learning Path result

Route: `/learning-paths/:pathId/weeks/:weekNo/days/:dayNo/result`

Design reference: Figma node `530:570`.

The screen uses the same 1300px content container and learner shell as daily practice. The result summary spans the content width; review cards and a 300px question navigator appear below in two columns on wide screens.

- The header links back to the corresponding Learning Path and shows the day, source path, week, level, and day status.
- Six metrics show assigned, answered, correct, wrong, Completion Rate, and Practice Score. Unanswered questions are distinct from wrong answers. Practice Score with zero answers displays **Không có dữ liệu**.
- Review is read-only, paginated 3/3/3/1. All ten questions show the correct answer and explanation, including unanswered questions.
- The navigator groups all ten questions by page, marks correct/wrong/unanswered status, and provides **Hoàn thành việc xem lại** back to the Learning Path detail.
- Direct entry uses local sample results. After submitting the UI-only practice flow, answers passed through route state produce the displayed daily metrics and review status. No backend request is performed.

Question copy and numbers are illustration data. Micro-skill names follow the confirmed catalog in `AGENTS_learning_path.md`.
