> Quy tắc mở cấp cập nhật 23/11/2026: hoàn thành tối thiểu70% chủ đề đủ điều kiện của cấp trước, làm tròn lên bằng số nguyên. Chủ đề phải hoàn thành đủ tất cả bài Published; mỗi bài vẫn3/5. Giữ mọi unlock đã lưu và quyền từ profile; không tự nâng level User. Xem [thiết kế và kiểm chứng](09-unlock-70-review.md).

> Cập nhật tích hợp level 23/11/2026: Grammar đọc UserLevelLookup, mở cấp đến level hồ sơ (C1/C2 giới hạn B2), không tự hoàn thành bài hoặc nâng level User. MVP dùng cefr_level chỉ tăng; hai trường latest/max riêng vẫn hoãn. Ghi chú mặc định A1/hoãn toàn bộ tích hợp bên dưới là lịch sử. Xem tài liệu grammar-placement-level-integration.md ở BE và 06-placement-level-integration.md ở FE.

# Grammar Learning

**Mục tiêu.** Hoàn thành GRM-UC-001 đến GRM-UC-004 từ roadmap, chi tiết chủ đề và lý thuyết đến Practice và kết quả.

**Cấu trúc.** Giữ các thư mục đang có của Grammar. FE dùng `routes.ts`, `views`, `components`, `hooks`, `services` và `types`; ghép vào layout học viên của nhóm. BE dùng `controller`, `dto`, `service`, `repository` và `model` tương tự Placement. Dữ liệu nội dung lấy từ bản Grammar Admin đã xuất bản.

**Thiết kế.** Dùng kiểu giao diện học viên của EngoLearn và các thành phần chung. Roadmap có bốn tab CEFR, tiến độ và danh sách chủ đề. Chi tiết hiển thị bài học theo thứ tự. Các màn lý thuyết, câu hỏi và kết quả dùng một cột đọc, điều khiển bằng bàn phím và xếp dọc trên màn hình hẹp.

## Hợp đồng API

Các endpoint dưới đây dùng tiền tố `/api/v1/grammar`, trả `ApiResponse.data` và xác thực theo tài khoản hiện tại.

| Thao tác | Dữ liệu |
| --- | --- |
| GET `/roadmap` | `{currentLevel,newlyUnlockedLevels,levels}`. Mỗi level có `{level,unlocked,completedTopics,totalTopics,percent,lockHint,topics}`. |
| GET `/topics/{topicId}` | `{topic,lessons}`. Topic có `{id,titleVi,titleEn,description,level,status,completedLessons,totalLessons,percent}`. Lesson trong danh sách có `{id,number,titleVi,titleEn,objective,status,unlocked,bestScore,hasUpdate,blockCount}`. |
| GET `/topics/{topicId}/lessons/{lessonId}` | `{topicId,id,number,titleVi,titleEn,objective,status,contentVersion,blocks}`. Lấy từ nội dung xuất bản. |
| POST `/topics/{topicId}/lessons/{lessonId}/seen` | Body `{contentVersion}`. Gọi khi FE đã hiển thị nội dung. Trả về phiên bản đã xem cao nhất. |
| POST `/topics/{topicId}/lessons/{lessonId}/practice` | Body `{restart?:boolean}`. Bắt đầu, tiếp tục hoặc làm lại từ đầu. |
| GET `/practice/{sessionId}` | Đọc phiên theo ID và chủ sở hữu để tải lại. |
| POST `/practice/{sessionId}/answers` | Body `{requestId,questionId,answer}`. Trả `{feedback,session}`. |

Practice session có `{id,topicId,lessonId,status,contentVersion,answeredCount,totalQuestions,question,feedback,result,expiresAt}`. Question có `{id,number,type,prompt,options:[{id,text}]}`. FE gửi mã option với trắc nghiệm, chuỗi nhập với điền khuyết. Feedback có `{questionId,number,correct,submittedAnswer,correctAnswer,explanation,type,prompt}` chỉ cho câu đã nộp. Result có `{score,totalQuestions,passed,completed,topicCompleted,nextLessonId,archived,newlyUnlockedLevels}`. ID rỗng và kết quả chưa có dùng `null`. Trạng thái học là `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`; chủ đề bị khóa hiển thị `LOCKED`; phiên kết thúc hiển thị `SUBMITTED`. Phiên không còn hiệu lực trả `SESSION_EXPIRED`.

Phiên trả `feedback` dưới dạng danh sách các câu đã nộp theo thứ tự. Thao tác nộp một câu trả thêm một đối tượng `feedback` cho chính câu vừa được xử lý. Mã câu và mã phương án có phạm vi trong phiên. Điểm là số câu đúng trên năm câu.

Khi nội dung bị lưu trữ trong lúc đang làm, phiên tiếp tục theo bản đã ghim và kết quả vẫn được ghi. Lượt đạt chỉ được tính vào tiến độ hiện hành sau khi bài học xuất bản lại. Nếu điều hướng tới bài tiếp theo còn khả dụng, kết quả chỉ trỏ tới bài liền sau trong cùng chủ đề theo nội dung đang xuất bản.

## Giao diện học viên

| Đường dẫn | Màn hình |
| --- | --- |
| `/grammar` | Roadmap mở tab theo trình độ hiện tại, hiển thị tiến độ và gợi ý mở khóa từ API. |
| `/grammar/topics/:topicId` | Tiến độ chủ đề, danh sách bài học và nhãn cập nhật. Bài đã hoàn thành có thể vào Practice ngay. |
| `/grammar/topics/:topicId/summary` | Tóm tắt công thức, ghi nhớ và lỗi thường gặp từ Lesson PUBLISHED của chủ đề COMPLETED; chỉ đọc, không ghi tiến độ. |
| `/grammar/topics/:topicId/lessons/:lessonId` | Lý thuyết theo thứ tự API và nút luyện tập sau khối nội dung cuối. |
| `/grammar/topics/:topicId/lessons/:lessonId/practice?session=:sessionId` | Tải phiên đang làm hoặc kết quả đã chốt theo mã phiên. |

Các màn dùng layout học viên hiện có. Đăng nhập giữ đường dẫn gốc để quay lại. Lý thuyết gửi `seen` sau khi khối đầu tiên xuất hiện trong vùng nhìn của tab đang hiển thị, với đúng phiên bản đã tải. Màn lý thuyết đợi máy chủ xác nhận lượt xem đầu tiên trước khi bật nút luyện tập. Tên chủ đề và bài học hiển thị tiếng Anh trước, tên Việt trong ngoặc: English name (Tên tiếng Việt). Dữ liệu vẫn giữ hai trường ngôn ngữ riêng; xem [chuẩn hóa tên và học thuật](README.md). Trong các cặp câu ví dụ, câu tiếng Anh có trọng lượng chữ cao hơn bản dịch.

Practice giữ nguyên câu vừa xác nhận và hiển thị phản hồi của server đến khi người học chọn câu tiếp theo hoặc xem kết quả. Khi tải lại, phiên đang làm mở câu chưa trả lời tiếp theo. Nếu chưa nhận được phản hồi khi gửi câu, thao tác gửi lại dùng cùng mã yêu cầu và cùng câu trả lời. Khi phiên hết hiệu lực, trang chuyển về lý thuyết, hiện thông báo và để người học chủ động bắt đầu lượt mới.

## Trình tự

- [x] BE roadmap và chi tiết chỉ chiếu nội dung `PUBLISHED`, tính trạng thái và ngưỡng mở khóa bằng số nguyên, lưu mở khóa vĩnh viễn. Ghi nhận phiên bản lý thuyết đã hiển thị qua endpoint riêng.
- [x] BE Practice ghim revision đã xuất bản, buộc thứ tự trên server, kiểm tra quyền sở hữu, giữ một phiên hoạt động theo người học và bài. Hết hạn 30 phút. Ghi kết quả một lần và chốt điểm, tiến độ, mở khóa trong cùng giao dịch. Xử lý phiên đang làm khi nội dung bị cập nhật hoặc lưu trữ.
- [x] FE thay lộ trình mẫu bằng dữ liệu từ API. Dùng chung layout Learner và luồng đăng nhập. Thêm chi tiết chủ đề, bài học, Practice và kết quả. Giữ lượt dở khi tải lại, giữ mã gửi khi thử lại sau lỗi mạng, hiển thị giải thích sau xác nhận.
- [x] Chạy build, lint và kiểm thử qua Vite, BE thật và MongoDB replica set tạm. Tạo nội dung kiểm thử qua Grammar Admin, rồi thử quyền, tiến độ, đạt 3/5, lưu phiên, tải lại, gửi trùng và xuất bản revision mới.

UserLevelLookup là nguồn level hồ sơ hiện hành; Grammar hợp quyền từ profile với unlock tiến độ đã lưu. Chỉ hai trường current_level/max_achieved_level riêng còn hoãn; không mặc định A1 cho mọi tài khoản. Xem [tích hợp level](06-placement-level-integration.md).

## Chạy local

1. Chạy MongoDB replica set và `EngolearnApplication` với profile `dev` từ worktree BE.
2. Chạy `npm run dev` từ worktree FE. Content Manager tạo chủ đề, bài học và câu hỏi ở `/admin/grammar`, rồi xuất bản.
3. Dùng tài khoản học viên tại `http://localhost:3000/grammar` để mở bài, làm đủ năm câu và kiểm tra tiến độ sau khi tải lại.

## User UI v4 — cập nhật 22/11/2026

Thiết kế được chủ dự án chốt: [01-user-v4-design.md](01-user-v4-design.md). [Bàn giao hiện hành](README.md). Chỉ cập nhật Grammar; giữ LearningLayout/sidebar/navbar của nhóm. Các route/result vẫn dùng API thật; không lấy dữ liệu/chấm điểm từ HTML demo.

- Roadmap có bốn thẻ cấp CEFR, tiến độ thật và nhóm chủ đề đã hoàn thành thu gọn. Không có thẻ Tiếp tục học, không gắn cứng 10 Topic hoặc 2 Lesson. Topic rows giữ khóa tuần tự, hasUpdate và bestScore.
- Theory dùng accordion mở tự do, công thức xem được khi thu gọn; ví dụ bấm hiện nghĩa/phân tích. Bài completed mở sẵn các khối. Không lưu khối đã hiểu/vị trí đọc; giữ seen khi nội dung hiển thị thực sự.
- Practice có năm đoạn có ký hiệu và nhãn đúng/sai/chưa trả lời; FIB nhập ngay tại ____ và Enter; MCQ gửi option ID. Giữ phản hồi server trước khi sang câu sau. Dialog giải thích lấy từ feedback của revision đã ghim, không ghép quy tắc của bản mới.
- Feedback BE bổ sung type/prompt **chỉ cho câu đã nộp**. Nhờ vậy result sau reload vẫn có nội dung câu, câu sai mở sẵn/câu đúng thu gọn. Không trả acceptedAnswers/câu tương lai; không đổi collection hoặc cách chấm.
- Chưa đạt thì làm lại đủ 5 câu; giữ các nút điều hướng theo BE, không trộn đáp án các lượt. Best score và completed không giảm khi làm lại điểm thấp.
- Summary chỉ mở từ chủ đề completed, gọi getTopic rồi getTheory của từng bài xuất bản; không gọi seen/startPractice và không có bản tóm tắt giả trong DB.

Lưu ý khi chạy local: nội dung Nháp không xuất hiện ở learner. Ngày 22/11/2026 chủ dự án cho phép xuất bản riêng mẫu A1 Thì hiện tại đơn (3 bài); các chủ đề còn lại giữ Nháp. Trạng thái thực tế và kết quả kiểm tra ở [báo cáo triển khai](README.md).

## Team dev integration — 23/11/2026

See [shared authorization and audio integration](04-team-dev-integration.md) for current route guards, ADMIN WAV upload, real playback errors and verification. Existing team layouts are retained.

## Hỗ trợ học và điều hướng

Lời nhắc nhẹ cạnh nút luyện tập; review có đường về danh sách bài, bảng có nút Kiểm tra. Không thêm Ready toggle hoặc chặn theo thao tác đọc. Xem [thiết kế điều hướng](07-learning-management-navigation.md).
