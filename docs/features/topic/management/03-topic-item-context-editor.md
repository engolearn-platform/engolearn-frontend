# Topic — Bước 2: Biên soạn Bối cảnh (Context Editor)

> Tài liệu workflow cho màn editor Bối cảnh của 1 Topic Item trong luồng tạo topic
> (Stitch: "Admin — 3. Biên soạn Bối cảnh (Context Editor)").
> Dùng làm cơ sở khi update / refactor / gắn dữ liệu thật (API, 3 editor còn lại, step 3).

## 1. Nguồn thiết kế (Stitch)

- Project: `EngoLearn English Learning App` (`projects/1238993878075911224`).
- Screen: `projects/1238993878075911224/screens/b0aa0da2ae6c41f884e9e4e4dd663e9c`
  ("Admin — 3. Biên soạn Bối cảnh (Context Editor)", DESKTOP).
- Design tokens: `EngoLearn Narrative` — primary `#006565`, Hanken Grotesk,
  `docs/design-system/*` (tokens, principles, components, patterns).
- HTML Stitch dở dang đã verify: `Image Upload Area` rỗng, label `Audio` rỗng,
  toàn bộ Live Preview card rỗng (JS sync tới `#preview-title/#prompt/#desc`
  nhưng DOM không tồn tại) → cả 3 bị cắt khỏi scope, xem §6.

## 2. Route

Item nháp mở `/admin/topics/:topicId/edit/items/:itemId/context` qua nút “Nội dung” trên danh sách bài học. Item đã phát hành hoặc đang ẩn mở bằng route chỉ đọc. `TopicItemEditorView` tải Topic và Item theo đúng ID, xử lý lỗi và giữ shell cùng thanh tab.

## 3. Form và lưu nháp

- `TopicContextFormCard` nhận `TopicContextResource | null`. Các trường sửa được gồm câu hỏi gợi mở, mô tả tình huống, thời lượng giây, mẹo và hội thoại mẫu.
- `ContextDialogueTurnRow` cho chỉnh người nói, EN, VI và tham chiếu audio. Nút lên/xuống chỉnh thứ tự, xóa yêu cầu xác nhận. React key dùng cục bộ cho form.
- Xóa toàn bộ bối cảnh chuẩn bị giá trị `null`. “Lưu nháp” ghi thay đổi xuống MongoDB tại chỗ; “Tiếp tục” cũng lưu Context trước khi mở Từ vựng.
- Footer cố định dùng `TopicUpsertFooterBar`. “Quay lại” về danh sách Item. Tab section vẫn giữ xác nhận khi rời nội dung chưa lưu. Footer có “Hồ sơ Speaking”, không còn “Xem bản đã lưu”.
- Service gửi PUT context với revision của Topic. Response cung cấp bản đã lưu và revision để chỉnh tiếp. Các section khác giữ dữ liệu đang lưu.
- Nháp cho lưu nội dung đang làm dở. Khi chuyển tab hoặc quay về danh sách từ form có thay đổi, trình duyệt yêu cầu xác nhận. Nếu revision cũ, form giữ dữ liệu và hiển thị “Tải lại bản nháp”.

## 4. Media và kiểm chứng

Form nhận đường dẫn hoặc file MP3/WAV tối đa 5 MB cho từng lượt thoại. MediaManagement kiểm tra file trước khi tải lên. Bấm Lưu nháp để gắn tham chiếu vào Item. Lỗi upload không chặn lưu các trường còn lại. Xem [kiểm chứng](./authoring-verification.md) để biết các trường hợp đã chạy.
