# Lát A — quiz consumer FE

Slice B now replaces the temporary completion placeholder and adds explicit recovery plus result routing. See [12-completion-slice-b.md](12-completion-slice-b.md); the A behavior and coordination notes below describe the earlier checkpoint.

Ngày 2026-10-28. FE đã triển khai; integration quiz chưa nghiệm thu. Không đổi BE, seed/reset dữ liệu hoặc thêm mock/fixture. Lát B (result) và C (review/retry) chưa thuộc thay đổi này.

## Coordination update

The endpoint404 evidence below describes the initial FE handoff, not the latest runtime. BE quiz routes are now available, and the user reports both types playable. A later read through FE3000 found attempt `698a351bd05b76d98012c535` at revision18/SITUATIONAL_CHOICE2, `GET quiz` 200 with quiz:null and status IN_PROGRESS; GET result still404. This is the documented BE Slice A completion gap. FE currently treats the final unchanged frontier as CONTRACT_MISMATCH and retains the pending request; B must replace the misleading endless retry message and recover the stored final submission without resetting progress or writing on GET. Formal remaining A acceptance and B end-to-end acceptance are open. BE coordination tasks/handoff now reference FE `82d2201` and `b841354`; next work uses BE branch `feat/complete-topic-learning-flow`.

## Route, component và state

Giữ `/topics/:topicId/attempts/:attemptId`, query stage/index chỉ điều khiển vị trí đang xem. `TopicLessonView` dùng `useTopicLesson` và `useTopicQuiz`; `TopicQuiz` là presentational component trong `components/learning/attempt`. Tái sử dụng Button, TopicState, LessonImage/LessonAudio, header progress và dropdown nav. Mẫu câu vẫn flatten purposes trực tiếp, toàn bộ examples của một purpose cùng màn.

- Tại quiz frontier gọi `getCurrentQuiz`; có loading/error/thử lại riêng. Không fallback khi 404/501/network hoặc dữ liệu sai shape.
- FILL_BLANK có một blank và word bank 4–6 options; SITUATIONAL_CHOICE có câu dẫn tiếng Việt và bốn lựa chọn tiếng Anh. Chọn là gửi `{revision,optionId}`; không nút Submit, không tự chấm.
- Khoá lựa chọn/nav khi đang gửi hoặc chưa rõ kết quả. Sai được BE xác nhận: chỉ báo chưa đúng, cho chọn lại; không đáp án, giải thích, first-try hay bộ đếm sai.
- Đúng: giữ quiz vừa trả lời và feedback; header nhận progress mới từ BE. Tiếp tục mới bỏ feedback và đọc frontier mới. Audio tuỳ chọn, không autoplay, không chặn Tiếp tục.
- Nav/URL chỉ mở quiz đúng current frontier trong running mode. Nội dung cũ vẫn xem được mà không ghi advance. Feedback không lưu qua reload.
- Journal giữ key theo learner/attempt/quiz/body và lưu thêm exact pending request (quiz snapshot + revision/optionId) trong sessionStorage. Reload khi response chưa rõ chỉ cho người học replay request cũ; không chọn option khác, không tự retry với key mới. Sai được xác nhận mới giải phóng request để chọn lại với revision mới.
- 409 loại state tạm, refetch, chờ hành động mới của người học. Response identity/version/revision/frontier sai bị báo contract mismatch, không dựng kết quả.
- `410 ITEM_HIDDEN` đúng code/status dừng audio, bỏ pending/feedback/selection bằng unmount, thông báo ở detail và đọc lại quyền/progress khi detail mount. Mine đọc lại khi mở. Foreign404 chỉ hiện lỗi, không điều hướng như hidden. Không polling.
- Completed attempt không gọi GET content (chỉ dành cho IN_PROGRESS). Hiện xác nhận hoàn thành từ BE và đường về topic; result route/UI sẽ làm ở B. Không gửi advance sau quiz. `IN_PROGRESS + quiz:null` báo BE chưa hoàn tất completion, không tự coi là thành công.
- Scope state được remount khi learner/attempt đổi. Button có keyboard/focus/aria-pressed, pending và feedback có status; layout dùng tokens/Hanken Grotesk và kế thừa một cột mobile/hai cột desktop.

## Contract

Commit `82d2201` thêm Problem410 cho GET quiz và POST answers, trước consumer code. Generated schemas không đổi; đã chạy generator và type drift check. Không thêm retry recovery fields vì hoãn sang C; không đổi completion contract để thích nghi trạng thái tạm của Slice A BE.

## Kiểm chứng và giới hạn

- Build và lint chạy cho consumer; xem kết quả cuối trong 09-live-integration.md. Type drift PASS (51 schemas).
- API thật qua FE3000 → BE8080: viewer LEARNER từ hồ sơ local, đọc attempt/content và kiểm tra identity/version/frontier PASS. Không injected fetch.
- Attempt `698a351bd05b76d98012c535`, topic `6a7200000000000000000001`, revision6, FILL_BLANK/0, 50%. Helper nav kiểm tra trực tiếp snapshot thật: cho xem Context/current quiz; chặn FILL_BLANK/1 và SITUATIONAL_CHOICE/0; URL tương lai trả về frontier.
- Browser thật: hiện lỗi GET quiz; xem lại Context → quay vị trí đang học giữ 50%. Đọc lại BE vẫn revision6/FILL_BLANK/0; chỉ recency thay đổi qua access event.
- Blocker: GET quiz của attempt trên trả404, thông báo BE `No static resource .../quiz`. Chưa thể nghiệm thu hai loại câu, sai→reload→đúng, replay/stale answer, mất response và hidden thật. Không gọi POST answer thiếu endpoint hoặc thay DB để dựng bằng chứng.
- Không chạy historical mocked suites (`test:topic`, `test:topic-api`) theo yêu cầu không dùng mock/fixture. Không có bằng chứng live cho giao diện options/feedback/audio khi chưa có quiz endpoint.
