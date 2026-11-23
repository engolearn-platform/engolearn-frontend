# Grammar — hỗ trợ học và điều hướng quản trị

## Phạm vi 23/11/2026
Giữ nguyên LearningLayout/ManagementLayout và mọi API. Chỉ thay Grammar FE; không sửa BE hoặc module khác.

## Thiết kế và trình tự
1. Theory: cạnh nút luyện tập có lời nhắc người học được tự kiểm tra và quay lại lý thuyết. Không chặn theo thời gian, scroll hay số accordion đã mở; không gọi đó là đã đọc hiểu. Giữ xác nhận seen hiện tại và luật 3/5.
2. Review bài quản trị: thêm đường Danh sách bài học ở header/footer, luôn trỏ danh sách của đúng chủ đề, giữ disabled khi đang lưu. Bài Draft đã Ready có thông báo xác nhận trạng thái và hướng tiếp theo; không tự chuyển trang làm người dùng mất checklist.
3. Danh sách bài: thêm hành động Kiểm tra dẫn đến review/checklist. Không thêm toggle Ready tại bảng: Ready cần qua checklist; với chủ đề Published nó có thể xuất bản bài ngay. Trường hợp này nút ở review phải ghi Xuất bản bài học và giữ dialog xác nhận.
4. Kiểm tra FE build/lint và luồng thật. Không dùng mock API để khẳng định tích hợp.

## Dữ liệu demo đã thực hiện

Chủ dự án chọn mỗi cấp 1–2 nội dung; đã giữ một chủ đề mỗi cấp (4 tổng cộng), tất cả không có tiến độ hoặc phiên luyện tập trước thao tác. Archive→Restore bằng API có version, giữ ID/nội dung/firstPublishedAt/revisions. Không ghi thẳng status, không xóa dữ liệu, không tạo mẫu mới. Nội dung seed và BE source không thay đổi trong lượt UX này.

| Cấp | Mã chủ đề | Tên | Bài |
| --- | --- | --- | --- |
| A1 | ENG-GRM-T0009 | Câu hỏi có từ để hỏi và liên từ | 3 |
| A2 | ENG-GRM-T0017 | Câu điều kiện loại 0 và loại 1 | 2 |
| B1 | ENG-GRM-T0041 | Đại từ phản thân | 1 |
| B2 | ENG-GRM-T0044 | Mức độ chắc chắn về tương lai | 1 |

DB local hiện39 chủ đề/99 bài Published và4 chủ đề/7 bài chưa xuất bản. Các bài được khôi phục đủ checklist nên ready=true: Topic API/FE hiển thị IN_PROGRESS (Đang hoàn thiện), persisted lifecycle vẫn DRAFT. Đây là nội dung dùng demo kiểm tra/xuất bản; không phải bài chưa biên soạn hoặc bài chưa từng Ready. Không tự hạ Ready bằng cách làm hỏng nội dung. Muốn demo thao tác Đánh dấu Sẵn sàng từ false, dùng một bài mới hoặc bài thực sự chưa đủ checklist trong luồng soạn thảo bình thường.

## Kết quả kiểm tra

- FE build đạt; lint0 errors/72 warnings hiện có. Chỉ thay3 file UI Grammar: GrammarTheoryView, GrammarReview, GrammarLessonCatalog và tài liệu.
- API thật qua localhost:3000: kiểm tra lịch sử trước chọn, Archive→Restore4 chủ đề thành công, xác nhận trạng thái và đối chiếu nội dung/ID từng bài sau thao tác. Không thay progress của người học.
- Chưa xác nhận trực quan bằng browser: công cụ Computer Use dừng vì không xác định URL của cửa sổ Chrome đủ tin cậy. Không gọi đây là kiểm thử hình ảnh hoặc kiểm tra click end-to-end đã đạt.
- Không commit/push/merge vào main/dev; giữ nhánh hiện tại. Không sửa Placement, User, BE code hoặc layout dùng chung.
