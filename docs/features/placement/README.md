# Placement Test — bàn giao frontend

- [Luồng Guest/User, routes và từng màn](learner/README.md)
- [Quản trị ngân hàng / bộ đề / kết quả](management/README.md)
- [Tích hợp Auth/media dùng chung](../grammar/04-team-dev-integration.md)

Chạy `npm ci`, `npm run dev`; mở `/placement` hoặc `/admin/placement`. BE dùng EngolearnApplication với đúng một profile dev/prod, cookie Auth và Mongo replica set. Hướng dẫn BE hiện hành: `docs/technical/placement/README.md`; seed hiện hành: `tools/mongo-json-importer/samples/placement/README.md`. Merge code không tự sao chép database; không dùng kết quả/tiến độ cá nhân làm seed.

Guest làm trước, đăng nhập để nhận kết quả; User đi thẳng kết quả. ADMIN kế thừa quyền học nhưng vẫn có ownership; tra cứu quản trị chỉ đọc. Lượt mới chọn đề Published ngẫu nhiên; resume giữ đề và thời gian. Bỏ trống được tính trong Sai ở kết quả cuối, không giả đáp án đã chọn.

Kết quả quản trị giữ lọc mã lượt/User, mã bộ đề có gợi ý tên, trạng thái, CEFR và ngày; không có ô lọc phiên bản trong GUI. Version lịch sử vẫn hiển thị và BE vẫn hỗ trợ để giữ tương thích. Tên phải khớp đúng ID/version khi tải trang trực tiếp hoặc reload.

Kiểm tra build/lint/auth và các test tích hợp Placement trong `tests/` với FE proxy/BE thật; truyền credential qua process environment riêng. Thiếu input/skip không phải là đã xác minh. Không commit mật khẩu/cookie hoặc mock phản hồi HTTP để kết luận tích hợp.
