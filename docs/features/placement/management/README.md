# Quản trị Placement

Admin Placement dùng phiên đăng nhập hiện có để gọi API `/api/v1/placement/admin`.
API lưu câu hỏi, bộ đề và lượt làm trong MongoDB theo cấu hình của BE. Dữ liệu
xem trước từng lưu trong trình duyệt nằm ngoài luồng quản trị hiện tại.

## Mở và kiểm tra

1. Dùng gói dữ liệu Placement chuẩn của BE trong `tools/mongo-json-importer/samples`.
   Xem `docs/technical/placement-local-runtime.md` ở repo BE nếu chưa import.
2. Chạy `EngolearnApplication` với cấu hình Placement Mongo local rồi chạy
   `npm run dev` tại FE. Đăng nhập bằng tài khoản có vai trò `ADMIN`.
3. Mở [Admin Placement local](http://localhost:3000/admin/placement).
   Vào **Ngân hàng câu hỏi**, lọc Listening, mở câu, nghe đúng audio theo transcript
   và kích hoạt những câu muốn đưa vào đề. Gói seed để toàn bộ câu ở trạng thái nháp.
4. Vào **Bộ đề** để tạo đề mới hoặc tạo phiên bản mới từ đề có sẵn. Xếp đủ 20 câu
   theo ma trận A1/A2 mỗi mức 4 Reading + 1 Listening, B1/B2 mỗi mức 3 Reading + 2
   Listening. Reading nằm ở thứ tự 1–14. Lưu, xem trước và xuất bản.
5. Vào **Kết quả** để lọc theo mã lượt hoặc User, bộ đề, phiên bản, trạng thái,
   level và ngày bắt đầu. Chi tiết dùng điểm đã lưu, deadline và nội dung theo
   snapshot của lượt làm. Lượt đang làm hoặc hết hạn vẫn hiển thị câu trả lời
   đã ghi nhận nếu có.

## Các màn và giới hạn

- Ngân hàng câu hỏi, form thêm/sửa và nhập CSV dùng chung dữ liệu Mongo. Điều kiện
  kích hoạt gồm bốn lựa chọn, một đáp án đúng, đoạn đọc cho Reading, audio và
  transcript cho Listening. Có thể chọn và nghe thử WAV trong kho hiện có.
  Upload WAV mới nằm ngoài đợt tích hợp này.
- Danh sách, trình soạn và màn xem trước hỗ trợ nháp, xuất bản, tạo phiên bản và lưu
  trữ. Hai đề seed dùng để đối chiếu và tạo phiên bản kế tiếp. Các phiên bản đã xuất
  bản hoặc được cấp cho học viên giữ nội dung và audio theo snapshot.
- Danh sách và chi tiết lượt làm chỉ đọc. Xem trước bộ đề không tạo lượt làm.
- Các màn dùng lại ManagementLayout, Auth và thành phần của EngoLearn. Nút xác
  nhận rời nháp dùng cho các đường dẫn nội bộ và nút quay lại của trình soạn.
