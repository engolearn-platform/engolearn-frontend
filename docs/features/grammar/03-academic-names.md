# Grammar — tên thông dụng và sửa học thuật (22/11/2026)

Yêu cầu chủ dự án: dùng bộ hiện tại đã rà soát, tên cấu trúc tiếng Anh chuẩn và tên Việt phổ biến trong ngoặc, lưu dữ liệu và xem local. Giữ 32 chủ đề/65 bài, CEFR/order/UUID/code; không nhập 40 chủ đề ZIP chồng vào dữ liệu đang có.

## Data → route → component → state
Giữ title_en/title_vi riêng đúng ngôn ngữ. Chuẩn hóa cả Topic và Lesson theo cấu trúc thật đã dạy; không đặt tên kể chuyện thay cho tên ngữ pháp. Tên tiếng Anh có thể có biến thể chuẩn như Present Continuous/Present Progressive; chọn nhất quán Present Continuous, không tuyên bố chỉ có một tên hợp lệ.
Learner /grammar, topic, theory, summary dùng GrammarName trong GrammarLearningUi: English name (Tên Việt). Giữ token, layout, route và API; chỉ render khác thứ tự tên. Admin vẫn chỉnh hai trường riêng để tránh trộn ngôn ngữ trong DB.

Áp dụng 5 sửa nội dung seed đã review; đối chiếu DB mới nhất trước ghi. Chỉ sửa qua Admin API với version CAS; bài published sửa Nháp rồi apply để tạo revision mới, không thay phiên/tiến độ hoặc revision cũ. 31 chủ đề chưa xuất bản giữ Nháp; chỉ mẫu A1 đã được duyệt tiếp tục hiển thị học viên. Không tự xuất bản toàn bộ.

## UI-only và responsive
Thay cách ghép tên, không thay cơ chế học/chấm/mở khóa. Tên dài cho phép xuống dòng, English mạnh hơn phần Việt, lang=en/vi đúng; không hardcode font/màu/radius và không sửa shell nhóm.

## Checklist
- Chuẩn hóa 32 Topic/65 Lesson, đúng nội dung, không đổi định danh/schema/order/level.
- Seed chuẩn đạt DTO/checklist production, ghi nhận tên trước/sau.
- Live API đọc lại đủ tên/nội dung; published đúng 1 Topic/3 bài; progress/session/revision cũ giữ nguyên.
- FE build/lint, mở browser local kiểm tra roadmap → topic → theory, tên không lặp dòng Anh, mobile không tràn.
- Backup trước cập nhật; không main/commit/push/module khác.

## Kết quả 23/11/2026
Đã áp dụng seed và MongoDB dev qua Admin API. 31 Topic metadata/65 Lesson được cập nhật; 3 revision published mới. 31 Topic khác giữ Nháp. Đã xem UI thật roadmap/topic/theory, build đạt, lint 0 lỗi/72 cảnh báo có sẵn. Browser xem lý thuyết ghi seen như bình thường; không đặt lại bestScore/hoàn thành. Chưa kiểm tra riêng từng kích thước điện thoại.
