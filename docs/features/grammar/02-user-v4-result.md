# Hoàn thiện Grammar User v4 — 22/11/2026

## Kết quả

Đã tích hợp vào đúng FE/BE ở `D:/TrenLop/WWWJava/Nhom/EngoLearnApp`, trên nhánh FE `fix/placement-guest-navbar` và BE `merge/placement-guest-user-main`. Tên nhánh có Placement vì đây là checkout hiện tại được chủ dự án yêu cầu tái sử dụng; lượt này chỉ sửa source **Grammar**, không sửa nghiệp vụ Placement hoặc module học theo chủ đề `src/features/topic`.

Đã fetch main để đối chiếu: tại thời điểm làm cả hai nhánh đều 11 commit ahead / 0 behind origin/main. Không merge, không commit/push, không sửa main. Những thay đổi có sẵn ở module khác trước lượt này được giữ nguyên.

## Các màn đã làm

| Màn | Hành vi hiện tại |
| --- | --- |
| Lộ trình ngữ pháp | Thẻ cấp CEFR và tiến độ thật, nhóm đã hoàn thành thu gọn; không có thẻ Tiếp tục học, không gắn cứng số chủ đề. |
| Chi tiết chủ đề ngữ pháp | Danh sách bài dạng hàng, mục tiêu/điểm cao nhất/khóa/cập nhật; giữ thao tác ôn và làm lại theo quyền BE. |
| Bài đọc | Accordion mở tự do, công thức còn thấy khi thu gọn, bấm xem nghĩa/phân tích ví dụ; không lưu vị trí đọc. |
| Luyện tập | 5 đoạn có nhãn/ký hiệu, MCQ chọn option ID, FIB nhập trực tiếp và Enter, phản hồi server, Dialog giải thích. |
| Kết quả | Câu sai hiện sẵn/câu đúng thu gọn; reload vẫn có đủ câu hỏi/đáp án đã nộp; làm lại đủ 5 câu, giữ Bài tiếp theo theo BE. |
| Tóm tắt | Route `/grammar/topics/:topicId/summary`, chỉ chủ đề completed; tổng hợp khối công thức/ghi nhớ/lỗi từ bài PUBLISHED, không ghi seen hoặc điểm. |

Giữ nguyên LearningLayout, sidebar/navbar và token nhóm. Không thêm CSS/theme/dependency chung. Focus-mode ẩn điều hướng của prototype không được đưa vào vì yêu cầu giữ layout chung. Khóa từng khối Đã hiểu, tiếp tục đọc dở và luyện riêng câu sai vẫn được hoãn theo phương án đã chốt.

## BE thay đổi gì

Chỉ bổ sung `type` và `prompt` vào FeedbackResponse của **câu đã nộp**, lấy từ revision được ghim của phiên. Giữ các trường cũ, chấm điểm/quyền/session/transaction/idempotency như trước. Không thêm collection hoặc trường persistence; không cần migration hay seed lại dữ liệu Grammar.

## Kiểm chứng đã chạy

- FE `npm run build`: đạt trước và sau thay đổi; vẫn có cảnh báo bundle lớn của ứng dụng, không phải lỗi build.
- FE `npm run lint`: exit 0, **0 error / 72 warning** ngoài phần source Grammar thay đổi. Không sửa module khác để dọn warning.
- Lint riêng `src/features/grammar`: exit 0, không warning/error.
- BE `mvnw.cmd -q -DskipTests compile`: exit 0. Không khẳng định toàn bộ test BE đã sạch; các lỗi ngoài Grammar của lượt trước không được sửa trong phạm vi này.
- Kiểm tra RED trên API thật trước sửa: feedback thiếu prompt. GREEN sau sửa trên cùng runtime code: có type/prompt; đáp án/acceptedAnswers/giải thích không xuất hiện ở câu chưa nộp.
- FE Vite proxy :13000 → BE thật :18080 → MongoDB replica set: dùng **bản sao bộ dữ liệu Grammar thật 32 chủ đề/65 bài và tài khoản hiện có**, không tạo bộ câu hỏi fixture/mock. Chỉ publish mẫu A1 ở DB kiểm thử. Kiểm tra locked lesson, resume giữ thứ tự/phương án, gửi trùng không tăng bộ đếm, reload result đủ 5 phản hồi, 3/5 mở bài sau, làm lại 2/5 không hạ completed/bestScore, hoàn thành ba bài và phiên quá 30 phút bị từ chối: đạt.
- Quyền USER thật trên bản sao: dùng learner APIs được, Admin APIs trả 403. Không đổi vai trò tài khoản ở DB local chính.
- Summary gọi các GET tương ứng: tiến độ trước/sau giữ nguyên.
- Trình duyệt: đăng nhập, Roadmap → bài đọc → bật nghĩa → MCQ đúng/sai → Dialog → FIB Enter → kết quả 4/5 → reload → tóm tắt: đạt. Đo DOM không tràn ngang ở 390px/1280px; ảnh chụp đã rà ở viewport điện thoại/mặc định, nội dung và sidebar desktop xác nhận qua accessibility tree. Viewport trả về mặc định sau kiểm tra.
- Review độc lập chỉ đọc đúng phạm vi 14 file FE + 2 file BE: không có finding quan trọng. Không coi review tĩnh là thay thế integration.

## Trạng thái dữ liệu local và chạy thử

Sau khi chủ dự án đồng ý, đã xuất bản **riêng Grammar A1 Thì hiện tại đơn / ENG-GRM-T0001 / 3 bài**, mỗi bài đạt checklist 14/14. Đọc lại learner API xác nhận nhìn thấy bài đầu được mở. Đối chiếu trước/sau: 31 chủ đề còn lại không thay đổi, vẫn Nháp; nội dung học liệu không bị sửa. Không nạp lại bundle hoặc thay dữ liệu các module khác.

1. Bật Docker/MongoDB theo cấu hình `.env` đang dùng.
2. Chạy `EngolearnApplication` trong BE và `npm run dev` trong FE tại D như thông thường. Hiện hai tiến trình này đã được bật để kiểm tra. Nếu bấm Run BE trong IDE khi instance này còn chạy, cần dừng instance cũ trước để tránh chiếm cổng 8080; không đổi cổng/config để che lỗi.
3. Đăng nhập tài khoản học viên hiện có; mở `http://localhost:3000/grammar` → A1 → Thì hiện tại đơn → bài đầu.
4. Đọc, làm đủ 5 câu; ≥3/5 mở bài sau. Khi hoàn thành cả ba bài, vào Tóm tắt chủ đề. Các cấp/chủ đề khác chưa xuất bản thì hiển thị trạng thái chờ nội dung đúng nghiệp vụ.

Không thêm tài khoản local mới. Admin chung hiện có tiếp tục quản lý Grammar; không tạo login riêng cho tính năng mới. Bundle JSON dùng chung vẫn DRAFT để thành viên khác tự duyệt xuất bản, không tự phát hành nội dung chỉ vì import.

OQ tích hợp current_level/max_achieved_level từ hồ sơ/Placement là giới hạn đã ghi trước đây: Grammar hiện vẫn mặc định A1 và mở cấp theo tiến độ Grammar. Lượt UI này không tự đổi module User/Placement để xử lý OQ đó.

## File source thay đổi ở lượt User v4

FE (14 file, toàn bộ trong `src/features/grammar/`):

- `src/features/grammar/components/CefrTabs.tsx`
- `src/features/grammar/views/GrammarRoadmapView.tsx`
- `src/features/grammar/components/GrammarTheoryBlock.tsx`
- `src/features/grammar/components/GrammarPracticeSteps.tsx`
- `src/features/grammar/components/GrammarPracticeQuestion.tsx`
- `src/features/grammar/components/GrammarPracticeResultCard.tsx`
- `src/features/grammar/views/GrammarTopicView.tsx`
- `src/features/grammar/views/GrammarTopicSummaryView.tsx`
- `src/features/grammar/views/GrammarTheoryView.tsx`
- `src/features/grammar/types/grammar.types.ts`
- `src/features/grammar/services/grammar-learning.service.ts`
- `src/features/grammar/hooks/useGrammarLearning.ts`
- `src/features/grammar/routes.ts`
- `src/features/grammar/views/GrammarPracticeView.tsx`

BE (2 file, toàn bộ trong package Grammar):

- `src/main/java/fit/iuh/engolearn/grammar/dto/GrammarLearnerResponses.java`
- `src/main/java/fit/iuh/engolearn/grammar/mapper/GrammarPracticeMapper.java`

Tài liệu FE: `00-grammar-learning.md`, `01-user-v4-design.md`, `02-user-v4-result.md`, `docs/superpowers/plans/2026-11-22-grammar-user-v4.md`. Tài liệu BE: `grammar-v2-runtime.md`, `grammar-user-v4-result.md` và ghi chú trạng thái mới trong `grammar-curriculum-load-result.md`.

## Phần chưa đưa vào lượt này

Không lưu checkpoint khối đọc, không luyện riêng câu từng sai, không thẻ tiếp tục học, không semantic coloring tùy tiện cho công thức plain text, không thêm tóm tắt do AI sinh. Các trạng thái/version/khóa lấy BE thay vì trạng thái gắn cứng của HTML demo. Chưa xuất bản 31 chủ đề còn lại, cần duyệt học liệu theo workflow Admin.
