# Lát 1 — public catalog dùng BE thật

User yêu cầu không dùng mock/fixture nữa. Dừng preview4318, bỏ launcher fixture; dùng FE3000 proxy BE8080.
Phạm vi: guest viewer thực tế khi BE chưa có auth; GET topics/search/filter/cursor và GET detail với metadata/counts từ DB hiện tại. Không gán learner/CEFR/progress giả, không seed/reset DB.
BE mở rộng response hiện hữu cho UI: total, totalItemCount, metadata tổng của detail; progress=null và actions yêu cầu đăng nhập trong public slice. Các route học còn dùng provider giả cũ không được FE mở.
Chưa tuyên bố xong My Topics/start/attempt/quiz/retry; các lát sau cần danh tính thật và endpoint đã xác minh.
Kiểm chứng: compile/package BE không chạy test mock, build/lint FE, đọc API thật qua proxy và browser mở catalog -> detail. Không dùng fixture hoặc injected fetch để chứng minh integration.

## Bằng chứng lát public (2026-10-27)

BE package PASS với -Dmaven.test.skip=true; không chạy test mock. FE build PASS (cảnh báo chunk cũ), lint0 errors/70 warnings.
FE http://localhost:3000 -> BE http://localhost:8080. Viewer200 GUEST, không dùng provider user/level giả.
API trực tiếp và proxy trả cùng3 topic/cùng ID; pagination2+1 không trùng, total3, empty search0, detail404 đúng.
Browser thật: lọcB1 -> detail Phong van xin viec -> back giữfilter; reset/search san bay -> detail O san bay. Metadata detail18 từ vựng bằng tổng6 item; không tiến độ giả.
Preview4317/4318 đã dừng, launcher và serverfixture đã xóa. DB không bị seed/reset/migrate, không gọi learning mutation.
Chỉ public read slice được xác minh; My Topics/start/attempt/quiz/retry chưa được xác minh. User đã chọn dùng hồ sơ học viên thật trong DB qua cấu hình local cho lát kế tiếp, chưa có auth.

## Lát hồ sơ local và học nội dung — đã chạy thật (2026-10-27)

- User chọn hồ sơ lưu DB qua cấu hình local, cho phép chọn tên/level tiện kiểm tra. Đã tạo Học viên local/A2 trong topic_learner_profiles và chọn ID qua TOPIC_LOCAL_LEARNER_ID ở .env gitignored. Không seed/reset topic/version/quiz/tiến độ.
- MockCurrentUserProvider/MockLearnerLevelProvider đã bỏ khỏi Spring runtime. Viewer và mọi API học đọc cùng hồ sơ thật. Cấu hình này chưa phải auth; khi chọn local learner, API topic chỉ nhận loopback.
- FE3000 proxy BE8080; preview4317/4318 đã gỡ. CORS cho phép đúng localhost:3000 và127.0.0.1:3000. Lỗi browser đầu tiên là403 CORS, đã xác định bằng request có Origin và sửa; không phải500 như nhận định ban đầu.
- Browser thật: mở topic -> bắt đầu CONTEXT/0 -> VOCAB -> reload -> xem lại Context giữ14% -> quay frontier -> học3 từ và2 purposes -> FILL_BLANK/0 tại85%, revision6.
- Topic đã rời discover (3->2), mine có1 IN_PROGRESS, completed0. Sidebar thật ghi3/18 từ,4/24 mẫu câu,0/6 quiz;0/6 bài hoàn thành đúng vì chưa làm quiz.
- Request replay cùng key/body chỉ tăng revision1 lần; revision cũ trả409 không đổi vị trí. Hồ sơA2 start topicB1 trả422 LEVEL_TOO_LOW.
- PUT item position cũ và GET item content cũ trả410; chỉ content theo owned attempt được dùng. Các route learner legacy redirect về detail thật, không mount provider/mock cũ.
- Nội dung như word1/word2 và các URL media lấy từ snapshot DB hiện có; không thêm nội dung minh họa hoặc fallback ảnh/audio giả. Media playback không được xác minh.
- BE package PASS với maven.test.skip=true; FE build PASS và lint0 errors/70 warnings. Không chạy mocked suites, không chạy mvn verify đầy đủ. Bằng chứng là API và browser thật trong phạm vi trên.
- Quiz/answer/result/review/retry đầy đủ vẫn là lát sau; không đánh dấu item/topic COMPLETED giả. Chưa xác minh nhiều profile đồng thời, publish/hide/version changes hoặc phục hồi lỗi hạ tầng.
- Personal catalog hiện đọc tập published để tính/filter/cursor trước phân trang; chưa tối ưu truy vấn cho catalog lớn.

Cách chọn hồ sơ: POST /api/v1/topic-learning/local-profiles với displayName và cefrLevel thật, lưu learnerId trả về vào TOPIC_LOCAL_LEARNER_ID trong .env rồi restart BE. Endpoint tạo hồ sơ chỉ nhận loopback. Không commit .env.
