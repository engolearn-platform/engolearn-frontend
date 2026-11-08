# Speaking with AI — triển khai FE

**Nhánh:** `feat/speaking-ai-baseline`. **Trạng thái:** đã đối chiếu mã, build và lint; chưa thử trực tiếp mic, trình duyệt và provider trong lần dọn này.

| Tài liệu | Nội dung |
| --- | --- |
| [Luồng người dùng](user-flows.md) | Route, thao tác và phần chưa triển khai theo SPK-UC-001–010 |
| [Hợp đồng REST/WebSocket](api-contract.md) | Request, response, lỗi, audio PCM và quy tắc đồng bộ snapshot |
| [Thành tích và tổng kết](achievement-session-result.md) | Mốc tiến độ, hiệu ứng trên lượt đã xác nhận và màn hình tổng kết |
| [Ánh xạ nghiệp vụ BE](../../../../speaking-ai-baseline-backend/docs/features/speaking-with-ai/README.md) · [Technical BE](../../../../speaking-ai-baseline-backend/docs/technical/speaking-ai/README.md) | Nguồn nghiệp vụ, mã BE, cấu hình triển khai, cách rollback và giới hạn |

Nguồn nghiệp vụ là [đặc tả Speaking with AI](../../../../../docs/engolearn-business-doc/docs/usecase_spec/speaking-with-AI/00-module.md). Các trang trong thư mục này mô tả hành vi đã có trong FE và ghi riêng các điểm còn lệch so với đặc tả.

## Cấu hình hiển thị

- `npm run dev`: Speaking luôn được bật ở FE. Với build ngoài DEV, đặt `VITE_SPEAKING_ENABLED=true` lúc build để hiển thị luồng Speaking. `VITE_SPEAKING_DEMO_ENABLED` vẫn được đọc nếu khóa mới chưa đặt. Khi có cả hai, khóa mới thắng; giá trị phải đúng chuỗi `"true"`.
- FE dùng cookie đăng nhập. Cờ FE chỉ điều khiển hiển thị; quyền truy cập và tính khả dụng của REST/WebSocket do BE thực thi. BE hiện vẫn chặn Speaking với profile `prod`. Tắt manager ở BE để chạy evaluator legacy không yêu cầu đổi cấu hình FE.
- Vite phục vụ port 3000, proxy cả `/api` và `/ws` tới `http://localhost:8080`. Dùng `VITE_API_PROXY_TARGET` nếu BE chạy ở địa chỉ khác. Khi triển khai ngoài Vite, cấu hình reverse proxy hỗ trợ cả HTTP và WebSocket cho các path này.

## Chạy thử bằng dữ liệu thật của môi trường local

1. Khởi động MongoDB và BE với profile `dev` theo [hướng dẫn BE](../../../../speaking-ai-baseline-backend/docs/technical/speaking-ai/module-contract.md#local-startup-and-seed-data). Cấu hình AssemblyAI, Gemini, Cartesia và Cloudinary để thử âm thanh.
2. Chạy `npm run dev` ở worktree FE và đăng nhập bằng tài khoản có quyền mở item. Hoàn thành một item đã có cấu hình Speaking rồi bấm **Luyện nói với AI** từ kết quả, hoặc mở `/dev/speaking-session?itemId=690000000000000000000002` để dùng fixture sân bay của BE.
3. Với bộ dữ liệu café đã nạp cấu hình, `/dev/speaking-session` mặc định chọn `691b00000000000000000003` (AI mở lời); `?itemId=691b00000000000000000004` thử nhánh người học mở lời. Luồng này vẫn kiểm tra level và item trước đó.
4. Bấm **Bắt đầu phiên mới**, cho phép mic, thử một lượt nói, chủ động kết thúc rồi mở lại lịch sử và thử phát audio. Kiểm tra thêm mở hai tab, rớt mạng, từ chối mic và trường hợp chỉ có text khi TTS lỗi.

Hai route `/dev/speaking-session` và `/dev/speaking` chỉ đăng ký trong Vite DEV. Route thứ nhất dùng cùng `SpeakingView` với luồng chính. Route thứ hai là màn hình đối chiếu multipart/MediaRecorder cho server demo cũ; BE hiện tại không có các endpoint multipart đó.

## Kiểm chứng

- `npm run build` thành công với cảnh báo kích thước bundle có sẵn; `npm run lint` không có lỗi, 72 cảnh báo như baseline.
- Bộ kiểm tra logic thành tích chạy 4 test, đều đạt. Mic, autoplay, mất mạng, phát lại bằng Cloudinary, trình duyệt mục tiêu và các chỉ tiêu độ trễ vẫn cần kiểm tra trực tiếp.
