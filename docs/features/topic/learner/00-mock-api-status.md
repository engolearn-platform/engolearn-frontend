# Learner — trạng thái nguồn dữ liệu

Ngày2026-10-27, sau chặng2. “Client thật” nghĩa là code gọi endpoint thật; không đồng nghĩa BE target đã chạy thành công.
Không fallback mock trong ứng dụng mặc định. Fixture chỉ chạy bằng lệnh npm run dev:topic-fixtures.

| Màn | Nội dung | Tiến độ/quyền | Trạng thái kiểm chứng |
| --- | --- | --- | --- |
| Khám phá | GET /topics qua client | Viewer + startAvailability từ BE | Browser fixture; BE chưa kết nối |
| Chủ đề của tôi | GET /topics/mine, counts cả hai tab | Trạng thái và thứ tự server | Browser fixture; guest không gọi mine |
| Chi tiết | GET /topics/{id}, không preview từ/mẫu câu | GET progress riêng; actions từ detail | Browser fixture; lỗi progress không giả0% |
| Điểm vào attempt | GET attempt hoặc review theo mode | POST access cập nhật recency, không đổi vị trí | Hiển thị lượt thật; chưa có khung học đầy đủ |
| Context legacy | Mock useTopicContext | Provider mock | Chưa chuyển, chặng3 |
| Vocab legacy | Mock useTopicVocab; audio giả lập | Provider mock | Chưa chuyển, chặng3 |
| Expressions legacy | Mock useTopicExpressions; audio giả lập | Provider mock | Chưa chuyển, chặng3 |
| Quiz legacy | Placeholder | Provider mock | Thiết kế mới đã duyệt; chặng4 |
| Result/review/retry UI đầy đủ | Chưa triển khai | Contract/client đã có | Chặng4–5 |

Nguồn chuẩn: [API foundation](06-api-foundation.md), [catalog](07-topic-catalog.md), [bàn giao BE](../../../handout/topic-learning/backend-handoff.md).
Các ghi chú “đã verify Playwright” trong tài liệu legacy không phải bằng chứng kiểm thử của repo. Chặng2 dùng browser tooling để kiểm tra fixture thủ công; không thêm Playwright dependency/config.
