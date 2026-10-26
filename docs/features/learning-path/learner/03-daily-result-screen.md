# Daily Learning Path result

Route: `/learning-paths/:pathId/weeks/:weekNo/days/:dayNo/result`

Design reference: Figma node `530:570`.

The screen uses the same 1300px content container and learner shell as daily practice. The result summary spans the content width; review cards and a 300px question navigator appear below in two columns on wide screens.

- The header links back to the corresponding Learning Path and shows the day, source path, week, and level. It has no day-status tag.
- Six metrics show assigned, answered, correct, wrong, Completion Rate, and Practice Score. Unanswered questions are distinct from wrong answers. Practice Score with zero answers displays **Không có dữ liệu**.
- The wrong-count tile uses the result red fill and border, and the correct-count tile uses the result green fill and border. Completion Rate and Practice Score each use their own value for a visual color cue: below 50% red, 50–74% yellow, and 75–100% green. **Không có dữ liệu** stays neutral. These colors do not define a pass/fail result or change either metric.
- Review is read-only, paginated 3/3/3/1. All ten questions show the correct answer and explanation, including unanswered questions.
- The navigator groups all ten questions by page, marks correct/wrong/unanswered status, and provides **Hoàn thành việc xem lại** back to the Learning Path detail.
- Review options use the Figma result colors: correct `#E8F6EE` with a 2px `#1E8E5A` border, wrong selected `#FDECEC` with a 2px `#D64545` border. Their option letters and answer labels use the matching state color.
- The review navigator shows each question number in a 32px circle with a 14px status badge overlapping its upper-right corner: green `✓`, red `✕`, or gray `–`. Unanswered circles have a dashed gray border.
- Direct entry uses local sample results unless this browser has a submitted practice record for the day. After submission or local midnight closure, the selected answers produce the daily metrics and review status; unanswered questions remain distinct from wrong answers. The submitted record survives a refresh in the same browser. No backend request is performed.

Question copy and numbers are illustration data. Micro-skill names follow the confirmed catalog in `AGENTS_learning_path.md`.
