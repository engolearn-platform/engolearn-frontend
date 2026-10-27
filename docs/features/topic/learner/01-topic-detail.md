# Learner — Chi tiết chủ đề

Cập nhật chặng2, ngày2026-10-27. Thiết kế theo ảnh tham chiếu người dùng, chuẩn hóa bằng docs/design-system.
API chuẩn: [OpenAPI](../../../handout/topic-learning/api.openapi.yaml); phạm vi hiện tại ở [07-topic-catalog.md](07-topic-catalog.md).

## Route và điều hướng

/topics/:topicId nằm dưới TopicViewerLayout của feature, không gắn TopicProgressProvider mock cũ.
Trang standalone có back-header, hero, danh sách tình huống và sidebar; không bọc sidebar app như catalog.
from chỉ nhận /topics hoặc /my-topics cùng query; giữ tìm kiếm/level/sort/tab, chặn external/unrelated return URLs.

## Thành phần và hook

- TopicDetailView: dùng useTopicDetail và useTopicProgress riêng; lỗi progress không xóa outline.
- TopicItemCard: metadata + đúng ba learning statuses và quyền thao tác độc lập; không preview từ/mẫu câu cụ thể.
- TopicState/TopicProgressBar: loading/error/empty/retry; không biến lỗi thành số0.
- useTopicLaunch: start/continue/review/retry/resumeRetry/restartRetry/topicRetry theo quyền BE; Dialog thay thế lượt dở.
- topic-mutation-journal: giữ Idempotency-Key theo viewer+payload khi kết quả chưa rõ;4xx kết thúc hành động, lỗi mạng/5xx/abort giữ key.

## Nguồn dữ liệu và state

Topic outline từ GET /topics/{id}; counts và duration là số BE tổng hợp. TopicProgressDto riêng cung cấp progress và learned-content metrics.
Header hiển thị CEFR + badge cao level (trình bày); quyền thao tác vẫn theo actions của BE.
Guest chỉ xem outline, không gọi progress; sidebar mời đăng nhập, không dựng login route chưa có.
Nút chính ưu tiên continue cho item đang học, rồi start item đến lượt. Item chưa đến lượt có nút disabled và lý do.
Start chỉ chuyển route sau khi BE trả attempt hợp lệ đúng topic/item; hoàn thành0 item vẫn chuyển topic sang mine.
Review dùng completedAttemptId, không tạo LEARN/RETRY. Retry thay session phải có Dialog và ID phiên được xác nhận.
Trong chặng2, đích /topics/:topicId/attempts/:attemptId là điểm vào hiển thị attempt/position/version thực đã lưu. Chưa có content navigation/advance/quiz/review UI đầy đủ; các phần đó ở chặng3–5. Không chuyển sang màn mock cũ.

## Responsive và xác minh

Mobile một cột; desktop nội dung8/12 + sidebar4/12 sticky. Khoảng cách theo scale, padding20px mobile.
Nút chính tương phản trắng/primary; giữ focus/aria cho controls và progressbar.
Đã kiểm tra bằng browser fixture: back giữ filters, item vượt level disabled, start CONTEXT/0, chuyển mine ở0%, progress failure giữ outline, responsive390px.
Build/lint/native tests và tình trạng BE thật được ghi ở verification.md; client wired chưa đồng nghĩa đã liên thông BE.
