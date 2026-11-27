# Quản lý kho passages

## Thiết kế và route

Tham chiếu bố cục Topics hiện có, không tạo thiết kế Stitch mới. Dùng token
EngoLearn Narrative và `ManagementLayout`. Route `/admin/learning-paths/passages`
được bảo vệ bởi auth contract `ProtectedRoute`, yêu cầu CONTENT_MANAGER (ADMIN kế thừa).

## Component và dữ liệu

`PassageManagementListView` ghép header, bốn bộ đếm, bộ lọc, bảng và phân trang.
Component riêng thuộc `learning-path/components/management/passages`; không nhập
component nội bộ của Topic. Tái sử dụng shared header, CEFR select, pagination,
Button và Dialog. Bảng có Passage (chỉ tiêu đề), Kỹ năng, Trình độ, Số câu hỏi,
Trạng thái, Cập nhật và Thao tác; không có cột Audio. Số câu hỏi hiển thị
`referencingQuestionCount` do API danh sách cung cấp: tổng câu trong Question Pool
tham chiếu passage, ở mọi trạng thái; 0 khi chưa có câu, không tính snapshot người
học. Backend đếm theo lô các passage trong trang; frontend không gọi readiness cho
từng dòng. Con số liên kết đến kho câu hỏi với bộ lọc `passageId`, ở mọi trạng thái.
Nếu backend cũ chưa trả trường này thì hiển thị “Xem câu hỏi”, không tự suy ra 0.
Xem [quản lý câu hỏi](questions.md) cho form tạo passage ngay trong câu hỏi:
form passage khóa skill/level theo câu hỏi và trả receipt để chọn passage mới,
giữ nguyên nội dung câu hỏi đang soạn. Hủy request khi unmount và bỏ phản hồi muộn.
Mã passage không hiển thị trên bảng danh sách; vẫn hiển thị trong dialog chi tiết.

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
Với DRAFT, cột Thao tác có một nút **Kiểm tra và xuất bản** và menu ba
chấm (Xem chi tiết, Sửa, Xóa). ACTIVE có nút **Ngưng sử dụng** ở cùng vị trí
trong cột Thao tác và menu Xem chi tiết; RETIRED chỉ có menu Xem chi tiết.
Hai nút tác vụ dùng chung chiều rộng `w-48` (192px) và chiều cao `h-12` (48px)
để thẳng hàng giữa DRAFT/ACTIVE; menu ba chấm vẫn canh phải và bảng cuộn ngang
trên màn hình hẹp.
Nút Ngưng sử dụng trong bảng dùng chữ trung tính `on-surface` cả khi hover.

Nút **Kiểm tra và xuất bản** mở `PassageReadinessDialog`, luôn gọi mới GET
`/{passageId}/readiness` qua cùng service/cookie/refresh và AbortSignal. Dialog
hiển thị tải, lỗi/thử lại, revision server, lỗi chặn, cảnh báo và checklist chuyên
môn chưa được đánh dấu. Có lối mở chỉnh sửa DRAFT và mở chi tiết/nghe thử. Nút
**Xuất bản** trong dialog bị khóa khi đang tải, kiểm tra lỗi, còn blocker,
revision thay đổi hoặc chưa xác nhận đầy đủ checklist. Mở dialog, kiểm tra lại
và đánh dấu checklist không tự gửi yêu cầu xuất bản.

Đạt kiểm tra tự động không có nghĩa đã được duyệt chuyên môn hay đã xuất bản.
Revision khác dòng hiện tại yêu cầu đóng, tải lại danh sách và xem lại nội dung.
Mỗi lần mở/kiểm tra lại đều gọi API mới; đóng hủy yêu cầu và bỏ xác nhận. Mở
chỉnh sửa/chi tiết đóng dialog kiểm tra, nên muốn xuất bản cần mở lại và xác
nhận lại. Đóng dialog tải lại danh sách để đồng bộ trạng thái/revision.

Xuất bản chỉ được xác nhận khi passage đang DRAFT, revision khớp dòng đã chọn,
không có blocker và admin tự đánh dấu đầy đủ checklist server trả về. Reading cần
hai mục, Listening cần thêm hai mục audio. Không tự đánh dấu hoặc bỏ qua tiêu chí
chưa được frontend hỗ trợ. Gửi JSON `{revision, confirmedReviewChecks}` tới POST
`/{passageId}/publish`; không gửi nội dung, danh tính người duyệt hay file audio.
Khi đang gửi, khóa xác nhận/đóng Dialog để tránh gửi trùng. Thành công hiển thị
thông báo và tải lại danh sách/counters; dòng ACTIVE không còn nút sửa/xóa/xuất bản.

Lỗi 422 hiển thị readiness cập nhật từ ProblemDetail extension, lỗi 409 yêu cầu
tải lại dữ liệu. Mọi lỗi mutation xóa xác nhận và khóa gửi lại đến khi admin kiểm
tra lại; lỗi mạng/503 không được tự coi là chưa xuất bản hoặc tự gửi lại. Đóng và
kiểm tra lại đều loại bỏ xác nhận cũ; revision khác dòng hiện tại yêu cầu đóng/tải
lại danh sách và xem lại nội dung. Mất quyền/sign out gỡ Dialog và hủy request ở
client; kết quả server có thể đã được ghi nên lần truy cập sau cần tải lại trạng thái.
Ngưng sử dụng mở `PassageRetireDialog` để xác nhận tên passage và tác động trước
khi gửi POST `/{passageId}/retire` với JSON `{revision}` của dòng ACTIVE. Không
tự chặn theo tổng số câu tham chiếu trên bảng: chỉ backend xác định số câu ACTIVE.
Khi gửi, khóa đóng/xác nhận và chống gửi trùng; đóng hoặc mất quyền hủy request,
bỏ qua phản hồi muộn. Thành công tải lại bảng/counters từ backend và thông báo.
Lỗi `PASSAGE_ACTIVE_REFERENCES` hiển thị `activeQuestionCount` hợp lệ từ
ProblemDetail; các lỗi revision/quyền/không tồn tại hoặc mạng/503 không tự gửi
lại. Sau lỗi, cần đóng và tải lại trạng thái trước khi xác nhận lần nữa. Ngưng
sử dụng không xóa audio hoặc thay đổi lộ trình đã giao. Không có export.
Listening dùng Media còn bị backend
chặn cho đến khi luồng audio người học được hoàn thiện.

## State và responsive

Tách state bộ lọc/trang, kết quả server, Dialog và mutation. Có loading, retry,
kho trống, kết quả trống, lỗi API và thông báo thành công. Khi API trả trang trống
do xóa cuối trang, trở về trang cuối hợp lệ. Khi mất quyền, guard gỡ toàn bộ màn.
Trên mobile, filter xếp dòng và bảng cuộn ngang; controls có nhãn truy cập.

## Kiểm chứng — 2026-11-25

- `npm run build`: đạt; có cảnh báo kích thước bundle lớn hơn 500 kB.
- `npm run lint`: đạt, 0 lỗi và 73 cảnh báo của các phần hiện có.
- `npm run test:learning-path-passages`: 28 kiểm tra đạt. Bao gồm filter và
  pagination params, multipart giữ nguyên qua refresh, revision DELETE/PATCH,
  lỗi conflict, JSON request cũ, 7 cột, số câu hỏi (có tham chiếu/0/định dạng số), quyền thao tác DRAFT và route thực tế:
  pending/error/retry, guest/USER/CONTENT_MANAGER/ADMIN, demotion/logout và
  quay về URL Passage sau đăng nhập (giữ query/fragment). Readiness được kiểm tra
  từ nút trong dòng của bảng đến Dialog: GET/cookie/no-store/ID encoding, signal,
  loading, blockers/warnings/checklist, revision mới, thử lại, không cho sửa kết
  quả ngoài DRAFT và hủy yêu cầu khi đóng. Xuất bản kiểm tra JSON request, xác nhận
  không tự tick, chống gửi trùng, tải lại ACTIVE/counters, chặn revision cũ/Media
  chưa hỗ trợ/tiêu chí chưa biết, hiển thị 422, xử lý 409/mạng không tự gửi lại và
  hủy request khi sign out, không hiển thị thành công muộn sau khi mất quyền.
- Các kiểm tra client dùng HTTP mô phỏng, không thay thế kiểm chứng backend thật.
- Lần kiểm chứng màn danh sách trước: browser thật mở được route, hiển thị lỗi kiểm tra phiên do backend local
  `localhost:8080` không chạy (connection refused). Không thêm dữ liệu mẫu hay
  bỏ qua auth để chụp giao diện.
- Khi nối readiness, kiểm tra backend local `localhost:8080/api/v1/auth/me`
  không nhận được phản hồi trong thời gian chờ 4 giây. Chưa kiểm chứng nút Kiểm
  tra với backend thật hoặc bố cục hai nút trên browser desktop/mobile.
- Luồng xuất bản được kiểm chứng bằng HTTP mô phỏng trong kiểm thử component/client;
  chưa thực hiện xuất bản dữ liệu thật hoặc xác nhận bố cục Dialog trên browser.
- Kiểm tra lại khi nối xuất bản: backend local đã trả 401 cho yêu cầu `/api/v1/auth/me`
  không có cookie. Browser thật mở route quản lý và được chuyển về trang đăng nhập;
  trình duyệt kiểm thử chưa có phiên CONTENT_MANAGER/ADMIN nên chưa thực hiện mutation
  với dữ liệu thật. Đây không phải bằng chứng đã kiểm thử E2E luồng xuất bản.
- Chưa kiểm chứng browser desktop/mobile của danh sách sau đăng nhập, CRUD,
  nghe audio và upload với backend thật. Cần chạy backend có đủ Passage APIs
  (bao gồm `counters`), đăng nhập CONTENT_MANAGER/ADMIN rồi mở route ở trên.
- Chưa chạy các bộ test Topic hay module khác theo phạm vi người dùng yêu cầu.

## Cập nhật luồng — 2026-11-26

Gộp hai nút Kiểm tra/Xuất bản thành một điểm vào **Kiểm tra và xuất bản**.
Bỏ hai chế độ của dialog; dùng một luồng kiểm tra, xác nhận checklist rồi bấm
**Xuất bản**. Giữ hai API GET readiness và POST publish; backend vẫn kiểm tra
lại khi xuất bản. Kiểm thử hiện có được cập nhật cho một nút DRAFT, tải/kiểm tra
trước khi xuất bản, chặn lỗi/revision cũ và yêu cầu xác nhận checklist.

Kiểm chứng của lần cập nhật này:

- `npm run build`: đạt; còn cảnh báo bundle lớn hơn 500 kB.
- `npm run lint`: đạt, 0 lỗi và 73 cảnh báo hiện có.
- `git diff --check` và `node --check tests/learning-path-passage-management.test.mjs`: đạt.
- Chưa chạy bộ test HTTP mô phỏng; không dùng kết quả mô phỏng để xác nhận tích hợp thật.
- Chưa kiểm chứng desktop/mobile hoặc luồng xuất bản với backend thật:
  yêu cầu qua FE proxy `localhost:3000/api/v1/auth/me` bị connection refused.
  Cần chạy FE/BE và đăng nhập CONTENT_MANAGER/ADMIN để kiểm chứng luồng mới.

## Ngưng sử dụng passage — 2026-11-26

Thêm nút Ngưng sử dụng cho ACTIVE tại cột Thao tác, bên trái menu ba chấm,
đối ứng vị trí Kiểm tra và xuất bản của DRAFT. Dialog xác nhận gọi API retire
với revision của dòng; success receipt phải khớp ID, RETIRED và revision kế tiếp
trước khi thông báo thành công. Các test hiện có được cập nhật/bổ sung cho nút
theo trạng thái, request JSON/ID encoding, xác nhận/chống gửi trùng, refetch,
lỗi tham chiếu ACTIVE, xung đột/mạng và hủy request khi sign out.

- `npm run build`: đạt; còn cảnh báo bundle lớn hơn 500 kB.
- `npm run lint`: đạt, 0 lỗi và 73 cảnh báo hiện có.
- `node --check tests/learning-path-passage-management.test.mjs` và `git diff --check`: đạt.
- Chưa chạy bộ test HTTP mô phỏng; chưa xác minh E2E qua FE proxy/backend thật.
- Công cụ Computer Use đã dừng khi chọn cửa sổ Edge vì không xác định được URL
  đủ chắc chắn. Chưa bấm xác nhận retire hoặc thay đổi dữ liệu thật; cần kiểm tra
  thủ công dialog, lỗi còn câu ACTIVE, thành công và bảng/counters sau refetch.
