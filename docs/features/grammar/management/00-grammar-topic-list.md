# Quản lý ngữ pháp — Màn 01–10

Đối chiếu phần nội dung với 10 PNG và HTML trong `EngoLearn_Admin_UI_v2.zip`. Vỏ ứng dụng dùng `ManagementLayout`, sidebar và topbar hiện có của nhóm. Hanken Grotesk và các token màu lấy từ hệ thiết kế của repo. Quy tắc nghiệp vụ theo GRM-UC-005 đến GRM-UC-013.

## Điều hướng

| Màn | Route | View |
| --- | --- | --- |
| 01. Chủ đề ngữ pháp | `/admin/grammar` | `GrammarTopicListView` |
| 02. Thông tin chủ đề | `/admin/grammar/new`, `/admin/grammar/:topicId` | `GrammarTopicFormView` |
| 03. Danh sách bài học | `/admin/grammar/:topicId/lessons` | `GrammarLessonListView` |
| 04. Thông tin bài học | `/admin/grammar/:topicId/lessons/new`, `/admin/grammar/:topicId/lessons/:lessonId` | `GrammarLessonFormView` |
| 05. Nội dung bài học | `/admin/grammar/:topicId/lessons/:lessonId/blocks` | `GrammarBlocksView` |
| 06. Câu luyện tập | `/admin/grammar/:topicId/lessons/:lessonId/questions` | `GrammarQuestionsView` |
| 07–08. Soạn trắc nghiệm và điền chỗ trống | `/admin/grammar/:topicId/lessons/:lessonId/questions/:questionId` | `GrammarQuestionFormView` |
| 09. Kiểm tra bài học | `/admin/grammar/:topicId/lessons/:lessonId/review` | `GrammarLessonReviewView` |
| 10. Kiểm tra và xuất bản | `/admin/grammar/:topicId/publish` | `GrammarTopicPublishView` |

Màn 01–04 được xuất qua `views/management/GrammarTopicViews.tsx`, màn 05–10 qua `views/management/GrammarAuthoringViews.tsx`. Stepper chủ đề dẫn sang danh sách bài học và bước kiểm tra xuất bản. Khi có mã bài học, stepper bài học dẫn sang Nội dung, Luyện tập và Kiểm tra & hoàn thiện.

## Đối chiếu thiết kế

- Màn 01 dùng một bảng trắng, tên và mã cùng ô, vị trí lộ trình cùng dòng thông tin phụ. Giữ đủ năm bộ lọc trạng thái theo GRM-UC-005.
- Màn 02 và 04 dùng một hàng tên song ngữ ở desktop, gộp thông tin mã và thứ tự vào dải tóm tắt, checklist ở cột phải. Vị trí chủ đề có thao tác chỉnh riêng ngay dưới dải tóm tắt.
- Màn 03 đặt tóm tắt chủ đề trên stepper và dùng một dòng phụ cho tên tiếng Anh và mục tiêu bài học. Số và loại khối vẫn hiển thị theo GRM-UC-008.
- Màn 05 và 06 dùng danh sách thẻ viền mảnh, thanh thao tác cùng vị trí với thiết kế và nút sửa cạnh menu. Ô câu chưa đủ dùng nhãn và hành động soạn theo số câu. Có đường dẫn xem trước trong trình biên soạn theo GRM-UC-011.
- Màn 07 và 08 luôn có cột xem trước và checklist. Nút chọn đáp án trắc nghiệm nằm bên trái. Đáp án chính và biến thể điền chỗ trống nằm chung một nhóm nhập dạng thẻ.
- Màn 09 dùng các hàng kiểm tra gọn, mở chi tiết theo nhóm khi cần. Màn 10 hiển thị một tiến độ xuất bản, checklist bên phải và lý do nút bị khóa cạnh nút xuất bản. Tổng và chi tiết checklist lấy từ BE.
- Các màn biên soạn dùng chung thanh cuối trang với ba vùng quay lại, trạng thái lưu và tiếp tục. Khi màn hình hẹp, hai cột xếp dọc và bảng cuộn ngang.

## Dữ liệu và thao tác

- `grammarManagement` gọi `/api/v1/grammar/admin/topics`. Máy chủ xử lý tìm theo tên Việt, tên Anh hoặc mã, lọc theo CEFR và trạng thái, phân trang, đếm thống kê và trả tiến độ mỗi chủ đề. Xuất CSV lấy toàn bộ kết quả khớp bộ lọc hiện tại.
- Biểu mẫu chủ đề lưu tên Việt, tên Anh, trình độ, mô tả và vị trí lộ trình. Tên giới hạn 120 ký tự mỗi trường. Mô tả nháp từ 1 đến 250 ký tự, giới hạn tối thiểu là 80 ký tự ở chủ đề đã xuất bản và trong bước kiểm tra xuất bản. Trình độ được khóa sau lần xuất bản đầu tiên. Mã chủ đề chỉ đọc và có nút sao chép.
- Danh sách bài học dùng dữ liệu từ chi tiết chủ đề, hiển thị thứ tự, tên song ngữ, mục tiêu, số và loại khối, số câu luyện tập và tình trạng bài học. Đổi thứ tự bằng kéo thả, phím mũi tên trên tay nắm hoặc lệnh Di chuyển lên và Di chuyển xuống. Giao diện làm mới danh sách sau khi máy chủ xác nhận. Chủ đề có thể có tối đa 10 bài đang hoạt động.
- Biểu mẫu bài học lưu tên song ngữ (tối đa 150 ký tự mỗi trường), mục tiêu (tối đa 300 ký tự) và thẻ. Khi thêm bài, có thể chọn vị trí hoặc để hệ thống đặt ở cuối. Mã bài chỉ đọc. Bài đã xuất bản có thay đổi đang soạn hiển thị nhãn “Có thay đổi chưa xuất bản”.
- Xóa, ngừng xuất bản và khôi phục có hộp xác nhận. Chủ đề chưa từng xuất bản có thể xóa. Chủ đề đang xuất bản có thể ngừng xuất bản, chủ đề lưu trữ có thể khôi phục về nháp. Bài học từng xuất bản được lưu trữ. Muốn lưu trữ bài đã xuất bản cuối cùng, trước tiên phải ngừng xuất bản chủ đề. Chủ đề hoặc bài học lưu trữ hiển thị ở chế độ chỉ xem.
- Bản ghi mới lưu khi chọn Tiếp tục. Bản ghi hiện có tự lưu sau 750 ms khi dữ liệu hợp lệ và có thay đổi. Khi chuyển bước trong biểu mẫu, giao diện đợi máy chủ xác nhận các thay đổi. Mỗi lần ghi sử dụng phiên bản trả về từ máy chủ. Xung đột phiên bản hiển thị yêu cầu tải lại.

## Trạng thái giao diện

- Bảng hỗ trợ cuộn ngang bằng bàn phím. Form xếp thành một cột khi màn hình hẹp và hai cột rộng khi đủ chỗ cho bảng kiểm.
- Có trạng thái tải, rỗng, lỗi và phản hồi thao tác. Trường bắt buộc có kiểm tra đầu vào. Lỗi tại trường từ máy chủ được đặt cạnh trường liên quan. Trạng thái tự lưu có thông báo cho trình đọc màn hình.

## Hỗ trợ học và điều hướng

Lời nhắc nhẹ cạnh nút luyện tập; review có đường về danh sách bài, bảng có nút Kiểm tra. Không thêm Ready toggle hoặc chặn theo thao tác đọc. Xem [thiết kế điều hướng](../07-learning-management-navigation.md).
