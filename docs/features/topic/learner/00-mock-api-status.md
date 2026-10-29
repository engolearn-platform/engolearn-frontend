> Cập nhật live: catalog/mine/detail và Context/Vocab/Expressions đã chạy với BE8080 + hồ sơ DB local thật. Route legacy đã redirect; bằng chứng hiện tại ở09-live-integration.md, bảng lịch sử phía dưới không chứng minh quiz/retry đã tích hợp.

> Live integration: user cấm dùng mock/fixture. Launcher và fixture server đã gỡ. Các bằng chứng fixture bên dưới là lịch sử, không phải trạng thái tích hợp hiện tại. Xem [09-live-integration.md](09-live-integration.md).

> 2026-10-28: [consumer quiz lát A](11-quiz-slice-a.md) gọi GET quiz/POST answer thật, có request recovery và feedback; GET quiz trên môi trường hiện tại trả404 nên chưa xác minh chấm/feedback với BE. Không có fallback mock.

# Learner — trạng thái nguồn dữ liệu

Current source update (2026-10-29): attempt navigation calls real `GET quiz-navigation`; solved questions are selectable read-only and future details remain hidden. Lesson/review share navigation and sequential controls. Topic reset calls real `POST /topics/{id}/reset` with observed generation and confirmed clearing of active retry/results; new TOPIC retry/restart/replacement launchers were removed. All data stays server-owned. Current live acceptance awaits matching service revisions; historical fixture/API rows below are retained as checkpoint evidence only.

Slice C consumer: review reads getItemReview with no answer mutations; retry uses real start/session endpoints and frozen next-item IDs. Implemented with focused parent live state acceptance recorded; hide/unhide during sessions is excluded. See [14-review-retry-slice-c.md](14-review-retry-slice-c.md).

Ngày2026-10-27, sau chặng3 FE. “Client thật” nghĩa là code gọi endpoint thật; không đồng nghĩa BE target đã chạy thành công.
Không fallback mock trong ứng dụng mặc định. Lệnh/launcher fixture lịch sử đã gỡ; không dùng để kiểm chứng các lát hiện tại.

| Màn | Nội dung | Tiến độ/quyền | Trạng thái kiểm chứng |
| --- | --- | --- | --- |
| Khám phá | GET /topics qua client | Viewer + startAvailability từ BE | Browser fixture; BE chưa kết nối |
| Chủ đề của tôi | GET /topics/mine, counts cả hai tab | Trạng thái và thứ tự server | Browser fixture; guest không gọi mine |
| Chi tiết | GET /topics/{id}, không preview từ/mẫu câu | GET progress riêng; actions từ detail | Browser fixture; lỗi progress không giả0% |
| Attempt học mới | GET attempt + content đúng version | POST advance với revision/source; POST access riêng | FE đã triển khai; chưa xác minh BE/browser |
| Review entry | GET review | POST access, không advance | Vẫn receipt, đầy đủ ở chặng5 |
| Context legacy | Mock useTopicContext | Provider mock | Chỉ route cũ; entry mới dùng TopicLessonContent |
| Vocab legacy | Mock useTopicVocab; audio giả lập | Provider mock | Chỉ route cũ; entry mới audio URL thật |
| Expressions legacy | Mock useTopicExpressions; audio giả lập | Provider mock | Chỉ route cũ; entry mới theo purpose từ API |
| Quiz legacy | Placeholder | Provider mock | Thiết kế mới đã duyệt; chặng4 |
| Quiz attempt (lát A) | GET current quiz + POST answers | revision/progress/feedback từ BE, pending journal theo viewer | Consumer đã triển khai; BE GET quiz thật404, chưa nghiệm thu grading |
| Result/review/retry UI đầy đủ | Chưa triển khai | Contract/client đã có | Chặng4–5 |
| Result/completion (Slice B) | Real item/topic result GET + explicit completion recovery POST | Server fractions/percent/actions; no local score or mock completion | Consumer implemented; live acceptance recorded in 12-completion-slice-b.md / parent report; review/retry C remains open |

Nguồn chuẩn: [API foundation](06-api-foundation.md), [catalog](07-topic-catalog.md), [bàn giao BE](../../../handout/topic-learning/backend-handoff.md).
Các ghi chú “đã verify Playwright” trong tài liệu legacy không phải bằng chứng kiểm thử của repo. Chặng2 dùng browser tooling để kiểm tra fixture thủ công; không thêm Playwright dependency/config.
