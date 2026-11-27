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
- Trên bản Item đã phát hành, mỗi tài nguyên có “Sửa nhỏ (MINOR)”. Mục này mở lại editor tài nguyên theo cùng Topic/Item ID ở chế độ `?mode=minor`; chỉ “Áp dụng MINOR” gửi PATCH và thay đổi nội dung đã phát hành. Bản gốc vẫn hiện cho tới khi Backend trả thành công.
- Với Topic đã phát hành, “Sửa lớn (MAJOR)” là thao tác chính từ bản đã phát hành. Lệnh mở hoặc dùng lại bản làm việc bằng revision Topic hiện tại và đúng ItemVersion đang phát hành; chỉ sau khi API xác nhận mới chuyển sang editor. Bản xem có thể chuyển riêng giữa working selection và `?view=published`, nên bản đã phát hành tiếp tục xem được khi MAJOR đang chờ.
- Ở điểm bắt đầu và trong editor, giao diện giải thích MAJOR lưu vào bản làm việc; người học tiếp tục thấy bản đang phát hành cho tới khi một đợt Topic được xuất bản. MINOR là hành động phụ riêng cho Item đã phát hành đủ điều kiện. Version hiển thị theo số/trạng thái; ID và timestamp nằm trong phần tùy chọn “Thông tin kỹ thuật”.
- Bản làm việc MAJOR dùng lại các editor và lưu từng phần hiện có. Danh sách cho biết MAJOR hoặc bài mới đang chờ kiểm tra; thao tác “Kiểm tra và xuất bản” xác nhận một lần cho toàn Topic. Item ẩn không tính vào phần tóm tắt đợt phát hành. Draft không đổi có thể không tạo thay đổi hiệu lực; phản hồi `NO_EFFECTIVE_CHANGES` được báo riêng và giữ bản làm việc để sửa tiếp.
- Kết quả đợt phát hành lấy danh sách thay đổi đã commit từ API rồi tải lại Topic và Items; mỗi MAJOR/bài mới hiển thị version đã commit, không tạo đường phát hành riêng cho từng Item.
- Với Topic đã phát hành, cửa sổ xác nhận gọi rõ đây là đợt cập nhật, liệt kê các Item MAJOR/bài mới đang chờ và số Item phát hành được tái sử dụng nếu không đổi; bản nháp không đổi không được mô tả chắc chắn là một thay đổi hiệu lực. Nếu phản hồi lệnh không rõ, UI so sánh release pointer đã đọc lại với pointer trước khi gửi; cùng pointer yêu cầu tải lại và không báo thành công, pointer mới báo có release mới nhưng không quy kết cho yêu cầu hiện tại.
- MINOR ghép yêu cầu từ bản wire đã tải, chỉ thay các trường văn bản/audio/giải thích được phép và giữ các trường không có trong control. Không đổi số lượng, thứ tự, danh tính, lựa chọn hoặc đáp án. Thay đổi ngoài phạm vi được giữ trên form và báo cần MAJOR; chưa có form MAJOR trong đợt này.
- Trường MINOR trên editor hiện có: Context cho nghĩa tiếng Việt/audio từng lượt thoại; Vocabulary cho cách viết có định danh từ/nghĩa ổn định, nghĩa tiếng Việt, phiên âm, audio và nghĩa/audio ví dụ; Expressions cho tên mục đích tiếng Việt, bản dịch, ghi chú cách dùng và audio; Quiz cho audio và giải thích chung. Câu hỏi/đáp án, giải thích đúng/sai legacy, thứ tự và các thao tác cấu trúc bị ẩn hoặc khóa.
- HTTP 409 giữ nội dung đang sửa và cho tải lại bản đã phát hành. Khi tải lại, người dùng xác nhận bỏ các thay đổi cục bộ trước.
- Xóa và ẩn yêu cầu xác nhận. Lý do từ Backend cho biết khi nào cần ẩn thay vì xóa.
- Lệnh thành công thay thế danh sách và revision bằng snapshot Backend. HTTP 409 cho phép tải lại trước khi gửi thay đổi mới.

## 4. Kiểm chứng

Xem [báo cáo kiểm chứng](./authoring-verification.md) để biết phạm vi đã chạy qua trình duyệt và MongoDB.
