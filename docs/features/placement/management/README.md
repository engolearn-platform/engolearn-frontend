# Quản trị Placement

Dùng `/admin/placement` với ADMIN qua Auth contract và ManagementLayout của nhóm. CONTENT_MANAGER không mặc định có quyền quản trị Placement. Đăng nhập dùng cookie chung; trang được bảo vệ giữ đường quay lại sau đăng nhập.

## Màn hình

- **Bộ đề:** tìm mã/tên, lọc trạng thái, nhấn tên để preview. Soạn Draft → kiểm tra20 câu theo ma trận → xuất bản. Bản đã xuất bản được tạo phiên bản mới để sửa; lượt đã cấp giữ đúng snapshot lịch sử. Tên là link text-on-surface; code/version ở chi tiết thay vì lặp trong danh sách.
- **Ngân hàng:** danh sách/tạo/sửa/import CSV qua Mongo; câu ACTIVE cần đủ điều kiện nội dung. Listening chọn kho có sẵn hoặc ADMIN upload WAV qua BE/Media. Nhãn tổng hợp Cần bổ sung / Chờ kích hoạt / Sẵn sàng sử dụng / Ngừng sử dụng; readiness và lifecycle vẫn là thuộc tính riêng trong dữ liệu/bộ lọc.
- **Kết quả:** chỉ đọc/tìm kiếm lượt User và Guest, không sửa điểm/level hoặc cấp lại lượt làm. Hai hàng lọc: mã lượt/User, mã bộ đề gợi ý tên, trạng thái; CEFR, từ/đến ngày và Lọc/Đặt lại. Enter gửi form, trim khoảng trắng. GUI không lọc phiên bản; lịch sử vẫn hiển thị version, BE vẫn hỗ trợ version cho tương thích. Trạng thái một hàng, bảng nhỏ cuộn ngang.

Tên bộ đề trong Kết quả được tải từ danh mục độc lập với màn Bộ đề/Ngân hàng. Chờ catalog và attempts, lỗi catalog có retry. Đối chiếu testSetId+version rồi code+version; chỉ fallback mã khi metadata thật sự thiếu. Tải trực tiếp/reload không được thay tên bằng mã do thiếu cache hoặc lấy nhầm tên phiên bản mới. Không tải cả320 câu hỏi chỉ để hiển thị tên đề.

Cả ba danh sách dùng ListPagination compact opt-in, không đổi mặc định của module khác. Giữ lựa chọn số dòng/trang, phạm vi số trang gọn và điều khiển đủ dễ nhận biết.

## Chạy và bàn giao

Xem [entry Placement](../README.md), tài liệu BE `docs/technical/placement/README.md` và `tools/mongo-json-importer/samples/placement/README.md`. Merge source không tự import Mongo hoặc cấp tài khoản. Không import các gói seed cũ chồng lên catalog hiện hành. Auth/media theo [hợp đồng tích hợp](../../grammar/04-team-dev-integration.md).

Ma trận đề: A1/A2 mỗi cấp4 Reading+1 Listening; B1/B2 mỗi cấp3 Reading+2 Listening; tổng14 Reading trước6 Listening. API quản trị dùng prefix `/api/v1/placement/admin`, revision CAS, validation và snapshot BE là nguồn chuẩn.
