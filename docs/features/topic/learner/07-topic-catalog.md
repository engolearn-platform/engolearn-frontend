# Learner — Khám phá, Chủ đề của tôi và Chi tiết (chặng 2)

Ngày 2026-10-27. Contract chặng1 giữ nguyên để BE triển khai song song.

## Nguồn và phạm vi

Ảnh tham chiếu người dùng gửi ngày2026-10-27 + docs/design-system. Luật F01/F02 đã chốt ở repo nghiệp vụ.
GET/POST thật qua topicApi; không fallback mock khi BE thiếu endpoint.
UI test có server fixture riêng trong tests/support, chỉ được dùng khi khởi chạy lệnh kiểm thử tường minh.

## Routes và cấu trúc

- /topics: Khám phá, URL q/level/sort. level=mine tương ứng level hiện tại; guest không có lựa chọn này.
- /my-topics?tab=in-progress hoặc completed: hai nhóm, có số đếm, không tìm kiếm/lọc level.
- /topics/:topicId?from=<catalog URL>: chi tiết standalone, quay lại đúng trang nguồn và bộ lọc. from chỉ chấp nhận hai route nội bộ trên.
- /topics/:topicId/attempts/:attemptId?mode=learn hoặc review&from=...: điểm vào lượt học, lấy đúng attempt/position/version thật. Chặng2 chỉ hiển thị thông tin lượt đã lưu. Chặng3 đã nối khung học/advance (08-attempt-learning.md); quiz/review đầy đủ ở chặng4–5. Không chuyển người học vào mock cũ.

TopicViewerLayout ở feature sở hữu provider. TopicCatalogLayout tái sử dụng sidebar/bottom-nav app shell qua props; detail không gắn mock progress provider cũ.
Components: TopicCard (cả thẻ là Link), TopicFilterChips controlled, TopicState, TopicItemCard; không preview nội dung từ/mẫu câu trong outline.

## State và dữ liệu

Viewer lấy từ endpoint viewer, không đoán guest/A1 khi lỗi. Server state qua useFetch; lỗi giữ status/code.
Danh sách tải thêm bằng cursor; các trang đã tải vẫn còn khi tải trang sau lỗi. Dedupe theo topicId; đổi viewer/filter/tab remount data scope và hủy request cũ.
Tìm kiếm debounce350ms; back/forward đồng bộ input. Đặt lại xóa keyword/level/sort.
Chi tiết và progress tải riêng: lỗi progress không làm mất outline hoặc giả progress0%. Guest không gọi progress/mine.
Backend trả quyền thao tác, FE không suy tất cả quyền từ một cờ locked. Topic cao level vẫn bấm xem chi tiết.
Start/retry dùng mutation identity lưu theo viewer/action trong sessionStorage; lỗi mạng giữ key khi thử lại. Không gửi mutation đồng thời; không tự retry.
Đổi danh sách chỉ sau start thành công; quay lại catalog fetch lại, không cache membership ở module/global.
Retry thay phiên dở cần Dialog xác nhận và đúng replaceRetrySessionId. Review không tạo attempt.

## Responsive và kiểm tra

Grid1 cột ->2 ->3; trang detail1 cột -> nội dung+sidebar; padding20px mobile, chữ Việt không cắt dòng vào dấu.
Header/sidebar dùng viewer thật, không fake streak/tên/level trong surface topic.
Kiểm tra native reducer/filter/route/error/service shape + API tests chặng1 + build/lint.
Kiểm tra browser bằng fixture phải ghi rõ là mock network test, phân biệt smoke với BE thật.
