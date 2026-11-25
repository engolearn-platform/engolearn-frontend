# Quản lý kho passages

## Thiết kế và route

Tham chiếu bố cục Topics hiện có, không tạo thiết kế Stitch mới. Dùng token
EngoLearn Narrative và `ManagementLayout`. Route `/admin/learning-paths/passages`
được bảo vệ bởi auth contract `ProtectedRoute`, yêu cầu CONTENT_MANAGER (ADMIN kế thừa).

## Component và dữ liệu

`PassageManagementListView` ghép header, bốn bộ đếm, bộ lọc, bảng và phân trang.
Component riêng thuộc `learning-path/components/management/passages`; không nhập
component nội bộ của Topic. Tái sử dụng shared header, CEFR select, pagination,
Button và Dialog. Bảng có Passage (tiêu đề/mã), Kỹ năng, Trình độ, Trạng thái,
Cập nhật và Thao tác; không có cột Audio hoặc Số câu hỏi.

`usePassageManagementList` dùng `useFetch`, tìm kiếm chờ 350 ms, thay bộ lọc về
trang đầu, page API bắt đầu từ 0. Service gọi API thật
`/api/management/learning-paths/passages`; counters toàn kho độc lập bộ lọc.
Không có dữ liệu mẫu hay bộ đếm giả khi API lỗi.

## Thao tác

Chi tiết, tạo và sửa mở Dialog ngay trong màn danh sách; xóa có Dialog xác nhận.
Tạo/sửa gửi multipart với part `passage` application/json và `audio` khi cần.
Reading cần text; Listening cần transcript và MP3/WAV tối đa 25 MiB khi tạo
hoặc chuyển từ Reading. Sửa Listening giữ audio hiện có nếu không chọn file mới.
Chỉ DRAFT được sửa/xóa. PATCH và DELETE gửi revision server để phát hiện xung đột.
Xóa bị chặn khi đã có câu hỏi tham chiếu. Backend quyết định quyền và ràng buộc.
Audio được nghe ở chi tiết, URL tạm chỉ giữ trong Dialog và tải lại khi hết hạn/lỗi.
Với DRAFT, cột Thao tác hiển thị trực tiếp **Kiểm tra**, **Xuất bản** và menu ba
chấm (Xem chi tiết, Sửa, Xóa). ACTIVE/RETIRED chỉ có menu Xem chi tiết. Xuất bản
tạm vô hiệu hóa, có chú thích truy cập được bằng bàn phím vì chưa có API xuất bản.
Nút Kiểm tra đổi nền `learning-mint` và viền `primary` khi hover hoặc focus bằng
bàn phím, giữ chữ `primary` để trạng thái tương tác rõ hơn.

Kiểm tra mở `PassageReadinessDialog`, gọi GET `/{passageId}/readiness` qua cùng
service/cookie/refresh và AbortSignal. Dialog hiển thị trạng thái tải, lỗi/thử lại,
revision server, lỗi chặn, cảnh báo và checklist chuyên môn dưới dạng hướng dẫn
chưa xác nhận. Đạt kiểm tra tự động không có nghĩa đã được duyệt chuyên môn hay
đã xuất bản. Có lối mở chỉnh sửa DRAFT và mở chi tiết/nghe thử. Kết quả mới dùng
revision server; nếu khác revision trong bảng, hiển thị thông báo dữ liệu đã đổi.
Mỗi lần mở/kiểm tra lại gọi API mới; đóng hủy yêu cầu, không cache kết quả hoặc
lưu xác nhận chuyên môn. Mở chỉnh sửa sẽ đóng kết quả, nên lưu xong cần kiểm tra
lại. Đóng Dialog tải lại danh sách để đồng bộ trạng thái/revision.

Không có export, publish mutation hay retire trong phạm vi này.

## State và responsive

Tách state bộ lọc/trang, kết quả server, Dialog và mutation. Có loading, retry,
kho trống, kết quả trống, lỗi API và thông báo thành công. Khi API trả trang trống
do xóa cuối trang, trở về trang cuối hợp lệ. Khi mất quyền, guard gỡ toàn bộ màn.
Trên mobile, filter xếp dòng và bảng cuộn ngang; controls có nhãn truy cập.

## Kiểm chứng — 2026-11-25

- `npm run build`: đạt; có cảnh báo kích thước bundle lớn hơn 500 kB.
- `npm run lint`: đạt, 0 lỗi và 73 cảnh báo của các phần hiện có.
- `npm run test:learning-path-passages`: 17 kiểm tra đạt. Bao gồm filter và
  pagination params, multipart giữ nguyên qua refresh, revision DELETE/PATCH,
  lỗi conflict, JSON request cũ, 6 cột, quyền thao tác DRAFT và route thực tế:
  pending/error/retry, guest/USER/CONTENT_MANAGER/ADMIN, demotion/logout và
  quay về URL Passage sau đăng nhập (giữ query/fragment). Readiness được kiểm tra
  từ nút trong dòng của bảng đến Dialog: GET/cookie/no-store/ID encoding, signal,
  loading, blockers/warnings/checklist, revision mới, thử lại, không cho sửa kết
  quả ngoài DRAFT và hủy yêu cầu khi đóng. Xuất bản không phát sinh mutation.
- Các kiểm tra client dùng HTTP mô phỏng, không thay thế kiểm chứng backend thật.
- Lần kiểm chứng màn danh sách trước: browser thật mở được route, hiển thị lỗi kiểm tra phiên do backend local
  `localhost:8080` không chạy (connection refused). Không thêm dữ liệu mẫu hay
  bỏ qua auth để chụp giao diện.
- Khi nối readiness, kiểm tra backend local `localhost:8080/api/v1/auth/me`
  không nhận được phản hồi trong thời gian chờ 4 giây. Chưa kiểm chứng nút Kiểm
  tra với backend thật hoặc bố cục hai nút trên browser desktop/mobile.
- Chưa kiểm chứng browser desktop/mobile của danh sách sau đăng nhập, CRUD,
  nghe audio và upload với backend thật. Cần chạy backend có đủ Passage APIs
  (bao gồm `counters`), đăng nhập CONTENT_MANAGER/ADMIN rồi mở route ở trên.
- Chưa chạy các bộ test Topic hay module khác theo phạm vi người dùng yêu cầu.
