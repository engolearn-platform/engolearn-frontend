# Chặng 3 — khung học theo attempt

Delta 2026-10-28: cửa vào Practice đã được thay bằng consumer quiz thật theo [lát A](11-quiz-slice-a.md). Running nav/URL chỉ cho current quiz, không xem quiz đã đúng. Các đoạn nói dừng tại Practice dưới đây mô tả checkpoint chặng3; kết quả nối BE mới nhất ở09-live-integration.md.

## Thiết kế và route
Theo thiết kế Từ vựng user cung cấp: header chứa tiến độ BE của lượt học, không còn hai progress card legacy. Sidebar bốn phần có dropdown; chỉ mở nhánh đang xem mặc định, người học có thể đóng/mở. Nút Quay lại vị trí đang học dùng attempt.position.
Route giữ /topics/:topicId/attempts/:attemptId; query stage/index là vị trí đang xem, không phải tiến độ. from giữ đường về chi tiết. Review vẫn là receipt chặng 2, hoàn thiện ở chặng 5.

## Component và state
TopicLessonView dùng useTopicLesson + typed client đã có. TopicLessonNav và TopicLessonContent là component riêng của feature; Button, TopicState, TopicProgressBar, MemoryTipCard được tái sử dụng.
GET attempt + GET content phải khớp topic/item/version. VOCAB sắp theo orderIndex rồi vocabId; EXPRESSIONS flatten theo thứ tự groups, mỗi group sắp purposes theo orderIndex rồi purposeId.
Chỉ vị trí đã học hoặc frontier được mở. F5 giữ query hợp lệ; vị trí tương lai hoặc không tồn tại được đưa về frontier. Xem lại không gửi advance và không kéo tiến độ lùi.
Tiếp tục tại frontier gửi revision + vị trí nguồn với Idempotency-Key được giữ qua lỗi mạng. Chỉ cập nhật sau response thành công; 409 tải lại attempt/content và báo trạng thái thay đổi. Không tự retry mutation.
Bốn phần UI: Context, Vocab, Expressions, Practice (hai quiz stages). Chặng 3 dừng tại cửa vào Practice; không giả completion/quiz/result.

## Nội dung và audio
Context hiển thị scenario, ảnh/câu gợi mở nếu có, hội thoại EN/VI và audio URL thật.
Mỗi từ có nghĩa, IPA, tags, ảnh, collocations, examples theo response. Quick check optional, chấm local; không gửi accuracy hoặc chặn Tiếp tục.
Mỗi purpose là một bước Mẫu câu, hiển thị toàn bộ examples và usageNote; không tự bịa XP hoặc mục tiêu.
Media/tips thiếu thì ẩn, audio không tự phát; lỗi audio không chặn học. Không thêm mock/fallback vào runtime.
Không tự đánh dấu tiến độ bằng scroll, nghe audio hoặc quick check.

## Responsive và kiểm chứng
Header co dòng trên màn nhỏ, nội dung một cột; sidebar dropdown ở trên nội dung khi mobile, hai cột trên desktop. Footer không có Bỏ qua.
Chỉ thêm unit tests critical: thứ tự/flatten, khóa tương lai, giữ vị trí xem riêng, identity/version/frontier. Chạy build/lint và suite topic một lần cuối; chỉ chạy lại nếu sửa lỗi.
Nếu endpoint BE chưa có: báo blocked integration; không mở rộng fixture để thay thế. UI/browser integration chưa xác minh không được ghi PASS.
