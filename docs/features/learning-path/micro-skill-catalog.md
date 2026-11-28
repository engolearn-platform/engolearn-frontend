# Catalog micro-skill trong Learning Path

## Phạm vi và thiết kế

Giữ các route và bố cục learner/management hiện có; dùng component, typography và
responsive tokens hiện tại. Chỉ thay nguồn dữ liệu nhãn và lựa chọn micro-skill.
Không sửa thư mục Assessment hoặc tạo màn admin catalog/CRUD lộ trình mới.

## Dữ liệu và component

Response list/search, detail, start/result và quản lý câu hỏi cung cấp
`microSkillCatalog`. Provider nằm trong feature Learning Path, giới hạn theo màn và
response; state quản lý được remount khi identityGeneration thay đổi. Không có cache toàn ứng dụng hoặc bảng dịch hardcode. Các component dùng
canonical để đối chiếu/key và dùng `displayNameVi` để hiển thị, gồm nhãn đọc màn hình.
Thiếu bản dịch/bản ghi/metadata cũ thì hiển thị canonical; null hiển thị Chưa phân loại.
Các định nghĩa inactive vẫn cung cấp nhãn cho dữ liệu lịch sử.

Màn quản lý tải `GET /api/micro-skills` qua HTTP/session và `useFetch` với AbortSignal.
Bảng, bộ lọc, preview/cảnh báo và form dùng chung state catalog do màn quản lý sở hữu.
Khi mở/đóng thao tác hoặc tải lại catalog, GET mới cập nhật toàn bộ các nhãn; metadata
của response danh sách/chi tiết cũ không ghi đè kết quả GET đã tải thành công. Tải lại
catalog không remount form, không đổi canonical đã chọn hoặc xóa nội dung đang soạn.
Các màn learner vẫn dùng metadata từ response tương ứng.
Bộ lọc danh sách có cả inactive để tìm dữ liệu cũ; form chỉ cho chọn ACTIVE đúng nhóm.
Loading/lỗi có thông báo và thử lại; tải lại trong form giữ nguyên nội dung đang soạn; không lưu khi chưa tải được catalog hợp lệ.
Kỹ năng cũ inactive/không còn trong danh mục vẫn thấy nhãn nhưng không được giữ làm
lựa chọn hợp lệ khi lưu. Thử lại không làm mất dữ liệu câu hỏi đang soạn.

Request tiếp tục gửi canonical, không gửi nhãn tiếng Việt hoặc thay bằng ID.
Điểm, baseline, key ghép thống kê, câu trả lời, thời gian và quyền truy cập giữ nguyên.
Tìm kiếm lộ trình vẫn theo canonical/ngày ở backend; chưa thêm tìm kiếm bản dịch.

## Kiểm chứng

- `npm run build`: đạt TypeScript và Vite; cảnh báo bundle trên 500 kB vẫn còn.
- `npm run lint`: 0 lỗi, 73 cảnh báo; ESLint riêng tất cả file Learning Path đã
  thay đổi/thêm mới với `--max-warnings 0` đạt, không có lỗi/cảnh báo.
- Request thật `/api/micro-skills` qua Vite proxy trả 401 cho client chưa đăng nhập.
  Đây là kiểm tra kết nối và ranh giới xác thực, chưa chứng minh danh sách đã tải đủ.
- Trình duyệt tích hợp mở được `/learning-paths` khi Vite chạy ngoài sandbox;
  trang hiện Không xác minh được tài khoản / HTTP 403. Chưa kiểm chứng màn có dữ
  liệu và nhãn dài trên desktop/mobile, bộ chọn ACTIVE/INACTIVE, lưu nháp và retry
  khi đã đăng nhập. Không dùng mock/fixture thay kết quả tích hợp.

Bước kiểm tra thủ công còn lại: chạy backend có catalog đã import, đăng nhập learner
và CONTENT_MANAGER/ADMIN, kiểm tra các màn danh sách/chi tiết/thống kê/practice/review;
ở form câu hỏi kiểm tra kỹ năng ngừng dùng, lỗi/tải lại mà không mất nội dung, và
request vẫn gửi canonical. Cần xử lý phiên xác thực trước khi xác nhận E2E.

Backend sở hữu schema, seed và contract tại
`engolearn-backend/docs/technical/microskill/README.md`. Cần import seed backend trước
khi soạn câu hỏi hoặc tạo recommendation mới. Assessment được tích hợp bởi thành viên khác.

## Kiểm tra sau sửa việc làm mới catalog

Bảng, bộ lọc, form và preview trong màn quản lý dùng chung kết quả GET catalog;
form không tạo một loader riêng. Nút tải lại có ở cả màn danh sách và form, cập nhật
chung dữ liệu mà không đổi key hay remount form. GET thành công, kể cả trả danh sách
rỗng, được ưu tiên hơn metadata trong response câu hỏi đã tải trước đó.

Build và lint đã chạy lại sau thay đổi. E2E với phiên Edge hiện có chưa thực hiện
được: công cụ Computer Use dừng vì không xác định chắc chắn URL cửa sổ browser trên
Windows. Chưa thao tác tạo/sửa câu hỏi, đổi trạng thái/nhãn catalog, lưu đáp án hoặc
nộp bài qua browser trong lượt kiểm tra này; không coi phần E2E là đã đạt.
