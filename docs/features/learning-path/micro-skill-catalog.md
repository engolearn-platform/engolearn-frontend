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
Tìm kiếm lộ trình hỗ trợ canonical, ngày tạo và tên tiếng Việt hiện tại từ catalog,
kể cả kỹ năng INACTIVE. So khớp một phần, không phân biệt hoa thường, có phân biệt
dấu tiếng Việt; chưa hỗ trợ chuyển từ khóa không dấu. Backend ánh xạ nhãn sang
canonical, giữ phạm vi chủ sở hữu và loại lộ trình đã hủy.

## Kiểm chứng

- Tìm kiếm tiếng Việt: kiểm thử HTTP backend với MongoDB Testcontainers đạt cho
  tên đầy đủ/một phần, hoa thường, khoảng trắng, INACTIVE, đổi nhãn catalog,
  loại chủ sở hữu khác/lộ trình hủy, thứ tự và kết quả không trùng. Canonical cũ
  thiếu catalog và tìm theo ngày vẫn hoạt động. Không thay đổi code frontend;
  frontend tiếp tục gửi keyword qua HTTP client hiện có.

- `npm run build`: đạt TypeScript và Vite; cảnh báo bundle trên 500 kB vẫn còn.
- `npm run lint`: 0 lỗi, 73 cảnh báo; ESLint riêng tất cả file Learning Path đã
  thay đổi/thêm mới với `--max-warnings 0` đạt, không có lỗi/cảnh báo.
- Kiểm thử trình duyệt ngày 28/11/2026 với frontend proxy và backend thật,
  tài khoản CONTENT_MANAGER đã đăng nhập; không dùng mock/fixture.
- API catalog trả đủ 10 định nghĩa, tất cả ACTIVE. Bộ lọc và form hiển thị tên
  tiếng Việt; giá trị lựa chọn vẫn là canonical. Đổi nhóm Reading/Listening lọc
  đúng 5 kỹ năng của từng nhóm.
- Tạo bản nháp Reading for Gist, mở lại, sửa giải thích và lưu thành revision 2
  thành công. API chi tiết xác nhận microSkill vẫn là Reading for Gist và nhãn
  Đọc tìm ý chính. Chưa xuất bản bản nháp kiểm thử.
- Tải lại catalog trong form giữ nguyên câu hỏi, giải thích và canonical đang
  chọn. Danh sách và preview hiển thị nhãn tiếng Việt sau khi lưu.
- Kiểm tra preview ở viewport 390 x 844: dialog nằm trong chiều rộng màn hình,
  nội dung có thể cuộn; đã khôi phục viewport sau kiểm tra.
- Đã kiểm chứng INACTIVE trên DB local thật: tạm đổi riêng MS-R-GIST từ ACTIVE
  sang INACTIVE, tải lại catalog trên form đang soạn. Lựa chọn hiện Đọc tìm ý chính
  · Không còn khả dụng và bị vô hiệu hóa; thao tác lưu bị chặn ở form. Toàn bộ
  câu hỏi, bốn lựa chọn, đáp án đúng, giải thích và canonical vẫn nguyên vẹn.
  Dữ liệu câu hỏi đã có vẫn hiện nhãn tiếng Việt; bộ lọc có Ngừng sử dụng và
  vẫn tìm được câu hỏi. Đã khôi phục status ACTIVE, giữ nguyên revision và metadata.
- Đã kiểm chứng API lỗi và thử lại: tạm dừng MongoDB local, GET catalog thật trả
  HTTP 503. Form hiện lỗi và nút Thử tải lại danh mục kỹ năng, nút lưu bị khóa.
  Khởi động lại MongoDB rồi thử lại: lỗi API biến mất, lựa chọn ACTIVE và nút lưu
  hoạt động lại. So sánh toàn bộ giá trị form trước/sau xác nhận không mất dữ liệu.
  Không lưu câu hỏi thử; đã đóng form bằng Hủy và xác nhận MongoDB healthy.
- Tài khoản CONTENT_MANAGER có 0 lộ trình nên agent chưa tự kiểm chứng learner
  detail, thống kê, practice/review. Người dùng đã xác nhận luồng user chạy đúng
  ngày 28/11/2026; đây là kết quả kiểm tra của người dùng.
- Đã xóa bản nháp kiểm thử LP-Q-9764ed08-d3f7-4b10-962c-1ff51aa1555b sau
  khi người dùng xác nhận. UI báo xóa thành công và tìm kiếm không còn kết quả;
  các câu hỏi đã xuất bản và đáp án learner không đổi.

Backend sở hữu schema, seed và contract tại
`engolearn-backend/docs/technical/microskill/README.md`. Cần import seed backend trước
khi soạn câu hỏi hoặc tạo recommendation mới. Assessment được tích hợp bởi thành viên khác.

## Kiểm tra sau sửa việc làm mới catalog

Bảng, bộ lọc, form và preview trong màn quản lý dùng chung kết quả GET catalog;
form không tạo một loader riêng. Nút tải lại có ở cả màn danh sách và form, cập nhật
chung dữ liệu mà không đổi key hay remount form. GET thành công, kể cả trả danh sách
rỗng, được ưu tiên hơn metadata trong response câu hỏi đã tải trước đó.

Build và lint đã chạy lại sau thay đổi và đạt kết quả nêu trên. Kiểm thử
trình duyệt quản trị đã thực hiện theo mục Kiểm chứng; các trường hợp còn thiếu
được ghi rõ, chưa coi toàn bộ E2E là đã đạt.
