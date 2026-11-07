# Speaking demo — route tạm cho item đã seed

**Trạng thái:** Dev-only F01 slice. Nguồn: FRC Speaking AI v0.5, SPK-UC-001–004.

## Nguồn và route

- Không có Stitch. Route tạm `/dev/speaking` dưới `LearningLayout`, tách khỏi tiến độ Context → Vocab → Expressions → Practice.
- Baseline yêu cầu đăng nhập qua cookie auth chung. Route này vẫn dùng API demo cũ để đối chiếu với [luồng Speaking chính](../../speaking-with-ai/README.md).
- `GET /api/v1/speaking/demo-item` lấy item "At the Restaurant item 1" và mục tiêu mẫu từ backend dev profile.
- Mở route chỉ đọc item và phiên hiện có; không tự tạo phiên.

## Component, state và tương tác

- `SpeakingDemoView`: tiêu đề item, danh sách mục tiêu, tiến độ, điều khiển thu âm, hội thoại, kết quả phiên.
- `speaking-demo.service.ts`: unwrap `ApiResponse`; gọi create/current/resume/turn/end; hiển thị mã lỗi backend.
- State UI: loading, error, recording, submitting. Trạng thái phiên và kết quả lấy từ backend.
- Bắt đầu: xin micro trước khi gọi create. Lượt nói: `MediaRecorder` ghi một audio clip, gửi multipart với `turnId` UUID và `controllerEpoch`; chỉ bật lượt kế tiếp khi có response. Dừng thu ở 120 giây.
- Kết thúc: chỉ nút **Kết thúc phiên** gọi endpoint end. Đóng tab/tải lại không gọi end.
- Phiên cũ: mở route chỉ xem; bấm Tiếp tục mới chuyển controller epoch; tab cũ bị từ chối khi gửi lượt.

## UI-only và responsive

- Dùng `LearningLayout`, `Button`/`Card` hiện có, màu/tỷ lệ từ `docs/design-system/`; bố cục một cột trên mobile và hai cột rộng trên desktop.
- Không hiện UI xóa/lịch sử F02, cấu hình F03 hoặc tiến độ học item.
- Hiển thị rõ đây là dữ liệu và định danh giả lập ở dev; thiếu Groq/Gemini key là lỗi cấu hình, không sinh kết quả giả.

## Kiểm tra

- Mở route không tạo phiên; cho phép micro rồi tạo phiên; thu/dừng và xem transcript, phản hồi, mục tiêu đạt; kết thúc và xem kết quả.
- Tải lại route khi phiên chưa kết thúc không tự end; thử tab thứ hai rồi xác minh tab cũ không gửi lượt được.
- Chạy `npm run lint` và `npm run build`.
