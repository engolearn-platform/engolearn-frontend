> Cập nhật live: catalog/mine/detail và Context/Vocab/Expressions đã chạy với BE8080 + hồ sơ DB local thật. Route legacy đã redirect; bằng chứng hiện tại ở09-live-integration.md, bảng lịch sử phía dưới không chứng minh quiz/retry đã tích hợp.

> Live integration: user cấm dùng mock/fixture. Launcher và fixture server đã gỡ. Các bằng chứng fixture bên dưới là lịch sử, không phải trạng thái tích hợp hiện tại. Xem [09-live-integration.md](09-live-integration.md).

> 2026-10-28: [consumer quiz lát A](11-quiz-slice-a.md) gọi GET quiz/POST answer thật, có request recovery và feedback; GET quiz trên môi trường hiện tại trả404 nên chưa xác minh chấm/feedback với BE. Không có fallback mock.

# Learner — trạng thái nguồn dữ liệu

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

Nguồn chuẩn: [API foundation](06-api-foundation.md), [catalog](07-topic-catalog.md), [bàn giao BE](../../../handout/topic-learning/backend-handoff.md).
Các ghi chú “đã verify Playwright” trong tài liệu legacy không phải bằng chứng kiểm thử của repo. Chặng2 dùng browser tooling để kiểm tra fixture thủ công; không thêm Playwright dependency/config.
