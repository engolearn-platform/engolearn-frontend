# Topic — Bước 2: Danh sách Topic Items (Overview)

> Tài liệu workflow cho màn overview các Topic Item trong luồng tạo topic
> (Stitch: "Admin — 2. Danh sách Topic Items (Overview)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, editor từng item, step 3).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/a38c484e70054522ac0e4a14ae60fa2e`
  ("Admin — 2. Danh sách Topic Items (Overview)", DESKTOP).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).

## 2. Route

- Sau khi POST Topic, wizard mở `/admin/topics/:topicId/edit/items`.
- URL cũ `/admin/topics/create/items` chuyển về form thông tin cơ bản để tạo Topic trước.
- “Nội dung” mở editor của Item nháp hoặc bản đọc khi Item thuộc phiên bản đã phát hành hay đang ẩn. [Các editor tài nguyên](./README.md) mô tả phần soạn thảo theo hai mức draft và publish.

## 3. Màn hình và thao tác

- `TopicUpsertItemsView` đọc chi tiết Topic và danh sách Item qua `topicManagementService`. Component được tạo lại khi Topic ID đổi.
- Giữ `TopicItemsHeader`, `TopicItemsList` và `TopicItemCard`. Dialog dùng lại primitive của hệ thống UI.
- “Thêm Topic Item mới” cần title. “Sửa thông tin” trên một Item nháp cho sửa title, mô tả và thời lượng. Dialog giữ dữ liệu khi API trả lỗi.
- Nút lên/xuống gửi trật tự toàn bộ danh sách khi Topic còn ở draft. Topic đã phát hành cho append bài học.
- Xóa và ẩn yêu cầu xác nhận. Lý do từ Backend cho biết khi nào cần ẩn thay vì xóa.
- Lệnh thành công thay thế danh sách và revision bằng snapshot Backend. HTTP 409 cho phép tải lại trước khi gửi thay đổi mới.

## 4. Kiểm chứng

Xem [báo cáo kiểm chứng](./authoring-verification.md) để biết phạm vi đã chạy qua trình duyệt và MongoDB.
