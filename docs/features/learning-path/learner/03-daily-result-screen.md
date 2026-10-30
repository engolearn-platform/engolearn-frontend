# Daily Learning Path result

Route: `/learning-paths/:pathId/weeks/:weekNo/days/:dayNo/result`

Design reference: Figma node `530:570`.

The screen loads the closed day's result from `GET /api/learning-paths/{pathId}/weeks/{weekNo}/days/{dayNo}/result`, using `VITE_LEARNING_PATH_USER_ID`. It supports opening after submission, from a day card, or after a page refresh. Loading and API errors are shown with a retry action; an open day or cancelled path is rejected by the backend.

The screen uses the same 1300px content container and learner shell as daily practice. The result summary spans the content width; review cards and a 300px question navigator appear below in two columns on wide screens.

- The header links back to the corresponding Learning Path and shows the day, source path, week, and level. It has no day-status tag.
- Six metrics show assigned, answered, correct, wrong, Completion Rate, and Practice Score. Unanswered questions are distinct from wrong answers. Practice Score with zero answers displays **Không có dữ liệu**.
- The wrong-count tile uses the result red fill and border, and the correct-count tile uses the result green fill and border. Completion Rate and Practice Score each use their own value for a visual color cue: below 50% red, 50–74% yellow, and 75–100% green. **Không có dữ liệu** stays neutral. These colors do not define a pass/fail result or change either metric.
- Review is read-only, paginated 3/3/3/1. All ten questions show the correct answer and explanation, including unanswered questions.
- Audio questions include the saved transcript when present. User choices and answer keys are mapped from option IDs returned by the API.
- The navigator groups all ten questions by page, marks correct/wrong/unanswered status, and provides **Hoàn thành việc xem lại** back to the Learning Path detail.
- Review options use the Figma result colors: correct `#E8F6EE` with a 2px `#1E8E5A` border, wrong selected `#FDECEC` with a 2px `#D64545` border. Their option letters and answer labels use the matching state color.
- The review navigator shows each question number in a 32px circle with a 14px status badge overlapping its upper-right corner: green `✓`, red `✕`, or gray `–`. Unanswered circles have a dashed gray border.
- Both return links reopen the corresponding unlocked week via the detail page's `week` query parameter.

Question copy and numbers are illustration data. Micro-skill names follow the confirmed catalog in `AGENTS_learning_path.md`.
