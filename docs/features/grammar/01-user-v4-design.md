> UX refinement24/11/2026: owner-approved simplification follows [implementation plan](README.md). Existing routes, roles and business transitions are retained.

# Grammar User v4 — thiết kế đã điều chỉnh theo nghiệp vụ

Ngày 22/11/2026. Người dùng chốt phương án giữ nghiệp vụ hiện tại và hoàn thiện tuần tự theo review v4. ZIP là nguồn bố cục/thao tác, không phải nguồn dữ liệu hoặc thuật toán chấm.

## Approaches

1. Chọn: áp dụng bố cục v4 cho các view Grammar đang có, giữ API/điểm/mở khóa; mở rộng phản hồi câu đã nộp và thêm trang tóm tắt bằng nội dung thật.
2. Hoãn: bê cả lưu khối đọc dở, thẻ Tiếp tục học và luyện riêng câu sai; mâu thuẫn BR-F1.10, BR-F2.3 và quy tắc đủ 5 câu, cần đặc tả riêng.

## Màn và dữ liệu

- Roadmap `/grammar`: bốn thẻ cấp có trạng thái chọn/khóa/tiến độ; mọi Topic PUBLISHED của cấp mở đều chọn được; tách nhóm chưa hoàn thành/đã hoàn thành mà giữ order trong từng nhóm. Không gợi ý sai chủ đề tiếp theo, không thẻ Tiếp tục học. Dùng số lượng API. Nhãn liên kết trên từng card: IN_PROGRESS → “Tiếp tục học”, NOT_STARTED → “Xem chủ đề”, COMPLETED → “Ôn lại chủ đề”. Tên truy cập của liên kết khớp nhãn và tên chủ đề. Tất cả vẫn dẫn vào danh sách bài của đúng chủ đề, không chọn bài theo điểm hoặc tự tạo thẻ tiếp tục riêng.
- Topic `/grammar/topics/:topicId`: card tiến độ, tên song ngữ, lesson rows gồm mục tiêu, trạng thái, điểm cao nhất và nhãn cập nhật. Giữ khóa tuần tự và trạng thái rỗng/lỗi.
- Theory đường dẫn Lesson hiện có: các khối dùng details/summary, đọc theo thứ tự nhưng mở tự do; công thức còn thấy khi thu gọn; ví dụ bấm hiện nghĩa. Không theo dõi Đã hiểu, không lưu vị trí đọc. Giữ useGrammarSeen chỉ ghi nhận khi thật sự hiển thị; nút Practice sau khối cuối.
- Practice route/session hiện có: thanh năm bước có ký hiệu đúng/sai; FIB nhập vào ____ và Enter; MCQ gửi option ID; phản hồi giữ câu vừa nộp đến khi bấm tiếp; Dialog xem lại lời giải/quy tắc dùng thành phần chung. Không lộ đáp án chưa nộp, không gán cứng giải thích mẫu. Thông báo phiên 30 phút đúng Practice.
- Result cùng route Practice: điểm lượt này, thông báo theo server, các câu sai mở sẵn và câu đúng thu gọn. Chưa đạt làm lại đủ 5 câu; giữ nút Bài tiếp theo khi BE cung cấp. Không trộn điểm giữa hai lượt, không tự chuyển bài.
- Summary mới `/grammar/topics/:topicId/summary`: chỉ Topic COMPLETED; tổng hợp FORMULA, RULE_QUICK_NOTE, COMMON_MISTAKE từ Lesson PUBLISHED được API cho phép; render đủ loại hiện có, không sinh nội dung/tóm tắt AI mới. Trang chỉ đọc, không markSeen, không tăng attempt hay tiến độ. Phiên bản thay đổi/archived được xử lý như lỗi tải, không hiển thị nháp.

## API và schema

Giữ ba collection chính và collection kỹ thuật hiện có. FeedbackResponse thêm `type`, `prompt` từ revision đã ghim, chỉ cho câu đã trả lời. Đây là mở rộng DTO không cần migration/seed mới; không trả các câu chưa làm hay acceptedAnswers. FE dùng phản hồi này cho xem lại kết quả sau reload. API mở khóa/điểm/quyền sở hữu giữ nguyên. OQ tích hợp level hồ sơ vẫn là giới hạn có sẵn, không tự sửa module User/Placement.

## UI và phạm vi

Giữ LearningLayout/sidebar/navbar nhóm trên các route hiện có; không sửa shared shell để ẩn menu như prototype. Tập trung bằng cột đọc, header và điều khiển trong Grammar. Dùng Hanken Grotesk, primary/on-primary, learning-mint/note và scale dự án; không thêm CSS/theme chung hoặc font/màu gắn cứng của demo. Dùng Button, Card, Dialog chung; details/summary semantic vì app chưa có primitive Accordion. Không tạo folder app ngoài cấu trúc module.

## Kiểm tra và giới hạn

Build + lint FE; compile BE; kiểm tra thật qua FE proxy/BE/MongoDB. Không dùng mock hoặc fixture làm bằng chứng tích hợp. Kiểm tra đáp án chỉ xuất hiện sau nộp, result sau reload, 3/5 và 2/5, làm lại không mất bestScore, thứ tự/khóa, session hết hạn và tóm tắt không ghi tiến độ. Dùng dữ liệu Grammar thật, không thêm học liệu rác. Không tự publish toàn bộ bộ Nháp. Dùng nhánh và checkout D hiện tại theo yêu cầu, không tạo thêm worktree, không commit/push/main.

## UX24/11/2026

Tên chủ đề roadmap dùng text-title-md, nhỏ hơn tiêu đề mục. Bài học dùng số bài ở vòng tròn và một StatusBadge, tránh hai dấu tích hoàn thành. API topic.lessons[].blockCount là số khối của bản Published, không phải số loại khối hay bản Draft; không thêm request cho từng bài. Vòng tiến độ SVG dùng percent từ BE và aria-valuetext completed/total. Câu luyện tập giữ nguyên lời văn, thêm dòng trắng trước chỉ dẫn Choose/Complete/Select… khi đứng sau câu ngữ cảnh; áp dụng cả phần câu hỏi và phản hồi, giữ chỗ trống/đáp án/chấm điểm.
