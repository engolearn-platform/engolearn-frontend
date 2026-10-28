# Kế hoạch FE — hoàn tất Topic Learning thật

Status: planning only (2026-10-27). Baseline FE `a5d0b4a`, BE `4b36f15`; nghiệp vụ cập nhật ở business commit `aaff29c`. Không coi các task dưới đây là code đã triển khai.

Cập nhật 2026-10-28: consumer FE lát A đã triển khai theo [bàn giao lát A](11-quiz-slice-a.md), chưa nghiệm thu end-to-end vì GET quiz thật còn 404. Chỉ đồng bộ delta 410 cho hai endpoint quiz; retry recovery hoãn sang C theo phạm vi người dùng chốt. B/C chưa triển khai. Completion giữ contract gốc; không chấp nhận `IN_PROGRESS + quiz:null` là hoàn thành.

## Đọc trước khi làm

Nguồn hành vi: business repo `docs/usecase_spec/topic-learning/00-module.md`, F02/F03/F04, và `docs/technical/topic-learning/learner-runtime-mapping.md`. Bộ BE ở sibling `engolearn-backend/openspec/changes/complete-topic-learning-flow/`: proposal, specs, design, tasks, handoff. Artifact dữ liệu riêng: BE `docs/topic/sample-data-plan.md`.

API machine-readable hiện tại: [api.openapi.yaml](../../../handout/topic-learning/api.openapi.yaml). Nó là API mục tiêu; quiz/result/retry vẫn chưa được xác minh triển khai tại baseline. [Báo cáo live](09-live-integration.md) ghi phần thực sự chạy được. Không dùng các tài liệu mock-stage cũ để chứng minh nối BE.

## Chỗ giữ lại và chỗ sửa

| File/component hiện có | Trách nhiệm tiếp theo |
|---|---|
| TopicAttemptEntryView.tsx | Phân mode learn/retry/review/result, bỏ màn receipt tạm khi có view thật |
| TopicLessonView.tsx, useTopicLesson.ts | Giữ shell/reads/abort; thêm current quiz, transient feedback và trạng thái gửi đáp án |
| TopicLessonNav.tsx | Dropdown các part; Mẫu câu liệt kê purposes trực tiếp, không group nesting; running quiz chỉ current frontier |
| TopicLessonContent.tsx | Tái sử dụng content renderer cho học và review; purpose là một màn, các examples hiển thị cùng nhau |
| utils/topic-lesson.ts | Giữ order/index purpose hiện có; sửa canViewPosition để URL không mở lại quiz đã đúng trong lượt đang chạy |
| topic-api.service.ts/client/types | Dùng endpoint thật và DTO generated; không injected fetch/fixture server hoặc fallback mock |
| topic-mutation-journal.ts | Cùng key cho request chưa rõ kết quả, key mới sau đáp án sai được BE xác nhận; không auto retry với key mới |
| TopicDetailView, MyTopicsView, useTopicLaunch | Refetch quyền/kết quả sau completion/retry/hide; xác nhận đúng active retrySessionId |

Các file trên nằm trong `src/features/topic/` ở các thư mục hiện hữu views/learning, hooks, components/learning/attempt, services, utils, types. Tạo quiz/result presentational components cạnh attempt components, hook logic trong feature; không import chéo feature hoặc tạo primitive toàn cục mới. Đọc skill frontend-ui và design-system tokens/principles/components/patterns trước UI code.

## Contract delta cần đồng bộ trước UI

Design BE định nghĩa ITEM_HIDDEN/410 và retry-session effective recovery fields. Cập nhật api.openapi.yaml + generated types cùng commit contract trước consumer code; chạy topic:types:check. Không đổi API theo schema JSON minh hoạ và không duy trì contract cạnh tranh. Existing schemas là cơ sở: QuizAnswerDto gồm quizId/isCorrect/feedback/attempt; ItemResultDto có nextTopicItemId/nextItemAvailability, không giả định có một object nextItem hoặc attempt đầy đủ.

## Lát A — làm quiz và tiếp tục chính xác

1. Tại frontier quiz, gọi getCurrentQuiz. Hiện loading/error riêng, không thay câu hỏi bằng dữ liệu mẫu nếu404/501/network.
2. FILL_BLANK: một blank, chọn một option trong word bank. SITUATIONAL_CHOICE: tình huống tiếng Việt, bốn lựa chọn tiếng Anh. Cả hai gửi `{revision,optionId}` ngay khi chọn; không nút Submit riêng.
3. Khoá lựa chọn khi gửi. BE xác nhận sai: báo chưa đúng, cho chọn lại, không hiện đáp án/giải thích/điểm hay số lần sai. Network chưa rõ: giữ key và hiển thị cách thử lại/reload; không tự tính là sai.
4. BE xác nhận đúng: giữ câu vừa trả lời cùng feedback, header dùng progress mới của BE; không tự chuyển. Bấm Tiếp tục tải frontier mới; audio tuỳ chọn, không autoplay hoặc bắt nghe hết.
5. Reload sau đúng vào câu kế/tổng kết; reload sau sai vẫn câu đó. Xem lại nội dung rồi Quay lại vị trí đang học không đổi frontier. Running mode không mở lại quiz cũ bằng nav hay URL.

Nghiệm thu: một câu thật mỗi loại; sai -> reload -> đúng; một replay/stale revision; kiểm tra Network qua proxy và dữ liệu BE, không chỉ ảnh màn hình.

## Lát B — hoàn thành và tổng kết

Thêm route item result `/topics/:topicId/attempts/:attemptId/result` và topic result `/topics/:topicId/result` trong topic feature. Giữ attempt route hiện hữu cho học/retry; review dùng `?mode=review` trên route attempt, không tạo đường học legacy mới. Kiểm tra router/constants và order tĩnh trước param để route không bị nuốt.

- Câu cuối đúng đã hoàn thành ở BE. Tiếp tục từ feedback mở result; mở lại completed attempt cũng đi result, không gửi advance thêm.
- Tổng kết item: trạng thái hoàn thành, fraction và % từ BE, nút học item kế nếu allowed, về detail, xem lại/làm lại nếu allowed. Không tự dựng next item bằng index+1.
- Tổng kết topic: fraction/% gộp từ BE, danh sách từng item và hành động hợp lệ; không average phần trăm item ở FE.
- Sau completion, invalidation/refetch detail/progress/mine và reference kết quả. Chủ đề rời tab đang học chỉ khi BE xác định mọi item visible hoàn thành.

Nghiệm thu: một item thật tới kết quả, reload vẫn đúng, next item được mở, mất response câu cuối/replay không chấm hai lần. Full topic dùng bộ data thật khi cần, không seed completion giả.

## Lát C — xem lại, làm lại và item bị ẩn

- Review dùng getItemReview, cùng renderer nhưng khoá inputs; cho chọn từng quiz đã xong để đọc đáp án/giải thích/first-try label. Không hiển thị các lần chọn sai. GET review không cập nhật vị trí; access event riêng chỉ ghi recency.
- Retry dùng cùng lesson view với mode/attempt của BE. Xác nhận trước start; khi đang có session dở, giữ ID quan sát để xác nhận thay đúng session, không tự abandon. Huỷ dialog không gọi mutation.
- Topic retry tiếp tục theo frozen session; next item được start bằng hành động rõ ràng và retrySessionId, không tạo attempt qua GET. Kết quả cũ vẫn chính thức tới khi từng item xong lượt mới; điểm thấp hơn vẫn thay điểm cũ.
- ITEM_HIDDEN: dừng audio, xoá feedback/selection đang xem, thông báo nội dung không còn khả dụng rồi về detail, refetch quyền/progress/mine. Không giữ nội dung pinned để tiếp tục khi BE từ chối; không thêm polling/background loop. Foreign404 không được diễn giải thành hidden của người khác.
- RESULT_CHANGED/STATE_CHANGED/RETRY_SESSION_CHANGED: bỏ state tạm không còn hợp lệ, refetch đúng resource, hiển thị hành động mới; không gửi lại đáp án cũ bằng key mới một cách tự động.

Nghiệm thu: review không ghi kết quả; retry dở giữ điểm cũ; xong retry thay bằng điểm mới; một stale-session conflict; admin hide thật dừng request dù đang học. Khi BE chưa có endpoint, báo blocker thay vì tự chuyển mock.

## UI và giới hạn kiểm tra

Thanh tiến độ nằm trên header, nav phần học dạng dropdown và nút Quay lại vị trí đang học; bỏ cấp group trong Mẫu câu. Mobile xếp content/nav có thể thu gọn, không hai card tiến độ cũ. Dùng Button/Dialog/Card hiện có, Hanken Grotesk và design tokens; selection có keyboard/focus/aria và trạng thái pending rõ. Không XP, skip unanswered, fake media hoặc bộ đếm sai.

Trong lượt docs này chỉ kiểm tra link/diff/consistency. Khi triển khai: build + lint + type drift sau thay đổi liên quan, kiểm tra critical từng lát với BE/DB thật. Không chạy historical mocked suites hoặc tạo vòng browser ma trận vô hạn. Ghi checks đã chạy/chưa chạy; chỉ lặp khi có sửa đổi hoặc lỗi mới. Commit riêng từng lát trong repo FE (`feat`/`fix`), docs-only dùng `docs`; không push.
