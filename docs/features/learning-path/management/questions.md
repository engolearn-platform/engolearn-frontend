# Quản lý câu hỏi Learning Path

## Thiết kế và route

Theo màn passages hiện có, dùng Narrative tokens và ManagementLayout; không tạo Stitch
mới. Route `/admin/learning-paths/questions` nằm trong ProtectedRoute CONTENT_MANAGER
(ADMIN kế thừa). Menu quản trị có mục Câu hỏi Learning Path và liên kết từ số câu ở passage.

## Component, API và state

Tách view, hook danh sách, service/type và các dialog trong feature learning-path.
Tái sử dụng Button, Dialog, ManagementPageHeader, ListPagination và badge passage.
Nối đủ 10 API backend tại `/api/management/learning-paths/questions`; cookie/refresh,
no-store và AbortSignal qua httpService. Không tạo bộ đếm toàn kho giả: API chỉ trả tổng
khớp bộ lọc. Không thêm mock/fixture để xác nhận tích hợp.

Danh sách tìm kiếm ID/prompt (debounce), lọc skill, canonical micro-skill, CEFR, trạng thái,
passageId và phân trang 0-based. Nhãn micro-skill tiếng Việt chỉ hiển thị, request vẫn
canonical. Có pending, lỗi/retry, kho trống/kết quả trống và thông báo thành công.
Cột “Câu hỏi” chỉ hiển thị nội dung/tiêu đề câu hỏi (`prompt`), không hiển thị mã câu
hỏi hay mã passage liên quan. Nhấn nội dung để mở chi tiết.

## Form và preview

Tạo/sửa DRAFT gồm skill, micro-skill đúng nhóm, level, passage, prompt, A–D, đáp án và
explanation. Listening cần passage; Reading có thể bỏ chọn. Picker tải passage cùng
skill/level và preview audio/text; có thể tạo passage DRAFT ngay trong form và chọn nó
mà giữ nguyên câu hỏi chưa lưu. Passage cần ACTIVE trước khi xuất bản câu hỏi.
Chi tiết tách stimulus khỏi đáp án/explanation và transcript dành cho admin; hỗ trợ tải
lại URL audio khi lỗi/hết hạn. Không lưu URL có thời hạn vào câu hỏi.

## Thao tác

DRAFT: Kiểm tra và xuất bản, xem/sửa/sao chép/xóa. ACTIVE: Ngưng sử dụng, xem/sao chép/
thay thế. RETIRED: xem/sao chép. Các nút chính cùng kích thước như passages (w-48 h-12),
chữ retire trung tính. Mutation dùng revision server và khóa chống gửi trùng.

Publish luôn tải readiness mới, không tự đánh dấu checklist; unknown check, blocker,
revision lệch hoặc chưa xác nhận đủ đều khóa submit. Các kiểm tra media/audio tiếp tục theo readiness của backend.
Replace chọn DRAFT hiện có, xem trước, kiểm tra/xác nhận checklist rồi gửi một request
atomic với revision câu cũ và câu mới. Không ghép hai request publish/retire.

Retire/replace bắt đầu với confirmCoverageWarning=false. Chỉ khi backend trả đúng lỗi
QUESTION_COVERAGE_CONFIRMATION_REQUIRED và warnings hợp lệ mới hiện bước xác nhận thiếu
30 câu; không gửi lại tự động. Admin đánh dấu chấp nhận mới gửi true. Cảnh báo còn được
hiển thị sau success. Lỗi 409 khác hoặc mạng/503 phải tải lại trạng thái trước khi thử
lại. Lỗi 422 hiển thị readiness mới và yêu cầu kiểm tra/xác nhận lại.

Đóng/unmount/mất quyền hủy request và bỏ phản hồi muộn; abort không chứng minh backend
chưa ghi, vì vậy phải refetch trạng thái. Không có xuất file, dashboard độ phủ hoặc lịch sử.

## Responsive và kiểm chứng

Filter xếp dòng trên mobile; bảng cuộn ngang; dialog cuộn theo viewport, nhãn form đầy
đủ. Dialog chi tiết/duyệt giữ header bên ngoài vùng cuộn; footer Đóng hoặc các nút
kiểm tra/xuất bản nằm ở hàng riêng, không dùng sticky phủ lên đáp án/checklist.
Chỉ phần nội dung ở giữa cuộn (`min-h-0`, `overflow-y-auto`), khung dialog giới hạn
90dvh và ẩn phần tràn. Form tạo/sửa giữ header cố định, các nút lưu nằm cuối form.
Hỗ trợ
bàn phím/escape/focus và trạng thái tải rõ ràng. Chạy build + lint + auth checks liên
quan; kiểm chứng qua FE proxy/backend thật khi môi trường cho phép. Ghi đúng phạm vi
đã chạy và các bước tích hợp chưa kiểm chứng, không dùng kết quả mock thay thế E2E.

### Kiểm chứng ngày 2026-11-27

- `npm run build`: kiểm tra TypeScript và tạo bản production; Vite cảnh báo bundle lớn.
- `npm run lint`: 0 lỗi, 73 cảnh báo sẵn có của repository.
  ESLint riêng các file triển khai đã thay đổi không có lỗi/cảnh báo.
- `node --test tests/auth-role-policy.test.mjs`: 2 kiểm tra hàm phân quyền đạt.
  Không chạy `auth-routes.test.mjs` vì suite đó giả lập HTTP; không coi kiểm tra hàm
  phân quyền là bằng chứng cho route/backend E2E.
- GET thật qua frontend local tới `/admin/learning-paths/questions`: HTTP 200
  (HTML entry, chưa chứng minh màn quản trị đã đăng nhập). Proxy API câu hỏi trả 500;
  cổng backend 8080 từ chối kết nối. Không khởi động backend hay ghi dữ liệu nghiệp vụ.
- Chưa kiểm chứng trực tiếp UI desktop/mobile và luồng đăng nhập, mất quyền,
  CRUD/publish/retire/replace với backend thật. In-app browser không truy cập được
  server local; trình duyệt native đang có người dùng thao tác nên dừng tự động hóa.
  Cần chạy backend, đăng nhập CONTENT_MANAGER/ADMIN rồi kiểm tra các luồng trên,
  đặc biệt cảnh báo độ phủ, revision thay đổi và giữ form khi tạo passage.

## Nhãn micro-skill từ catalog

Dùng [catalog dùng chung trong Learning Path](../micro-skill-catalog.md) để hiển thị tên tiếng Việt. Canonical và các khóa ghép dữ liệu giữ nguyên; tên chưa có bản dịch hiển thị canonical.
